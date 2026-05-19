import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = body.message || '';
    const history = body.history || [];

    if (!userMessage) {
        return NextResponse.json({ reply: "สวัสดีครับ! แอดมิน AI จาก Auto1 ยินดีให้บริการ สนใจเช็คสเปคหรือราคายาง/แบตเตอรี่รถรุ่นไหน แจ้งได้เลยครับ เช่น 'Altis 2018 ใช้ยางขนาดเท่าไหร่'" });
    }

    // ดึง API Key จาก Database (ถ้าไม่มีให้ fallback ไปที่ .env)
    const config = await prisma.shopConfig.findFirst();
    const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
       return NextResponse.json({ reply: "ขออภัยครับ ระบบ AI กำลังอยู่ในช่วงอัปเกรด (ยังไม่ได้ใส่ API Key) รบกวนผู้ดูแลระบบไปตั้งค่า API Key ในระบบ Admin ด้วยครับ" });
    }

    // เรียกใช้ Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);

    // ดึงฐานความรู้ (KM)
    const kbs = await prisma.knowledgeBase.findMany({ where: { isActive: true } });
    const kmText = kbs.map(kb => `Q: ${kb.question}\nA: ${kb.answer}`).join('\n\n');

    // ==========================================
    // 🧠 1. ส่งให้ Gemini วิเคราะห์เจตนา (Intent Extraction)
    // แทนที่จะใช้ if-else ธรรมดา เราให้ AI ดึงคีย์เวิร์ดมาเลย
    // ==========================================
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // แปลงประวัติแชทเป็น String เพื่อแนบไปเป็น Context ให้ Gemini
    const historyText = history.map((m: any) => `${m.role === 'user' ? 'ลูกค้า' : 'AI'}: ${m.content}`).join('\n');

    const prompt = `
      คุณคือผู้ช่วย AI วิเคราะห์ข้อมูลของศูนย์บริการรถยนต์ Auto1
      
      [คู่มือความรู้ของร้าน (Knowledge Base)]
      ${kmText ? kmText : "ยังไม่มีข้อมูลเพิ่มเติม"}
      
      [ประวัติการสนทนาที่ผ่านมา (Context)]
      ${historyText}
      
      ลูกค้าตอบล่าสุดว่า: "${userMessage}"
      
      ให้คุณวิเคราะห์บริบททั้งหมด แล้วสกัดข้อมูลความต้องการของลูกค้าออกมาเป็น JSON format เท่านั้น ห้ามตอบข้อความอื่น โดยมี key ดังนี้:
      - "carBrand": ยี่ห้อรถ (ถ้าลูกค้าไม่ได้พิมพ์ในรอบนี้ แต่เคยพิมพ์ไว้ในประวัติแชท ให้ดึงมาใส่ด้วย ถ้าไม่รู้ให้ใส่ null)
      - "carModel": รุ่นรถ (ดึงจากประวัติแชทได้เช่นกัน, ถ้าเจอคำว่า dmax ให้แปลงเป็น D-Max, ถ้าไม่รู้ให้ใส่ null)
      - "year": ปีรถ เป็นตัวเลข ค.ศ. เท่านั้น (ดึงจากประวัติแชทได้เช่นกัน ถ้าไม่ระบุปีให้เป็น null)
      - "queryType": "battery" ถ้าลูกค้าถามเรื่องแบตเตอรี่, "tire" ถ้าถามเรื่องยางรถ, หรือ "both" ถ้าถามทั้งคู่, หรือ "other" ถ้าเป็นเรื่องอื่น
      - "location": สาขาหรือพื้นที่ที่ลูกค้าสนใจ (ถ้ามี) เช่น "รามอินทรา", "บางนา" (ถ้าไม่มีให้เป็น null)
      - "directAnswer": ถ้าลูกค้าถามคำถามที่ตรงกับ Knowledge Base ให้คุณสรุปคำตอบใส่ใน field นี้ (ถ้าไม่มีให้เป็น null)
    `;

    const result = await model.generateContent(prompt);
    let extractedText = result.response.text();
    
    // Clean JSON (เผื่อ Gemini ตอบกลับมาพร้อมกับ markdown tags)
    extractedText = extractedText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let intent = { carBrand: null, carModel: null, year: null, queryType: 'other', location: null, directAnswer: null };
    try {
        intent = JSON.parse(extractedText);
        console.log("🧠 AI Extracted Intent:", intent);
    } catch (e) {
        console.error("Failed to parse Gemini JSON:", extractedText);
    }

    // ==========================================
    // ⚙️ 2. ค้นหาข้อมูลจาก Database (RAG Process)
    // ==========================================
    let responseText = "";

    // ถ้ามีคำตอบตรงจาก Knowledge Base ให้ตอบไปเลย
    if (intent.directAnswer) {
        return NextResponse.json({ reply: intent.directAnswer });
    }

    if (intent.carModel) {
      // สร้างเงื่อนไขการค้นหาในฐานข้อมูล
      let dbQuery: any = {
         carModel: { contains: intent.carModel, mode: 'insensitive' }
      };
      
      if (intent.year) {
         dbQuery.startYear = { lte: intent.year };
         dbQuery.endYear = { gte: intent.year };
      }

      // วิ่งไปค้นในตาราง CarFitment
      const carInfo = await prisma.carFitment.findFirst({ where: dbQuery });

      if (carInfo) {
        let specToSearch = '';
        responseText = `🚗 ข้อมูลสำหรับ ${carInfo.carBrand} ${carInfo.carModel} `;
        if (intent.year) responseText += `(ปี ${intent.year})\n\n`;
        else responseText += `(โฉมปี ${carInfo.startYear}-${carInfo.endYear})\n\n`;

        // สรุปสเปคที่เจอ
        if (intent.queryType === 'battery' || intent.queryType === 'both' || intent.queryType === 'other') {
          specToSearch = carInfo.batteryType || '';
          responseText += `🔋 สเปคแบตเตอรี่มาตรฐาน: ${specToSearch} (${carInfo.batteryAmp} แอมป์ ขั้ว ${carInfo.batteryTerminal})\n`;
        }
        
        if (intent.queryType === 'tire' || intent.queryType === 'both' || intent.queryType === 'other') {
          specToSearch = carInfo.standardTireSize || '';
          responseText += `🛞 ขนาดยางมาตรฐาน: ${specToSearch}\n`;
        }

        // ค้นหาสินค้าจาก Catalog ที่สเปคตรงกัน
        if (specToSearch) {
            const products = await prisma.product.findMany({
              where: { name: { contains: specToSearch, mode: 'insensitive' } },
              take: 3
            });

            if (products.length > 0) {
              responseText += `\n💡 สินค้าที่ Auto1 ขอแนะนำ:\n`;
              products.forEach(p => {
                // ถ้ามีราคาโปรโมชั่น ให้แสดงด้วย
                const displayPrice = p.promotionPrice ? p.promotionPrice : p.price;
                responseText += `- ${p.name} | ราคา ฿${Number(displayPrice).toLocaleString()}\n`;
              });
              responseText += `\nสนใจนัดหมายจองคิวเปลี่ยนที่สาขาใกล้บ้านไหมครับ?`;
            } else {
              responseText += `\n(ตอนนี้ยังไม่พบสินค้าสเปคนี้บนระบบออนไลน์ รบกวนให้แอดมินคนจริงช่วยเช็คของที่สาขาให้นะครับ)`;
            }
        }

        if (intent.location) {
            responseText += `\n\n📍 สำหรับสาขาในย่าน ${intent.location} คุณสามารถนำรถเข้ามาเช็คได้เลยครับ หรือติดต่อแอดมินเพจเพื่อจองคิวล่วงหน้าได้ครับ!`;
        }
      } else {
        responseText = `แอดมินยังไม่พบข้อมูลสเปคของรถรุ่น "${intent.carModel}" ในระบบครับ รบกวนตรวจสอบชื่อรุ่น หรือให้แอดมินช่วยเช็คให้ดีครับ?`;
      }
    } else {
      if (intent.location) {
          responseText = `📍 สำหรับสาขาในย่าน ${intent.location} ยินดีให้บริการครับ! ไม่ทราบว่าสนใจเช็คยางหรือแบตเตอรี่ของรถรุ่นไหนเป็นพิเศษไหมครับ?`;
      } else {
          responseText = `สวัสดีครับ ยินดีต้อนรับสู่ Auto1 🔧 สนใจเช็คราคายางหรือแบตเตอรี่ของรถรุ่นไหน พิมพ์บอกแอดมินได้เลยครับ (เช่น "vios ปี 61 ใช้ยางขนาดเท่าไหร่")`;
      }
    }

    return NextResponse.json({ reply: responseText });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
