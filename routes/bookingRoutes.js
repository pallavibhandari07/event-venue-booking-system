const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated, isOrganizer } = require('../middleware/auth');

// Organiser booking actions
router.post('/', isAuthenticated, isOrganizer, bookingController.createBookingRequest);
router.get('/my-bookings', isAuthenticated, isOrganizer, bookingController.getMyBookings);
router.post('/:id/cancel', isAuthenticated, isOrganizer, bookingController.cancelBooking);

module.exports = router;
