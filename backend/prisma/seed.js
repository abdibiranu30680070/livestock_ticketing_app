const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Zone
    const zone = await prisma.zone.upsert({
        where: { name: 'Arsi Liixa Zone' },
        update: {},
        create: { name: 'Arsi Liixa Zone', code: 'ALZ' }
    });

    // Cities
    const city1 = await prisma.city.upsert({
        where: { id: 1 },
        update: {},
        create: { name: 'Assela', zoneId: zone.id }
    });
    const city2 = await prisma.city.upsert({
        where: { id: 2 },
        update: {},
        create: { name: 'Bekoji', zoneId: zone.id }
    });

    // Woredas
    const woreda1 = await prisma.woreda.upsert({
        where: { id: 1 },
        update: {},
        create: { name: 'Assela Town', cityId: city1.id }
    });
    const woreda2 = await prisma.woreda.upsert({
        where: { id: 2 },
        update: {},
        create: { name: 'Bekoji Town', cityId: city2.id }
    });

    // Animal Types
    const animals = [
        { name: 'Cattle', taxAmount: 50 },
        { name: 'Sheep', taxAmount: 20 },
        { name: 'Goat', taxAmount: 15 },
        { name: 'Camel', taxAmount: 100 },
        { name: 'Horse', taxAmount: 60 },
        { name: 'Donkey', taxAmount: 10 },
        { name: 'Mule', taxAmount: 40 },
    ];
    for (const a of animals) {
        await prisma.animalType.upsert({
            where: { name: a.name },
            update: { taxAmount: a.taxAmount },
            create: a
        });
    }

    // Admin user
    const adminPass = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@livestock.et' },
        update: {},
        create: {
            name: 'System Admin',
            email: 'admin@livestock.et',
            password: adminPass,
            role: 'admin',
            zoneId: zone.id
        }
    });

    // Zone admin
    const zonePass = await bcrypt.hash('zone123', 10);
    await prisma.user.upsert({
        where: { email: 'zone@livestock.et' },
        update: {},
        create: {
            name: 'Zone Administrator',
            email: 'zone@livestock.et',
            password: zonePass,
            role: 'zone',
            zoneId: zone.id,
            cityId: city1.id
        }
    });

    // Woreda admin
    const woredaPass = await bcrypt.hash('woreda123', 10);
    await prisma.user.upsert({
        where: { email: 'woreda@livestock.et' },
        update: {},
        create: {
            name: 'Woreda Admin Assela',
            email: 'woreda@livestock.et',
            password: woredaPass,
            role: 'woreda',
            zoneId: zone.id,
            cityId: city1.id,
            woredaId: woreda1.id
        }
    });

    // Ticketers
    const tick1Pass = await bcrypt.hash('tick123', 10);
    await prisma.user.upsert({
        where: { email: 'tick1@livestock.et' },
        update: {},
        create: {
            name: 'Abdi Ticketer',
            email: 'tick1@livestock.et',
            password: tick1Pass,
            role: 'ticketer',
            zoneId: zone.id,
            cityId: city1.id,
            woredaId: woreda1.id
        }
    });

    const tick2Pass = await bcrypt.hash('tick123', 10);
    await prisma.user.upsert({
        where: { email: 'tick2@livestock.et' },
        update: {},
        create: {
            name: 'Chaltu Ticketer',
            email: 'tick2@livestock.et',
            password: tick2Pass,
            role: 'ticketer',
            zoneId: zone.id,
            cityId: city2.id,
            woredaId: woreda2.id
        }
    });

    console.log('Seed complete!');
    console.log('\nDemo credentials:');
    console.log('  admin@livestock.et / admin123');
    console.log('  zone@livestock.et  / zone123');
    console.log('  woreda@livestock.et / woreda123');
    console.log('  tick1@livestock.et  / tick123');
    console.log('  tick2@livestock.et  / tick123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
