const express = require('express');
const authenticate = require('../middleware/auth.js');
const professionalDashboardController = require('../controllers/professionalDashboardController.js');

const router = express.Router();

// Professional Dashboard Routes
router.get('/', authenticate, professionalDashboardController.getProfessionalDashboard);
router.get('/comparison', authenticate, professionalDashboardController.getAnimalComparison);
router.get('/trend', authenticate, professionalDashboardController.getDailyTrend);

module.exports = router;
