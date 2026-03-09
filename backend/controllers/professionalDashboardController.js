const professionalDashboardService = require('../services/professionalDashboardService.js');

const getProfessionalDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dashboard = await professionalDashboardService.getProfessionalDashboard(req.user, { startDate, endDate });
    res.json(dashboard);
  } catch (err) {
    console.error('Error getting professional dashboard:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
};

const getAnimalComparison = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const comparison = await professionalDashboardService.getAnimalTypeComparison(req.user, { startDate, endDate });
    res.json(comparison);
  } catch (err) {
    console.error('Error getting animal comparison:', err);
    res.status(500).json({ error: 'Failed to load comparison data' });
  }
};

const getDailyTrend = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const trend = await professionalDashboardService.getDailySalesTrend(req.user, { startDate, endDate });
    res.json(trend);
  } catch (err) {
    console.error('Error getting daily trend:', err);
    res.status(500).json({ error: 'Failed to load trend data' });
  }
};

module.exports = {
  getProfessionalDashboard,
  getAnimalComparison,
  getDailyTrend
};
