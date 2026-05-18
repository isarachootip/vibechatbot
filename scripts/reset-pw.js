const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@joycafe.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });
    console.log('RESET OK');
}

main().finally(() => prisma.$disconnect());
