const collectionService = require('../services/collectionService');

const getAllCollections = async (req, res) => {
    try {
        const result = await collectionService.getAllCollections(req.user, req.query);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const createCollection = async (req, res) => {
    try {
        const collection = await collectionService.createCollection(req.body);
        res.status(201).json(collection);
    } catch (err) {
        console.error(err);
        const status = err.status || 500;
        const message = err.message || 'Server error';
        res.status(status).json({ error: message });
    }
};

module.exports = {
    getAllCollections,
    createCollection
};
