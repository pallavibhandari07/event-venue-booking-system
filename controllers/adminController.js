// ============================================================================
// CONTROLLERS/ADMINCONTROLLER.JS - BOOKING APPROVALS & STATUS MANAGEMENT
// ============================================================================
// This controller allows the Venue Manager / Admin to:
// 1. View all booking requests across all campus venues
// 2. Filter requests by status (Pending, Approved, Completed, Rejected, Cancelled)
// 3. Approve requests (with conflict safety verification)
// 4. Reject requests (with an explanation/reason for the organiser)
// 5. Mark approved events as Completed or Cancelled
// ============================================================================

const Booking = require('../models/Booking');

// 1. GET ALL BOOKINGS FOR ADMIN REVIEW
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, venueId } = req.query;
    const filter = {};

    // Filter by status if selected
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filter by specific venue if selected
    if (venueId && venueId !== 'all') {
      filter.venue = venueId;
    }

    // Query bookings, populating both venue info and organizer details
    const bookings = await Booking.find(filter)
      .populate('venue')
      .populate('organizer', 'name email organization phone')
      .sort({ createdAt: -1 });

    res.render('bookings/admin-list', {
      title: 'Booking Requests Management | Admin Console',
      activePage: 'admin-bookings',
      bookings,
      currentStatus: status || 'all'
    });
  } catch (err) {
    next(err);
  }
};

// 2. UPDATE BOOKING STATUS (Approve, Reject, Mark Completed, or Cancel)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, adminNotes } = req.body;

    const booking = await Booking.findById(id).populate('venue');
    if (!booking) {
      return res.redirect('/admin/bookings?err=' + encodeURIComponent('Booking request not found.'));
    }

    // If approving, do a final safety check that another booking was not approved at the same slot
    if (status === 'approved') {
      const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        venue: booking.venue._id,
        date: booking.date,
        status: 'approved',
        startTime: { $lt: booking.endTime },
        endTime: { $gt: booking.startTime }
      });

      if (conflict) {
        return res.redirect(
          '/admin/bookings?err=' +
            encodeURIComponent(
              `Cannot approve: Overlaps with an already approved booking "${conflict.eventName}" (${conflict.startTime} - ${conflict.endTime})`
            )
        );
      }
    }

    // Update status and optional notes
    booking.status = status;
    if (rejectionReason) booking.rejectionReason = rejectionReason.trim();
    if (adminNotes) booking.adminNotes = adminNotes.trim();

    await booking.save();

    res.redirect(
      '/admin/bookings?msg=' +
        encodeURIComponent(`Booking "${booking.eventName}" status updated to ${status.toUpperCase()}.`)
    );
  } catch (err) {
    next(err);
  }
};
