const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const prisma = new PrismaClient();

// Counter for auto reference
const pad = (n) => String(n).padStart(6, '0');

// GET /api/tickets
router.get('/', authenticate, async (req, res) => {
    try {
        const { limit = 20, offset = 0, state, from, to } = req.query;
        const user = req.user;

        let where = {};
        // Role-based visibility
        if (user.role === 'ticketer') {
            where.taxTakerId = user.id;
        } else if (user.role === 'woreda') {
            const u = await prisma.user.findUnique({ where: { id: user.id }, select: { woredaId: true } });
            where.woredaId = u.woredaId;
        }
        // zone and admin see all

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

        res.json({ tickets, total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/tickets/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { animalType: true, taxTaker: { select: { id: true, name: true } }, woreda: true }
        });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/tickets
router.post('/', authenticate, async (req, res) => {
    const { animalTypeId, quantity, customerName } = req.body;
    if (!animalTypeId || !quantity)
        return res.status(400).json({ error: 'Animal type and quantity are required' });

    try {
        const animalType = await prisma.animalType.findUnique({ where: { id: parseInt(animalTypeId) } });
        if (!animalType) return res.status(404).json({ error: 'Animal type not found' });

        const taxAmount = animalType.taxAmount * parseFloat(quantity);

        const userInfo = await prisma.user.findUnique({
            where: { id: req.user.id },
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
                taxTakerId: req.user.id,
                woredaId: userInfo.woredaId,
                customerName: customerName || null,
                state: 'draft'
            },
            include: { animalType: true, taxTaker: { select: { id: true, name: true } }, woreda: true }
        });

        res.status(201).json(ticket);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/tickets/:id/confirm
router.patch('/:id/confirm', authenticate, async (req, res) => {
    try {
        const ticket = await prisma.ticket.update({
            where: { id: parseInt(req.params.id) },
            data: { state: 'printed' },
            include: { animalType: true, taxTaker: { select: { id: true, name: true } }, woreda: true }
        });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/tickets/:id (admin only)
router.delete('/:id', authenticate, async (req, res) => {
    if (req.user.role !== 'admin')
        return res.status(403).json({ error: 'Admin access required' });
    try {
        await prisma.ticket.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
