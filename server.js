// ============================================================================
// SERVER.JS - ENTRY POINT OF OUR APPLICATION
// ============================================================================
// This file is where our Node.js + Express web application begins.
// It sets up the server, connects to MongoDB, configures EJS for views,
// and connects all our route files.
// ============================================================================

// 1. Load environment variables from our .env file (e.g. PORT, MONGODB_URI)
require('dotenv').config();

// 2. Import built-in and npm packages
const path = require('path');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const methodOverride = require('method-override');

// 3. Import our database connection and auto-seed function
const connectDB = require('./config/db');
const seedData = require('./config/seed');

// 4. Import custom middleware (makes logged-in user available to all EJS templates)
const { bindUserToLocals } = require('./middleware/auth');

// 5. Import our route handlers (MVC - Routes layer)
const authRoutes = require('./routes/authRoutes');
const indexRoutes = require('./routes/indexRoutes');
const venueRoutes = require('./routes/venueRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB and seed demo accounts/venues if database is empty
(async () => {
  await connectDB();
  await seedData();
})();

// ============================================================================
// TEMPLATE ENGINE SETUP (EJS)
// ============================================================================
// We tell Express to use EJS for rendering HTML pages from the 'views' folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================
// Morgan logs every HTTP request to the terminal console (e.g. "GET /venues 200")
app.use(morgan('dev'));

// Serve static assets (CSS, JS, images) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse form data sent from HTML forms (<form method="POST">)
app.use(express.urlencoded({ extended: true }));

// Parse incoming JSON data (for API calls)
app.use(express.json());

// Allow HTML forms to simulate PUT and DELETE requests using "?_method=PUT"
app.use(methodOverride('_method'));

// Session middleware: keeps users logged in across pages using a secure cookie
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'campus_venue_secret_token_2026_super_secure',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Session stays valid for 24 hours
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// Make 'currentUser' and flash alert messages accessible in every EJS template
app.use(bindUserToLocals);

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================
// Route prefixes help keep our code clean and organized:
app.use('/', authRoutes);        // Login, Register, Logout, Demo Switcher
app.use('/', indexRoutes);       // Dashboard (/dashboard) and Root (/)
app.use('/venues', venueRoutes); // Venue catalog, details, and admin CRUD
app.use('/bookings', bookingRoutes); // Booking requests, conflict resolver, my-bookings
app.use('/admin', adminRoutes);  // Admin approvals and booking management

// ============================================================================
// 404 NOT FOUND HANDLER
// ============================================================================
// If a user navigates to a URL that does not match any route above, render 404.ejs
app.use((req, res) => {
  res.status(404).render('404', {
    title: '404 - Page Not Found',
    activePage: '404'
  });
});

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================
// Catches any unexpected errors so the server does not crash
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

  const statusCode = err.status || 500;
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(statusCode).json({
      error: true,
      message: err.message || 'Internal Server Error'
    });
  }

  res.status(statusCode).render('404', {
    title: 'Error Occurred',
    activePage: '404',
    error: err.message
  });
});

// ============================================================================
// START THE SERVER
// ============================================================================
app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🚀 Server is active at: http://localhost:${PORT}`);
  console.log(`👤 Admin Account:    admin@campus.edu  / admin123`);
  console.log(`👤 Organiser Account: organizer@campus.edu / org123`);
  console.log(`========================================================\n`);
});
