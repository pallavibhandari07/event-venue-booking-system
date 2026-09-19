// ============================================================================
// CONTROLLERS/BOOKINGCONTROLLER.JS - BOOKING ENGINE & STRETCH GOAL
// ============================================================================
// This controller manages:
// 1. Booking creation with strict time-slot conflict prevention
// 2. The Stretch Goal: Auto-suggesting alternative time slots or venues when busy
// 3. Organiser booking history and cancellation
// ============================================================================

const Booking = require('../models/Booking');
const Venue = require('../models/Venue');

// ----------------------------------------------------------------------------
// HELPER FUNCTION 1: Convert time string "HH:mm" to minutes since midnight
// Example: "10:30" -> (10 * 60) + 30 = 630 minutes
// ----------------------------------------------------------------------------
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// ----------------------------------------------------------------------------
// HELPER FUNCTION 2: Interval Overlap Detection Formula
// Two intervals [s1, e1] and [s2, e2] overlap IF AND ONLY IF:
// (start1 < end2) AND (end1 > start2)
// Example:
// Booking A: 10:00 - 14:00 (600 mins to 840 mins)
// Booking B: 12:00 - 15:00 (720 mins to 900 mins)
// 600 < 900 (true) AND 840 > 720 (true) -> OVERLAP DETECTED!
// ----------------------------------------------------------------------------
const isOverlapping = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
};

// Standard candidate campus time slots to evaluate when proposing alternative hours
const STANDARD_CAMPUS_SLOTS = [
  { start: '08:00', end: '11:00', label: 'Morning Slot (08:00 - 11:00)' },
  { start: '11:00', end: '14:00', label: 'Mid-Day Slot (11:00 - 14:00)' },
  { start: '14:00', end: '17:00', label: 'Afternoon Slot (14:00 - 17:00)' },
  { start: '17:00', end: '20:00', label: 'Evening Slot (17:00 - 20:00)' },
  { start: '20:00', end: '22:00', label: 'Night Slot (20:00 - 22:00)' }
];

