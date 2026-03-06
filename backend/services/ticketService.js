const prisma = require('../config/db');

const pad = (n) => String(n).padStart(6, '0');

const getAllTickets = async (user, query) => {
    const { limit = 20, offset = 0, state, from, to } = query;
    let where = {};

    // Role-based visibility
    if (user.role === 'ticketer') {
        where.taxTakerId = user.id;
    } else if (user.role === 'woreda') {
        const u = await prisma.user.findUnique({ where: { id: user.id }, select: { woredaId: true } });
        where.woredaId = u.woredaId;
    }

    if (state) where.state = state;
    if (from || to) {
        where.date = {};
        if (from) where.date.gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setDate(toDate.getDate() + 1);
            where.date.lt = toDate;
        }
    }

    const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
            where,
            include: { animalType: true, taxTaker: { select: { id: true, name: true } }, woreda: true },
            orderBy: { date: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        }),
        prisma.ticket.count({ where })
    ]);

    return { tickets, total };
};

const getTicketById = async (id) => {
    const ticket = await prisma.ticket.findUnique({
        where: { id: parseInt(id) },
        include: { animalType: true, taxTaker: { select: { id: true, name: true } }, woreda: true }
    });
    return ticket;
};

const createTicket = async (userId, data) => {
    const { animalTypeId, quantity, customerName } = data;
    if (!animalTypeId || !quantity) {
        throw { status: 400, message: 'Animal type and quantity are required' };
    }

    const animalType = await prisma.animalType.findUnique({ where: { id: parseInt(animalTypeId) } });
    if (!animalType) {
        throw { status: 404, message: 'Animal type not found' };
    }

    const taxAmount = animalType.taxAmount * parseFloat(quantity);

    const userInfo = await prisma.user.findUnique({
        where: { id: userId },
        select: { woredaId: true }
    });

    const count = await prisma.ticket.count();
    const reference = `TKT-${pad(count + 1)}`;

    const ticket = await prisma.ticket.create({
        data: {
            reference,
            animalTypeId: parseInt(animalTypeId),
            quantity: parseFloat(quantity),
            taxAmount,
            taxTakerId: userId,
            woredaId: userInfo.woredaId,
            customerName: customerName || null,
            state: 'draft'
        },
        include: { animalType: true, taxTaker: { select: { id: true, name: true } }, woreda: true }
    });

    return ticket;
};

const confirmTicket = async (id) => {
    const existing = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
    if (!existing) throw { status: 404, message: 'Ticket not found' };
    if (existing.state === 'printed') {
        throw { status: 400, message: 'Ticket has already been printed/confirmed' };
    }

    const ticket = await prisma.ticket.update({
        where: { id: parseInt(id) },
        data: { state: 'printed' },
        include: { animalType: true, taxTaker: { select: { id: true, name: true } }, woreda: true }
    });
    return ticket;
};

const deleteTicket = async (id) => {
    await prisma.ticket.delete({ where: { id: parseInt(id) } });
    return { success: true };
};

module.exports = {
    getAllTickets,
    getTicketById,
    createTicket,
    confirmTicket,
    deleteTicket
};
