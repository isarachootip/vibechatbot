const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting all old order history to remove foreign key locks...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  
  console.log('Scanning for non-automotive products...');
  const products = await prisma.product.findMany();
  let deletedCount = 0;
  
  for (const p of products) {
    const name = p.name.toLowerCase();
    const isAuto = name.includes('michelin') || 
                   name.includes('bridgestone') || 
                   name.includes('yokohama') || 
                   name.includes('maxxis') || 
                   name.includes('gs') || 
                   name.includes('puma') || 
                   name.includes('fb') ||
                   name.includes('ยาง') ||
                   name.includes('แบต');
                   
    if (!isAuto) {
      try {
        await prisma.product.delete({ where: { id: p.id } });
        deletedCount++;
        console.log(`Deleted product: ${p.name}`);
      } catch (err) {
        console.log(`Skipped ${p.name} (might be tied to an existing order history)`);
      }
    }
  }
  
  console.log('\nScanning for non-automotive categories...');
  const categories = await prisma.category.findMany();
  let catDeleted = 0;
  for (const c of categories) {
    const name = c.name.toLowerCase();
    if (!name.includes('ยาง') && !name.includes('แบต')) {
      try {
        await prisma.category.delete({ where: { id: c.id } });
        catDeleted++;
        console.log(`Deleted category: ${c.name}`);
      } catch (err) {
        console.log(`Skipped category: ${c.name} (not empty)`);
      }
    }
  }

  console.log(`\n✅ Clean up complete! Removed ${deletedCount} old products and ${catDeleted} old categories.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