// ============================================================================
// 1. CREATE BOOKING REQUEST (WITH CONFLICT PREVENTION & AUTO-SUGGESTIONS)
// ============================================================================
exports.createBookingRequest = async (req, res, next) => {
  try {
    // Step A: Extract form data sent from the booking form
    const {
      venueId,
      eventName,
      eventDescription,
      expectedAttendees,
      date,
      startTime,
      endTime
    } = req.body;

    const organizerId = req.session.user._id;

    // Step B: Basic validation - ensure required fields are present
    if (!venueId || !eventName || !expectedAttendees || !date || !startTime || !endTime) {
      return res.redirect(`/venues/${venueId || ''}?err=` + encodeURIComponent('All fields marked with * are required.'));
    }

    // Step C: Look up the requested venue in the database
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.redirect('/venues?err=' + encodeURIComponent('The selected venue could not be found.'));
    }

    // Step C.1: Check if venue is set to maintenance status
    if (venue.status === 'maintenance') {
      return res.redirect(
        `/venues/${venueId}?err=` +
          encodeURIComponent('This venue is currently under maintenance and cannot be booked.')
      );
    }

    // Step D: Validate capacity - attendees cannot exceed venue capacity
    const attendeesNum = Number(expectedAttendees);
    if (attendeesNum > venue.capacity) {
      return res.redirect(
        `/venues/${venueId}?err=` +
          encodeURIComponent(`Expected attendees (${attendeesNum}) exceeds venue capacity (${venue.capacity} seats).`)
      );
    }

    // Step E: Validate time order (start time must be before end time)
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (startMins >= endMins) {
      return res.redirect(`/venues/${venueId}?err=` + encodeURIComponent('End time must be after start time.'));
    }

    // Calculate booking duration in hours and total cost
    const durationHours = Math.max(1, Math.round(((endMins - startMins) / 60) * 10) / 10);
    const totalCost = Math.round(durationHours * venue.hourlyRate);

    // ------------------------------------------------------------------------
    // CONFLICT CHECK 1: Check if venue is under a Maintenance Block on this date
    // ------------------------------------------------------------------------
    const maintenanceConflict = venue.maintenanceBlocks.find((block) => {
      if (block.date !== date) return false;
      return isOverlapping(startTime, endTime, block.startTime, block.endTime);
    });

    // ------------------------------------------------------------------------
    // CONFLICT CHECK 2: Check for existing approved or pending bookings
    // ------------------------------------------------------------------------
    const existingBookingsOnDate = await Booking.find({
      venue: venueId,
      date: date,
      status: { $in: ['approved', 'pending'] }
    });

    const bookingConflict = existingBookingsOnDate.find((existing) =>
      isOverlapping(startTime, endTime, existing.startTime, existing.endTime)
    );

    // ========================================================================
    // IF OVERLAP DETECTED -> RUN STRETCH GOAL AUTO-SUGGESTION ENGINE
    // ========================================================================
    if (maintenanceConflict || bookingConflict) {
      // Create a clear, human-readable explanation of why this slot is blocked
      const conflictReason = maintenanceConflict
        ? `Scheduled Maintenance: "${maintenanceConflict.reason}" (${maintenanceConflict.startTime} - ${maintenanceConflict.endTime})`
        : `An existing booking "${bookingConflict.eventName}" is already scheduled (${bookingConflict.startTime} - ${bookingConflict.endTime}, status: ${bookingConflict.status})`;

      // ----------------------------------------------------------------------
      // STRETCH GOAL OPTION A: Find alternative FREE time slots on THIS venue
      // ----------------------------------------------------------------------
      const alternativeSlots = [];
      for (const slot of STANDARD_CAMPUS_SLOTS) {
        // Don't suggest the exact same slot the user just tried to book
        if (slot.start === startTime && slot.end === endTime) continue;

        // Check if candidate slot overlaps with any existing booking
        const overlapsBooking = existingBookingsOnDate.some((b) =>
          isOverlapping(slot.start, slot.end, b.startTime, b.endTime)
        );

        // Check if candidate slot overlaps with any maintenance block
        const overlapsMaintenance = venue.maintenanceBlocks.some(
          (m) => m.date === date && isOverlapping(slot.start, slot.end, m.startTime, m.endTime)
        );

        // If candidate slot has no overlaps, add it to our suggestions list!
        if (!overlapsBooking && !overlapsMaintenance) {
          alternativeSlots.push(slot);
        }
      }

      // ----------------------------------------------------------------------
      // STRETCH GOAL OPTION B: Find ALTERNATIVE VENUES for the EXACT time slot
      // ----------------------------------------------------------------------
      // Look for other venues that have enough seats and are available
      const otherVenues = await Venue.find({
        _id: { $ne: venue._id },
        capacity: { $gte: attendeesNum },
        status: 'available'
      });

      const alternativeVenues = [];
      for (const altVenue of otherVenues) {
        // Check if the alternative venue has a maintenance hold at that time
        const hasMaintenance = altVenue.maintenanceBlocks.some(
          (m) => m.date === date && isOverlapping(startTime, endTime, m.startTime, m.endTime)
        );
        if (hasMaintenance) continue;

        // Check if the alternative venue has an overlapping booking
        const hasBookingOverlap = await Booking.findOne({
          venue: altVenue._id,
          date: date,
          status: { $in: ['approved', 'pending'] },
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        });

        // If the venue is completely free, add it to our suggestions!
        if (!hasBookingOverlap) {
          const estimatedCost = Math.round(durationHours * altVenue.hourlyRate);
          alternativeVenues.push({
            venue: altVenue,
            cost: estimatedCost
          });
        }
      }

      // Render the custom Conflict & Smart Suggestions View
      return res.render('bookings/conflict', {
        title: 'Booking Conflict Detected | Smart Alternatives',
        activePage: 'venues',
        venue,
        requestedData: {
          eventName,
          eventDescription,
          expectedAttendees: attendeesNum,
          date,
          startTime,
          endTime,
          durationHours,
          totalCost
        },
        conflictReason,
        alternativeSlots,
        alternativeVenues
      });
    }

    // ------------------------------------------------------------------------
    // NO CONFLICT: Save new Booking into MongoDB with 'pending' status
    // ------------------------------------------------------------------------
    const newBooking = await Booking.create({
      venue: venueId,
      organizer: organizerId,
      eventName: eventName.trim(),
      eventDescription: eventDescription ? eventDescription.trim() : '',
      expectedAttendees: attendeesNum,
      date,
      startTime,
      endTime,
      durationHours,
      totalCost,
      status: 'pending' // New requests start as 'pending' for admin approval
    });

    res.redirect(
      '/bookings/my-bookings?msg=' +
        encodeURIComponent(`Booking request for "${newBooking.eventName}" submitted successfully! Awaiting admin approval.`)
    );
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 2. GET ORGANISER BOOKING HISTORY
// ============================================================================
exports.getMyBookings = async (req, res, next) => {
  try {
    const organizerId = req.session.user._id;
    const { status } = req.query;

    // Filter by logged-in organizer
    const filter = { organizer: organizerId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Fetch bookings, populate venue details, sort newest first
    const bookings = await Booking.find(filter)
      .populate('venue')
      .sort({ date: -1, startTime: -1 });

    res.render('bookings/my-bookings', {
      title: 'My Bookings History | Event Organiser',
      activePage: 'my-bookings',
      bookings,
      currentFilter: status || 'all'
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 3. CANCEL A BOOKING (ORGANISER ACTION)
// ============================================================================
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizerId = req.session.user._id;

    // Find the booking and make sure it belongs to the logged-in organizer
    const booking = await Booking.findOne({ _id: id, organizer: organizerId });
    if (!booking) {
      return res.redirect('/bookings/my-bookings?err=' + encodeURIComponent('Booking not found or access denied.'));
    }

    // Only allow cancelling pending or approved bookings
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.redirect('/bookings/my-bookings?err=' + encodeURIComponent(`Cannot cancel an already ${booking.status} booking.`));
    }

    booking.status = 'cancelled';
    await booking.save();

    res.redirect('/bookings/my-bookings?msg=' + encodeURIComponent(`Booking for "${booking.eventName}" has been cancelled.`));
  } catch (err) {
    next(err);
  }
};
