const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public/Organiser routes
router.get('/', venueController.getVenues);
router.get('/new', isAuthenticated, isAdmin, venueController.getNewVenueForm);
router.get('/:id', venueController.getVenueDetails);

// Admin-only CRUD
router.post('/', isAuthenticated, isAdmin, venueController.createVenue);
router.get('/:id/edit', isAuthenticated, isAdmin, venueController.getEditVenueForm);
router.put('/:id', isAuthenticated, isAdmin, venueController.updateVenue);
router.delete('/:id', isAuthenticated, isAdmin, venueController.deleteVenue);

// Admin-only Maintenance Blocking
router.post('/:id/maintenance', isAuthenticated, isAdmin, venueController.addMaintenanceBlock);
router.post('/:id/maintenance/:blockId/delete', isAuthenticated, isAdmin, venueController.removeMaintenanceBlock);

module.exports = router;
