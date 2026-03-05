const router = require('express').Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/register
router.post('/register', authController.register);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

module.exports = router;
