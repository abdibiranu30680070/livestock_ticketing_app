const router = require('express').Router();
const ticketController = require('../controllers/ticketController');
const authenticate = require('../middleware/auth');

// GET /api/tickets
router.get('/', authenticate, ticketController.getAllTickets);

// GET /api/tickets/:id
router.get('/:id', authenticate, ticketController.getTicketById);

// POST /api/tickets
router.post('/', authenticate, ticketController.createTicket);

// PATCH /api/tickets/:id/confirm
router.patch('/:id/confirm', authenticate, ticketController.confirmTicket);

// DELETE /api/tickets/:id (admin only)
router.delete('/:id', authenticate, ticketController.deleteTicket);

module.exports = router;
