const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Protect all admin routes with authentication & admin check
router.use(isAuthenticated, isAdmin);

// Manage booking requests
router.get('/bookings', adminController.getAllBookings);
router.post('/bookings/:id/status', adminController.updateBookingStatus);

module.exports = router;
