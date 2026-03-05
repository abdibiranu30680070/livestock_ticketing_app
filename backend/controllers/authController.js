const authService = require('../services/authService');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (err) {
        console.error(err);
        const status = err.status || 500;
        const message = err.message || 'Server error';
        res.status(status).json({ error: message });
    }
};

const register = async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        const status = err.status || 500;
        const message = err.message || 'Server error';
        res.status(status).json({ error: message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await authService.getMe(req.user.id);
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    login,
    register,
    getMe
};
