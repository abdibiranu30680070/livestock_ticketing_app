const prisma = require('../config/db');

const getDashboardStats = async (user, query) => {
    const { date_from, date_to, user_id, animal_type_id, limit = 10, offset = 0 } = query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Summary cards: always today's data
    let summaryWhere = { date: { gte: today } };
    if (user.role === 'ticketer') summaryWhere.taxTakerId = user.id;
    else if (user.role === 'woreda') {
        const u = await prisma.user.findUnique({ where: { id: user.id }, select: { woredaId: true } });
        if (u.woredaId) summaryWhere.woredaId = u.woredaId;
    }

    const summaryTickets = await prisma.ticket.findMany({ where: summaryWhere });
    const uniqueCollectors = new Set(summaryTickets.map(t => t.taxTakerId));

    // Charts domain
    let chartWhere = {};
    if (user.role === 'ticketer') chartWhere.taxTakerId = user.id;
    else if (user.role === 'woreda') {
        const u = await prisma.user.findUnique({ where: { id: user.id }, select: { woredaId: true } });
        if (u.woredaId) chartWhere.woredaId = u.woredaId;
    }

    if (date_from) chartWhere.date = { ...chartWhere.date, gte: new Date(date_from) };
    if (date_to) {
        const toDate = new Date(date_to);
        toDate.setDate(toDate.getDate() + 1);
        chartWhere.date = { ...chartWhere.date, lt: toDate };
    }
    if (!date_from && !date_to) {
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        chartWhere.date = { gte: yearAgo };
    }
    if (user_id) chartWhere.taxTakerId = parseInt(user_id);
    if (animal_type_id) chartWhere.animalTypeId = parseInt(animal_type_id);

    const chartTickets = await prisma.ticket.findMany({
        where: chartWhere,
        include: { animalType: true, taxTaker: true, woreda: true },
        orderBy: { date: 'asc' }
    });

    // Aggregations
    const taxByType = {};
    const cattleByType = {};
    const dailyTrend = {};
    const taxByWoreda = {};
    const collectorData = {};

    for (const t of chartTickets) {
        const typeName = t.animalType?.name || 'Unknown';
        const woredaName = t.woreda?.name || 'Unknown';
        const dStr = t.date.toISOString().split('T')[0];
        const collName = t.taxTaker?.name || 'System';

        taxByType[typeName] = (taxByType[typeName] || 0) + t.taxAmount;
        cattleByType[typeName] = (cattleByType[typeName] || 0) + t.quantity;
        dailyTrend[dStr] = (dailyTrend[dStr] || 0) + t.taxAmount;
        taxByWoreda[woredaName] = (taxByWoreda[woredaName] || 0) + t.taxAmount;

        if (!collectorData[collName]) collectorData[collName] = { name: collName, tx: 0, cattle: 0, tax: 0 };
        collectorData[collName].tx++;
        collectorData[collName].cattle += t.quantity;
        collectorData[collName].tax += t.taxAmount;
    }

    const rankings = Object.values(collectorData).sort((a, b) => b.tax - a.tax);
    const sortedDays = Object.keys(dailyTrend).sort();

    // Recent tickets (paginated)
    const COLORS = ['#dc2626', '#16a34a', '#1f2937', '#ef4444', '#22c55e', '#374151', '#f87171'];
    const totalCount = await prisma.ticket.count({ where: chartWhere });
    const recentTickets = await prisma.ticket.findMany({
        where: chartWhere,
        include: { animalType: true, taxTaker: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });

    const recent = recentTickets.map(t => ({
        ref: t.reference,
        date: t.date.toISOString().replace('T', ' ').substring(0, 16),
        type: t.animalType?.name,
        qty: t.quantity,
        price: t.animalType?.taxAmount,
        total: t.taxAmount,
        collector: t.taxTaker?.name,
        state: t.state
    }));

    return {
        summary: {
            cattle: summaryTickets.reduce((s, t) => s + t.quantity, 0),
            tax: summaryTickets.reduce((s, t) => s + t.taxAmount, 0),
            tx: summaryTickets.length,
            collectors: uniqueCollectors.size
        },
        charts: {
            bar: {
                labels: Object.keys(taxByType),
                datasets: [{ label: 'Tax Collected', data: Object.values(taxByType), backgroundColor: '#dc2626' }]
            },
            line: {
                labels: sortedDays,
                datasets: [{ label: 'Revenue Trend', data: sortedDays.map(d => dailyTrend[d]), borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)', fill: true }]
            },
            pie: {
                labels: Object.keys(cattleByType),
                datasets: [{ data: Object.values(cattleByType), backgroundColor: COLORS }]
            },
            woreda_bar: {
                labels: Object.keys(taxByWoreda),
                datasets: [{ label: 'Tax by Woreda', data: Object.values(taxByWoreda), backgroundColor: '#16a34a' }]
            }
        },
        rankings,
        recent,
        total_count: totalCount
    };
};

module.exports = {
    getDashboardStats
};
