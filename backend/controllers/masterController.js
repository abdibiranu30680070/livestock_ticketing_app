const masterService = require('../services/masterService');

const getAllZones = async (req, res) => {
    try {
        const zones = await masterService.getAllZones();
        res.json(zones);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAllCities = async (req, res) => {
    try {
        const cities = await masterService.getAllCities(req.query.zoneId);
        res.json(cities);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAllWoredas = async (req, res) => {
    try {
        const woredas = await masterService.getAllWoredas(req.query.cityId);
        res.json(woredas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAllAnimalTypes = async (req, res) => {
    try {
        const types = await masterService.getAllAnimalTypes();
        res.json(types);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const createAnimalType = async (req, res) => {
    if (!['admin', 'zone'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    try {
        const at = await masterService.createAnimalType(req.body);
        res.status(201).json(at);
    } catch (err) {
        console.error(err);
        const status = err.status || 500;
        const message = err.message || 'Server error';
        if (err.code === 'P2002') return res.status(409).json({ error: 'Animal type already exists' });
        res.status(status).json({ error: message });
    }
};

const updateAnimalType = async (req, res) => {
    if (!['admin', 'zone'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    try {
        const at = await masterService.updateAnimalType(req.params.id, req.body);
        res.json(at);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteAnimalType = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    try {
        const result = await masterService.deleteAnimalType(req.params.id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await masterService.getAllUsers();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getAllZones,
    getAllCities,
    getAllWoredas,
    getAllAnimalTypes,
    createAnimalType,
    updateAnimalType,
    deleteAnimalType,
    getAllUsers
};
