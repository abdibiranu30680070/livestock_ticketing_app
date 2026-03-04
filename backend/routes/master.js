const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/master/zones
router.get('/zones', authenticate, async (req, res) => {
    const zones = await prisma.zone.findMany({ orderBy: { name: 'asc' } });
    res.json(zones);
});

// GET /api/master/cities
router.get('/cities', authenticate, async (req, res) => {
    const { zoneId } = req.query;
    const cities = await prisma.city.findMany({
        where: zoneId ? { zoneId: parseInt(zoneId) } : {},
        include: { zone: { select: { name: true } } },
        orderBy: { name: 'asc' }
    });
    res.json(cities);
});

// GET /api/master/woredas
router.get('/woredas', authenticate, async (req, res) => {
    const { cityId } = req.query;
    const woredas = await prisma.woreda.findMany({
        where: cityId ? { cityId: parseInt(cityId) } : {},
        include: { city: { select: { name: true } } },
        orderBy: { name: 'asc' }
    });
    res.json(woredas);
});

// GET /api/master/animal-types
router.get('/animal-types', authenticate, async (req, res) => {
    const types = await prisma.animalType.findMany({ orderBy: { name: 'asc' } });
    res.json(types);
});

// CRUD for Animal Types (admin)
router.post('/animal-types', authenticate, async (req, res) => {
    if (!['admin', 'zone'].includes(req.user.role))
        return res.status(403).json({ error: 'Insufficient permissions' });
    const { name, taxAmount } = req.body;
    if (!name || taxAmount === undefined)
        return res.status(400).json({ error: 'Name and taxAmount are required' });
    try {
        const at = await prisma.animalType.create({ data: { name, taxAmount: parseFloat(taxAmount) } });
        res.status(201).json(at);
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ error: 'Animal type already exists' });
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/animal-types/:id', authenticate, async (req, res) => {
    if (!['admin', 'zone'].includes(req.user.role))
        return res.status(403).json({ error: 'Insufficient permissions' });
    const { name, taxAmount } = req.body;
    try {
        const at = await prisma.animalType.update({
            where: { id: parseInt(req.params.id) },
            data: { name, taxAmount: parseFloat(taxAmount) }
        });
        res.json(at);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/animal-types/:id', authenticate, async (req, res) => {
    if (req.user.role !== 'admin')
        return res.status(403).json({ error: 'Admin access required' });
    try {
        await prisma.animalType.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/master/users  (for dropdowns)
router.get('/users', authenticate, async (req, res) => {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, role: true, woredaId: true },
        orderBy: { name: 'asc' }
    });
    res.json(users);
});

module.exports = router;
