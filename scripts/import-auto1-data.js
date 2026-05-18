const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function parseCSVLine(line) {
  const values = [];
  let currentVal = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentVal.trim());
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  values.push(currentVal.trim());
  return values;
}

async function importFitmentData() {
  console.log('Importing Car Fitment Data...');
  const filePath = path.join(__dirname, '..', 'auto1_car_fitment_master.csv');
  
  if (!fs.existsSync(filePath)) {
    console.log('Fitment CSV not found. Skipping.');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 10) continue;
    
    await prisma.carFitment.create({
      data: {
        carBrand: cols[0],
        carModel: cols[1],
        startYear: parseInt(cols[2]) || 0,
        endYear: parseInt(cols[3]) || 0,
        engineTrim: cols[4],
        standardTireSize: cols[5] || null,
        alternativeTireSize: cols[6] || null,
        batteryType: cols[7] || null,
        batteryAmp: parseInt(cols[8]) || null,
        batteryTerminal: cols[9] || null,
      }
    });
  }
  console.log(`Successfully imported ${lines.length - 1} car models.`);
}

async function importProductCatalog() {
  console.log('Importing Product Catalog Data...');
  const filePath = path.join(__dirname, '..', 'auto1_product_catalog_master.csv');
  
  if (!fs.existsSync(filePath)) {
    console.log('Product Catalog CSV not found. Skipping.');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  // Create Categories if they don't exist
  let tireCategory = await prisma.category.findUnique({ where: { slug: 'tire' } });
  if (!tireCategory) {
    tireCategory = await prisma.category.create({ data: { name: 'ยางรถยนต์', slug: 'tire' } });
  }

  let batteryCategory = await prisma.category.findUnique({ where: { slug: 'battery' } });
  if (!batteryCategory) {
    batteryCategory = await prisma.category.create({ data: { name: 'แบตเตอรี่', slug: 'battery' } });
  }

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 9) continue;
    
    // SKU,Category,Brand,Product_Name,Size_or_Spec,Regular_Price,Promotion_Price,Promotion_Detail,Stock_Status
    const sku = cols[0];
    const categoryName = cols[1];
    const brand = cols[2];
    const productName = cols[3];
    const spec = cols[4];
    const price = parseFloat(cols[5]) || 0;
    const promoPrice = parseFloat(cols[6]) || null;
    const promoDetail = cols[7];
    const stockStatus = cols[8];

    const categoryId = categoryName === 'Tire' ? tireCategory.id : (categoryName === 'Battery' ? batteryCategory.id : null);

    const specifications = {
      brand: brand,
      spec_size: spec,
      sku: sku,
      promotion: promoDetail,
      stock_status: stockStatus
    };

    const fullName = `${brand} ${productName} (${spec})`;

    await prisma.product.create({
      data: {
        name: fullName,
        description: `สินค้าแท้ 100% จากแบรนด์ ${brand}`,
        price: price,
        promotionPrice: promoPrice,
        inventory: stockStatus === 'In Stock' ? 100 : 0,
        categoryId: categoryId,
        specifications: specifications
      }
    });
  }
  console.log(`Successfully imported ${lines.length - 1} products.`);
}

async function main() {
  try {
    // Optional: Clear old data to prevent duplicates when re-running
    await prisma.carFitment.deleteMany({});
    
    await importFitmentData();
    await importProductCatalog();
    console.log('✅ All imports finished successfully!');
  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
