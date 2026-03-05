const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticate, dashboardController.getStats);

module.exports = router;
