const ticketService = require('../services/ticketService');

const getAllTickets = async (req, res) => {
    try {
        const result = await ticketService.getAllTickets(req.user, req.query);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getTicketById = async (req, res) => {
    try {
        const ticket = await ticketService.getTicketById(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        res.json(ticket);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const createTicket = async (req, res) => {
    try {
        const ticket = await ticketService.createTicket(req.user.id, req.body);
        res.status(201).json(ticket);
    } catch (err) {
        console.error(err);
        const status = err.status || 500;
        const message = err.message || 'Server error';
        res.status(status).json({ error: message });
    }
};

const confirmTicket = async (req, res) => {
    try {
        const ticket = await ticketService.confirmTicket(req.params.id);
        res.json(ticket);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteTicket = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    try {
        const result = await ticketService.deleteTicket(req.params.id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getAllTickets,
    getTicketById,
    createTicket,
    confirmTicket,
    deleteTicket
};
