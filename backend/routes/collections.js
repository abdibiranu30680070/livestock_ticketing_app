const router = require('express').Router();
const collectionController = require('../controllers/collectionController');
const authenticate = require('../middleware/auth');

// GET /api/collections
router.get('/', authenticate, collectionController.getAllCollections);

// POST /api/collections
router.post('/', authenticate, collectionController.createCollection);

module.exports = router;
