import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId') || 'default';

    // URL ของแชทบอทของเรา (หน้า Embed)
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // โค้ด JavaScript ที่จะถูก Inject เข้าไปในเว็บลูกค้า
    const scriptContent = \`
        (function() {
            // ป้องกันการโหลดซ้ำ
            if (window.Auto1ChatWidgetLoaded) return;
            window.Auto1ChatWidgetLoaded = true;

            const chatUrl = new URL('\${protocol}://\${host}/embed/chat');
            // ในสถานการณ์ใช้งานจริง ควรใช้ Absolute URL ของโดเมนหลัก เช่น:
            // const chatUrl = new URL('https://n4uzbd7344skodr42vawjfyl.187.77.147.16.sslip.io/embed/chat');
            chatUrl.searchParams.set('shopId', '${shopId}');

            // สร้าง iframe 
            const iframe = document.createElement('iframe');
            iframe.src = chatUrl.toString();
            iframe.style.position = 'fixed';
            iframe.style.bottom = '20px';
            iframe.style.right = '20px';
            iframe.style.width = '100px';
            iframe.style.height = '100px';
            iframe.style.border = 'none';
            iframe.style.zIndex = '999999';
            iframe.style.backgroundColor = 'transparent';
            
            // ไม่ต้องใส่ pointerEvents = none แล้ว เพราะเราย่อขนาด iframe เล็กเท่าปุ่มแทน
            
            // รองรับ Responsive
            const updateSize = (isOpen) => {
                if (window.innerWidth <= 640 && isOpen) {
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.bottom = '0';
                    iframe.style.right = '0';
                } else if (isOpen) {
                    iframe.style.width = '420px';
                    iframe.style.height = '600px';
                    iframe.style.bottom = '20px';
                    iframe.style.right = '20px';
                } else {
                    iframe.style.width = '100px';
                    iframe.style.height = '100px';
                    iframe.style.bottom = '20px';
                    iframe.style.right = '20px';
                }
            };

            window.addEventListener('resize', () => updateSize(window.Auto1ChatOpen));
            updateSize(false);

            document.body.appendChild(iframe);

            // รับข้อความจาก iframe เพื่อขยาย/ย่อขนาด
            window.addEventListener('message', (event) => {
                if (event.data === 'auto1-chat-open') {
                    window.Auto1ChatOpen = true;
                    updateSize(true);
                } else if (event.data === 'auto1-chat-close') {
                    window.Auto1ChatOpen = false;
                    updateSize(false);
                }
            });
        })();
    `;

    return new NextResponse(scriptContent, {
        headers: {
            'Content-Type': 'application/javascript',
            'Access-Control-Allow-Origin': '*', // อนุญาตให้โดเมนอื่นโหลดได้
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
