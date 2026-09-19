// ============================================================================
// MODELS/USER.JS - USER DATA SCHEMA
// ============================================================================
// In Mongoose, a Schema defines the shape and rules of documents inside a
// MongoDB collection. This schema represents all registered users
// (both Event Organisers and Venue Managers / Admins).
// ============================================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },

    // Email address used for signing in (must be unique)
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email format']
    },

    // Password - will be securely hashed with bcrypt before saving
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },

    // Role determines what features this user can access
    // 'organizer': Can book venues, view history, resolve conflicts
    // 'admin': Can add venues, block dates for maintenance, approve/reject bookings
    role: {
      type: String,
      enum: ['organizer', 'admin'],
      default: 'organizer'
    },

    // Campus organization or student club (optional)
    organization: {
      type: String,
      trim: true,
      default: 'Campus Community'
    },

    // Contact telephone number (optional)
    phone: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    // Automatically creates 'createdAt' and 'updatedAt' timestamp fields
    timestamps: true
  }
);

// ----------------------------------------------------------------------------
// PRE-SAVE HOOK: Automatically Hash Password Before Storing in Database
// ----------------------------------------------------------------------------
// We NEVER store plain text passwords in the database!
// bcrypt adds a cryptographic salt and hashes the password string.
userSchema.pre('save', async function (next) {
  // If the password wasn't changed (e.g. user updated just their phone number), skip hashing
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// HELPER METHOD: Verify entered password against the hashed password
// ----------------------------------------------------------------------------
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
