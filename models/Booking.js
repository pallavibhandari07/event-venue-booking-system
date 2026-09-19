// ============================================================================
// MODELS/BOOKING.JS - EVENT BOOKING RESERVATION SCHEMA
// ============================================================================
// Represents an event scheduled at a campus venue by an organiser.
// Uses Mongoose `ref` to establish relationships with Venue and User models.
// ============================================================================

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    // Relationship: Links this booking to the specific Venue document
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'Venue is required']
    },

    // Relationship: Links this booking to the User who created it
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required']
    },

    // Title of the event
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true
    },

    // Detailed description / notes for the facility team
    eventDescription: {
      type: String,
      trim: true,
      default: ''
    },

    // Number of expected attendees (cannot exceed venue capacity)
    expectedAttendees: {
      type: Number,
      required: [true, 'Expected attendees count is required'],
      min: [1, 'Attendees must be at least 1']
    },

    // Booking date stored as 'YYYY-MM-DD'
    date: {
      type: String,
      required: [true, 'Booking date is required']
    },

    // Start time stored as 'HH:mm' (e.g. '10:00')
    startTime: {
      type: String,
      required: [true, 'Start time is required']
    },

    // End time stored as 'HH:mm' (e.g. '13:00')
    endTime: {
      type: String,
      required: [true, 'End time is required']
    },

    // Duration in hours: (endMinutes - startMinutes) / 60
    durationHours: {
      type: Number,
      default: 1
    },

    // Total cost in INR (Indian Rupees): durationHours * venue.hourlyRate
    totalCost: {
      type: Number,
      default: 0
    },

    // Status lifecycle:
    // 1. 'pending'   -> Request submitted by organiser, awaiting admin approval
    // 2. 'approved'  -> Confirmed by venue manager
    // 3. 'rejected'  -> Declined by venue manager (with rejection reason)
    // 4. 'completed' -> Event finished successfully
    // 5. 'cancelled' -> Cancelled by organiser or manager
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending'
    },

    // Explanatory note if the admin rejects the booking
    rejectionReason: {
      type: String,
      default: ''
    },

    // Internal notes from the facility manager
    adminNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes improve query performance when searching for conflicts
bookingSchema.index({ venue: 1, date: 1, status: 1 });
bookingSchema.index({ organizer: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
