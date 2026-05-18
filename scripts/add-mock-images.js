const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TIRE_IMAGE = "https://placehold.co/600x600/1e293b/ffffff/png?text=Car+Tire";
const BATTERY_IMAGE = "https://placehold.co/600x600/e11d48/ffffff/png?text=Car+Battery";
const OIL_IMAGE = "https://placehold.co/600x600/f59e0b/ffffff/png?text=Motor+Oil";

async function main() {
  console.log('Starting to add mock images...');
  const products = await prisma.product.findMany();
  
  let updatedCount = 0;
  
  for (const product of products) {
    // Check if the product already has images
    // Overwrite existing images

    const name = product.name.toLowerCase();
    let imageUrl = '';

    if (name.includes('michelin') || name.includes('bridgestone') || name.includes('yokohama') || name.includes('maxxis') || name.includes('tire') || name.includes('ยาง')) {
        imageUrl = TIRE_IMAGE;
    } else if (name.includes('gs') || name.includes('puma') || name.includes('fb') || name.includes('battery') || name.includes('แบต')) {
        imageUrl = BATTERY_IMAGE;
    } else if (name.includes('mobil1') || name.includes('น้ำมันเครื่อง')) {
        imageUrl = OIL_IMAGE;
    } else {
        // Fallback for anything else
        imageUrl = "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800"; // Generic auto parts
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { images: [imageUrl] }
    });
    
    updatedCount++;
    console.log(`Updated ${product.name} with an image.`);
  }

  console.log(`\n✅ Finished updating ${updatedCount} products with mock images.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
