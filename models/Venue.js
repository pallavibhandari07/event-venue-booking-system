// ============================================================================
// MODELS/VENUE.JS - VENUE & MAINTENANCE SCHEMA
// ============================================================================
// Represents campus halls, auditoriums, meeting rooms, and open spaces.
// Includes nested maintenance blocks so admins can block specific dates.
// ============================================================================

const mongoose = require('mongoose');

// Sub-schema: Represents a scheduled maintenance block on a venue
const maintenanceBlockSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true // Stored in 'YYYY-MM-DD' format for easy date comparison
  },
  startTime: {
    type: String,
    default: '08:00' // 'HH:mm' format
  },
  endTime: {
    type: String,
    default: '22:00' // 'HH:mm' format
  },
  reason: {
    type: String,
    default: 'Scheduled Maintenance'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Main Venue Schema
const venueSchema = new mongoose.Schema(
  {
    // Venue name (e.g. "Grand Central Auditorium")
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      unique: true,
      trim: true
    },

    // Detailed description of the space
    description: {
      type: String,
      trim: true,
      default: ''
    },

    // Physical campus location (e.g. "Science Block, Level 1")
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },

    // Maximum seating/attendee capacity
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },

    // Array of facility tags (e.g. ['Projector', 'Air Conditioning', 'Stage'])
    facilities: {
      type: [String],
      default: []
    },

    // Hourly rental rate in INR (Indian Rupees)
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative']
    },

    // Cover image URL for card displays
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
    },

    // Overall venue status
    status: {
      type: String,
      enum: ['available', 'maintenance'],
      default: 'available'
    },

    // Embedded array of maintenance holds on this venue
    maintenanceBlocks: [maintenanceBlockSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Venue', venueSchema);
