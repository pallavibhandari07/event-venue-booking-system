const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middleware/auth');

// Root Route: Redirect to dashboard if logged in, else login
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Main Dashboard
router.get('/dashboard', isAuthenticated, dashboardController.getDashboard);

// API Health Check
router.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: dbState === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbState === 1,
      state: dbState,
      name: mongoose.connection.name || 'web_ass_2'
    },
    user: req.session ? req.session.user : null
  });
});

module.exports = router;
