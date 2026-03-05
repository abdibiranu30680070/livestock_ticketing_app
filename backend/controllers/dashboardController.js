const dashboardService = require('../services/dashboardService');

const getStats = async (req, res) => {
    try {
        const stats = await dashboardService.getDashboardStats(req.user, req.query);
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getStats
};
