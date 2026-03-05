const router = require('express').Router();
const masterController = require('../controllers/masterController');
const authenticate = require('../middleware/auth');

// GET /api/master/zones
router.get('/zones', authenticate, masterController.getAllZones);

// GET /api/master/cities
router.get('/cities', authenticate, masterController.getAllCities);

// GET /api/master/woredas
router.get('/woredas', authenticate, masterController.getAllWoredas);

// GET /api/master/animal-types
router.get('/animal-types', authenticate, masterController.getAllAnimalTypes);

// CRUD for Animal Types (admin/zone)
router.post('/animal-types', authenticate, masterController.createAnimalType);
router.put('/animal-types/:id', authenticate, masterController.updateAnimalType);
router.delete('/animal-types/:id', authenticate, masterController.deleteAnimalType);

// GET /api/master/users (for dropdowns)
router.get('/users', authenticate, masterController.getAllUsers);

module.exports = router;
