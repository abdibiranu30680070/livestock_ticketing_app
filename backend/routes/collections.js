const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const prisma = new PrismaClient();
const pad = (n) => String(n).padStart(6, '0');

// GET /api/collections
router.get('/', authenticate, async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const user = req.user;
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

        res.json({ collections, total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/collections
router.post('/', authenticate, async (req, res) => {
    const { ticketerId, amount } = req.body;
    if (!ticketerId || amount === undefined)
        return res.status(400).json({ error: 'ticketerId and amount are required' });

    try {
        const ticketer = await prisma.user.findUnique({
            where: { id: parseInt(ticketerId) },
            select: { id: true, woredaId: true }
        });
        if (!ticketer) return res.status(404).json({ error: 'Ticketer not found' });

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
        res.status(201).json(collection);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
