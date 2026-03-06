const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Deetaa guutaa jira...');

    // Zone
    const zone = await prisma.zone.upsert({
        where: { name: 'Godina Arsi Liixa' },
        update: {},
        create: { name: 'Godina Arsi Liixa', code: 'ALZ' }
    });

    // Cities
    const city1 = await prisma.city.upsert({
        where: { id: 1 },
        update: {},
        create: { name: 'Asallaa', zoneId: zone.id }
    });
    const city2 = await prisma.city.upsert({
        where: { id: 2 },
        update: {},
        create: { name: 'Baqojjii', zoneId: zone.id }
    });

    // Woredas
    const woreda1 = await prisma.woreda.upsert({
        where: { id: 1 },
        update: {},
        create: { name: 'Magaalaa Asallaa', cityId: city1.id }
    });
    const woreda2 = await prisma.woreda.upsert({
        where: { id: 2 },
        update: {},
        create: { name: 'Magaalaa Baqojjii', cityId: city2.id }
    });

    // Animal Types
    const animals = [
        { name: 'Loon', taxAmount: 50 },
        { name: 'Hoolaa', taxAmount: 20 },
        { name: 'Re\'ee', taxAmount: 15 },
        { name: 'Gaala', taxAmount: 100 },
        { name: 'Farda', taxAmount: 60 },
        { name: 'Harree', taxAmount: 10 },
        { name: 'Gaangee', taxAmount: 40 },
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
            name: 'Bulchiinsa Sirnaa',
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
            name: 'Bulchiinsa Godinaa',
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
            name: 'Bulchiinsa Aanaa Asallaa',
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
            name: 'Abdi Sassaabaa',
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
            name: 'Caaltu Sassaabaa',
            email: 'tick2@livestock.et',
            password: tick2Pass,
            role: 'ticketer',
            zoneId: zone.id,
            cityId: city2.id,
            woredaId: woreda2.id
        }
    });

    console.log('Deetaan guutameera!');
    console.log('\nGalmee demoo:');
    console.log('  admin@livestock.et / admin123');
    console.log('  zone@livestock.et  / zone123');
    console.log('  woreda@livestock.et / woreda123');
    console.log('  tick1@livestock.et  / tick123');
    console.log('  tick2@livestock.et  / tick123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
