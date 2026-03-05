const prisma = require('../config/db');

const pad = (n) => String(n).padStart(6, '0');

const getAllCollections = async (user, query) => {
    const { limit = 20, offset = 0 } = query;
    let where = {};
    if (user.role === 'ticketer') where.ticketerId = user.id;
    else if (user.role === 'woreda') {
        const u = await prisma.user.findUnique({ where: { id: user.id }, select: { woredaId: true } });
        where.woredaId = u.woredaId;
    }

    const [collections, total] = await Promise.all([
        prisma.collection.findMany({
            where,
            include: { ticketer: { select: { id: true, name: true } }, woreda: true },
            orderBy: { date: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        }),
        prisma.collection.count({ where })
    ]);

    return { collections, total };
};

const createCollection = async (data) => {
    const { ticketerId, amount } = data;
    if (!ticketerId || amount === undefined) {
        throw { status: 400, message: 'ticketerId and amount are required' };
    }

    const ticketer = await prisma.user.findUnique({
        where: { id: parseInt(ticketerId) },
        select: { id: true, woredaId: true }
    });
    if (!ticketer) {
        throw { status: 404, message: 'Ticketer not found' };
    }

    const count = await prisma.collection.count();
    const reference = `COL-${pad(count + 1)}`;

    const collection = await prisma.collection.create({
        data: {
            reference,
            ticketerId: parseInt(ticketerId),
            woredaId: ticketer.woredaId,
            amount: parseFloat(amount)
        },
        include: { ticketer: { select: { id: true, name: true } }, woreda: true }
    });

    return collection;
};

module.exports = {
    getAllCollections,
    createCollection
};
