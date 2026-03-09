const prisma = require('../config/db');

/*
PROFESSIONAL DASHBOARD SERVICE - GROUPED BY ANIMAL TYPE
*/
const getProfessionalDashboard = async (user, dateRange) => {
  const { startDate, endDate } = dateRange || {};
  
  // Build date filter
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else {
    // Default to last 30 days if no date range provided
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dateFilter.date = {
      gte: thirtyDaysAgo
    };
  }

  // Base filter based on user role
  let where = { ...dateFilter };
  
  if (user.role === 'ticketer') {
    where.taxTakerId = user.id;
  } else if (user.role === 'woreda') {
    where.woredaId = user.woredaId;
  }
  // Zone and Admin see all data

  try {
    // Get all confirmed tickets in the date range
    const tickets = await prisma.ticket.findMany({
      where: {
        ...where,
        state: 'printed' // Only confirmed/sold tickets
      },
      include: {
        animalType: true,
        taxTaker: { select: { id: true, name: true } },
        woreda: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Group tickets by animal type
    const animalGroups = {};
    
    tickets.forEach(ticket => {
      const animalName = ticket.animalType.name;
      
      if (!animalGroups[animalName]) {
        animalGroups[animalName] = {
          animalName,
          animalType: ticket.animalType,
          totalQuantity: 0,
          totalTax: 0,
          totalTickets: 0,
          taxPerUnit: ticket.animalType.taxAmount,
          tickets: [],
          taxTakers: new Set(),
          dates: new Set()
        };
      }
      
      animalGroups[animalName].totalQuantity += ticket.quantity;
      animalGroups[animalName].totalTax += ticket.taxAmount;
      animalGroups[animalName].totalTickets += 1;
      animalGroups[animalName].tickets.push(ticket);
      animalGroups[animalName].taxTakers.add(ticket.taxTaker.name);
      animalGroups[animalName].dates.add(ticket.date.toDateString());
    });

    // Convert to array and calculate additional metrics
    const animalSummary = Object.values(animalGroups).map(group => ({
      ...group,
      taxTakers: Array.from(group.taxTakers),
      dateRange: {
        start: new Date(Math.min(...group.tickets.map(t => t.date))),
        end: new Date(Math.max(...group.tickets.map(t => t.date)))
      },
      averageQuantityPerTicket: group.totalQuantity / group.totalTickets,
      uniqueDays: group.dates.size
    }));

    // Sort by total tax amount (highest first)
    animalSummary.sort((a, b) => b.totalTax - a.totalTax);

    // Calculate overall summary
    const overallSummary = {
      totalAnimalsSold: animalSummary.reduce((sum, a) => sum + a.totalQuantity, 0),
      totalTaxCollected: animalSummary.reduce((sum, a) => sum + a.totalTax, 0),
      totalTransactions: tickets.length,
      uniqueAnimalTypes: animalSummary.length,
      uniqueTaxCollectors: new Set(tickets.map(t => t.taxTaker.name)).size,
      dateRange: {
        start: tickets.length > 0 ? new Date(Math.min(...tickets.map(t => t.date))) : null,
        end: tickets.length > 0 ? new Date(Math.max(...tickets.map(t => t.date))) : null
      }
    };

    // Get top performers (tax collectors)
    const taxCollectorPerformance = {};
    tickets.forEach(ticket => {
      const collectorName = ticket.taxTaker.name;
      if (!taxCollectorPerformance[collectorName]) {
        taxCollectorPerformance[collectorName] = {
          name: collectorName,
          totalTax: 0,
          totalQuantity: 0,
          ticketCount: 0,
          animalTypes: new Set()
        };
      }
      taxCollectorPerformance[collectorName].totalTax += ticket.taxAmount;
      taxCollectorPerformance[collectorName].totalQuantity += ticket.quantity;
      taxCollectorPerformance[collectorName].ticketCount += 1;
      taxCollectorPerformance[collectorName].animalTypes.add(ticket.animalType.name);
    });

    const topPerformers = Object.values(taxCollectorPerformance)
      .map(p => ({ ...p, animalTypes: Array.from(p.animalTypes) }))
      .sort((a, b) => b.totalTax - a.totalTax)
      .slice(0, 5); // Top 5 performers

    return {
      summary: overallSummary,
      animalSummary,
      topPerformers,
      tickets: tickets.slice(0, 10), // Recent 10 tickets for reference
      dateFilter: dateFilter
    };

  } catch (error) {
    console.error('Error in professional dashboard service:', error);
    throw error;
  }
};

/*
GET ANIMAL TYPE COMPARISON
*/
const getAnimalTypeComparison = async (user, dateRange) => {
  const dashboard = await getProfessionalDashboard(user, dateRange);
  
  // Create comparison data for charts
  const comparison = dashboard.animalSummary.map(animal => ({
    name: animal.animalName,
    quantity: animal.totalQuantity,
    tax: animal.totalTax,
    tickets: animal.totalTickets,
    averageTicket: animal.averageQuantityPerTicket
  }));

  return comparison;
};

/*
GET DAILY SALES TREND
*/
const getDailySalesTrend = async (user, dateRange) => {
  const { startDate, endDate } = dateRange || {};
  
  let where = {};
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }
  
  if (user.role === 'woreda') {
    where.woredaId = user.woredaId;
  } else if (user.role === 'ticketer') {
    where.taxTakerId = user.id;
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      ...where,
      state: 'printed'
    },
    select: {
      date: true,
      taxAmount: true,
      animalType: { select: { name: true } }
    },
    orderBy: { date: 'asc' }
  });

  // Group by date
  const dailyData = {};
  tickets.forEach(ticket => {
    const dateKey = ticket.date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        totalTax: 0,
        ticketCount: 0,
        animals: {}
      };
    }
    dailyData[dateKey].totalTax += ticket.taxAmount;
    dailyData[dateKey].ticketCount += 1;
    
    const animalName = ticket.animalType.name;
    if (!dailyData[dateKey].animals[animalName]) {
      dailyData[dateKey].animals[animalName] = 0;
    }
    dailyData[dateKey].animals[animalName] += 1;
  });

  return Object.values(dailyData);
};

module.exports = {
  getProfessionalDashboard,
  getAnimalTypeComparison,
  getDailySalesTrend
};
