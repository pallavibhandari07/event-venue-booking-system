// ============================================================================
// CONTROLLERS/VENUECONTROLLER.JS - VENUE CATALOG & ADMIN MANAGEMENT
// ============================================================================
// This controller handles:
// 1. Browsing, searching, and filtering campus venues
// 2. Viewing individual venue details and schedule availability
// 3. Admin CRUD (Create, Read, Update, Delete) operations on venues
// 4. Admin maintenance blocking (preventing bookings during repairs/AV setup)
// ============================================================================

const Venue = require('../models/Venue');
const Booking = require('../models/Booking');

// List of all standard facilities available across campus spaces
const ALL_FACILITIES = [
  'Projector',
  'Audio System',
  'Air Conditioning',
  'Stage',
  'WiFi',
  'Live Streaming',
  'Video Conferencing',
  'Whiteboard',
  'Green Room',
  'Outdoor Lighting'
];

// ============================================================================
// 1. GET ALL VENUES (WITH SEARCH & MULTI-FACILITY FILTERING)
// ============================================================================
exports.getVenues = async (req, res, next) => {
  try {
    const { search, minCapacity, facilities, status } = req.query;

    // Start with an empty filter query
    const filterQuery = {};

    // 1. Search keyword filter (matches name, location, or description case-insensitively)
    if (search && search.trim() !== '') {
      const term = search.trim();
      filterQuery.$or = [
        { name: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } }
      ];
    }

    // 2. Minimum capacity filter (e.g. at least 100 seats)
    if (minCapacity && !isNaN(minCapacity) && Number(minCapacity) > 0) {
      filterQuery.capacity = { $gte: Number(minCapacity) };
    }

    // 3. Status filter (available vs under maintenance)
    if (status && status !== 'all') {
      filterQuery.status = status;
    }

    // 4. Facilities filter (multi-select checkboxes: e.g. must have BOTH Projector & Stage)
    if (facilities) {
      const facilityArray = Array.isArray(facilities) ? facilities : [facilities];
      if (facilityArray.length > 0) {
        // $all ensures the venue has every checked facility
        filterQuery.facilities = { $all: facilityArray };
      }
    }

    // Fetch matching venues from MongoDB, sorted by capacity largest to smallest
    const venues = await Venue.find(filterQuery).sort({ capacity: -1 });

    res.render('venues/index', {
      title: 'Venues Directory | Campus Halls & Spaces',
      activePage: 'venues',
      venues,
      allFacilities: ALL_FACILITIES,
      query: {
        search: search || '',
        minCapacity: minCapacity || '',
        facilities: Array.isArray(facilities) ? facilities : (facilities ? [facilities] : []),
        status: status || 'all'
      }
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 2. GET SINGLE VENUE DETAILS & DAY SCHEDULE INSPECTION
// ============================================================================
exports.getVenueDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const venue = await Venue.findById(id);

    if (!venue) {
      return res.redirect('/venues?err=' + encodeURIComponent('Venue not found.'));
    }

    // Date to inspect for schedule (defaults to today's date if not specified)
    const selectedDate = req.query.date || new Date().toISOString().split('T')[0];

    // Find all bookings for this venue on the selected date
    const dayBookings = await Booking.find({
      venue: id,
      date: selectedDate,
      status: { $in: ['approved', 'pending'] }
    })
      .populate('organizer', 'name organization')
      .sort({ startTime: 1 });

    // Find any maintenance blocks for this venue on the selected date
    const dayMaintenance = venue.maintenanceBlocks.filter((block) => block.date === selectedDate);

    res.render('venues/show', {
      title: `${venue.name} | Venue Details & Booking`,
      activePage: 'venues',
      venue,
      selectedDate,
      dayBookings,
      dayMaintenance
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 3. ADMIN: SHOW CREATE VENUE FORM
// ============================================================================
exports.getNewVenueForm = (req, res) => {
  res.render('venues/form', {
    title: 'Create New Venue | Admin',
    activePage: 'venues',
    venue: null,
    allFacilities: ALL_FACILITIES,
    actionUrl: '/venues',
    method: 'POST'
  });
};

// ============================================================================
// 4. ADMIN: CREATE VENUE IN DATABASE
// ============================================================================
exports.createVenue = async (req, res, next) => {
  try {
    const { name, location, capacity, hourlyRate, description, imageUrl, status, facilities } = req.body;

    const facilityArray = Array.isArray(facilities)
      ? facilities
      : facilities
      ? [facilities]
      : [];

    await Venue.create({
      name: name.trim(),
      location: location.trim(),
      capacity: Number(capacity),
      hourlyRate: Number(hourlyRate),
      description: description ? description.trim() : '',
      imageUrl: imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : undefined,
      status: status || 'available',
      facilities: facilityArray
    });

    res.redirect('/venues?msg=' + encodeURIComponent('New venue created successfully!'));
  } catch (err) {
    res.redirect('/venues/new?err=' + encodeURIComponent(err.message));
  }
};

// ============================================================================
// 5. ADMIN: SHOW EDIT VENUE FORM
// ============================================================================
exports.getEditVenueForm = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.redirect('/venues?err=' + encodeURIComponent('Venue not found.'));
    }

    res.render('venues/form', {
      title: `Edit ${venue.name} | Admin`,
      activePage: 'venues',
      venue,
      allFacilities: ALL_FACILITIES,
      actionUrl: `/venues/${venue._id}?_method=PUT`,
      method: 'PUT'
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 6. ADMIN: UPDATE VENUE IN DATABASE
// ============================================================================
exports.updateVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location, capacity, hourlyRate, description, imageUrl, status, facilities } = req.body;

    const facilityArray = Array.isArray(facilities)
      ? facilities
      : facilities
      ? [facilities]
      : [];

    const updated = await Venue.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        location: location.trim(),
        capacity: Number(capacity),
        hourlyRate: Number(hourlyRate),
        description: description ? description.trim() : '',
        imageUrl: imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : undefined,
        status: status || 'available',
        facilities: facilityArray
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.redirect('/venues?err=' + encodeURIComponent('Venue not found.'));
    }

    res.redirect(`/venues/${id}?msg=` + encodeURIComponent('Venue updated successfully!'));
  } catch (err) {
    res.redirect(`/venues/${req.params.id}/edit?err=` + encodeURIComponent(err.message));
  }
};

// ============================================================================
// 7. ADMIN: DELETE VENUE (WITH SAFETY CHECK)
// ============================================================================
exports.deleteVenue = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Safety check: Prevent deleting a venue if it has upcoming approved events
    const todayStr = new Date().toISOString().split('T')[0];
    const hasUpcoming = await Booking.findOne({
      venue: id,
      date: { $gte: todayStr },
      status: 'approved'
    });

    if (hasUpcoming) {
      return res.redirect(
        `/venues/${id}?err=` +
          encodeURIComponent('Cannot delete venue: upcoming approved events exist. Cancel or reschedule them first.')
      );
    }

    await Venue.findByIdAndDelete(id);
    res.redirect('/venues?msg=' + encodeURIComponent('Venue removed successfully.'));
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 8. ADMIN: ADD A MAINTENANCE BLOCK
// ============================================================================
exports.addMaintenanceBlock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime, reason } = req.body;

    if (!date) {
      return res.redirect(`/venues/${id}?err=` + encodeURIComponent('Maintenance date is required.'));
    }

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.redirect('/venues?err=' + encodeURIComponent('Venue not found.'));
    }

    const mStartTime = startTime || '08:00';
    const mEndTime = endTime || '22:00';

    // Check whether an existing booking overlaps with that maintenance period
    // Existing bookings with status 'approved' or 'pending' are considered conflicts
    const overlappingBooking = await Booking.findOne({
      venue: id,
      date: date,
      status: { $in: ['approved', 'pending'] },
      startTime: { $lt: mEndTime },
      endTime: { $gt: mStartTime }
    });

    if (overlappingBooking) {
      return res.redirect(
        `/venues/${id}?err=` +
          encodeURIComponent('Cannot add maintenance block because it overlaps with an existing booking.')
      );
    }

    // Add new maintenance block sub-document
    venue.maintenanceBlocks.push({
      date,
      startTime: mStartTime,
      endTime: mEndTime,
      reason: reason || 'Scheduled Facilities Maintenance'
    });

    await venue.save();
    res.redirect(`/venues/${id}?msg=` + encodeURIComponent(`Maintenance block added for ${date}.`));
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 9. ADMIN: REMOVE A MAINTENANCE BLOCK
// ============================================================================
exports.removeMaintenanceBlock = async (req, res, next) => {
  try {
    const { id, blockId } = req.params;
    const venue = await Venue.findById(id);

    if (!venue) {
      return res.redirect('/venues?err=' + encodeURIComponent('Venue not found.'));
    }

    // Filter out the maintenance block with matching ID
    venue.maintenanceBlocks = venue.maintenanceBlocks.filter(
      (block) => block._id.toString() !== blockId
    );

    await venue.save();
    res.redirect(`/venues/${id}?msg=` + encodeURIComponent('Maintenance block removed.'));
  } catch (err) {
    next(err);
  }
};
