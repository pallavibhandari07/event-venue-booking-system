// ============================================================================
// CONTROLLERS/DASHBOARDCONTROLLER.JS - ANALYTICS & PORTAL
// ============================================================================
// This controller renders the home dashboard based on who is logged in:
//
// 1. ADMIN DASHBOARD:
//    - Today's approved events schedule
//    - Upcoming 30 days events schedule
//    - Venue-wise utilisation (total hours booked & percentage)
//    - Revenue metrics (total revenue & today's projected revenue)
//    - Pending booking requests awaiting approval
//
// 2. ORGANISER DASHBOARD:
//    - Organiser's upcoming events
//    - Status breakdown (pending, approved, completed)
//    - Quick venue discovery cards
// ============================================================================

const Venue = require('../models/Venue');
const Booking = require('../models/Booking');

exports.getDashboard = async (req, res, next) => {
  try {
    const user = req.session.user;

    if (!user) {
      return res.redirect('/login');
    }

    // Today's date in YYYY-MM-DD format
    const todayStr = new Date().toISOString().split('T')[0];

    // ========================================================================
    // 1. ADMIN OPERATIONS & ANALYTICS DASHBOARD
    // ========================================================================
    if (user.role === 'admin') {
      // 1A. Fetch Today's Events (approved events happening today)
      const todayEvents = await Booking.find({
        date: todayStr,
        status: 'approved'
      })
        .populate('venue')
        .populate('organizer', 'name organization')
        .sort({ startTime: 1 });

      // Calculate 30 days from today in YYYY-MM-DD format
      const thirtyDaysAhead = new Date();
      thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
      const thirtyDaysStr = thirtyDaysAhead.toISOString().split('T')[0];

      // 1B. Fetch Upcoming Events genuinely within the next 30 days (todayStr < date <= thirtyDaysStr)
      const upcomingEvents = await Booking.find({
        date: { $gt: todayStr, $lte: thirtyDaysStr },
        status: { $in: ['approved', 'pending'] }
      })
        .populate('venue')
        .populate('organizer', 'name organization')
        .sort({ date: 1, startTime: 1 });

      // 1C. Fetch Pending Bookings requiring review
      const pendingBookings = await Booking.find({ status: 'pending' })
        .populate('venue')
        .populate('organizer', 'name organization')
        .sort({ createdAt: -1 });

      // 1D. Calculate Total Revenue (from approved and completed events)
      const revenueBookings = await Booking.find({
        status: { $in: ['approved', 'completed'] }
      });
      const totalRevenue = revenueBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);

      // 1E. Calculate Today's Projected Revenue
      const todayRevenue = todayEvents.reduce((sum, b) => sum + (b.totalCost || 0), 0);

      // 1F. Calculate Venue-Wise Utilisation Breakdown
      const allVenues = await Venue.find();
      const venueStats = await Promise.all(
        allVenues.map(async (venue) => {
          // Find all bookings on this specific venue
          const venueBookings = await Booking.find({
            venue: venue._id,
            status: { $in: ['approved', 'completed'] }
          });

          // Sum hours booked and revenue generated
          const totalHours = venueBookings.reduce((sum, b) => sum + (b.durationHours || 0), 0);
          const revenue = venueBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);

          return {
            venue,
            bookingsCount: venueBookings.length,
            totalHours,
            revenue
          };
        })
      );

      // Sort venues by hours booked (most used first)
      venueStats.sort((a, b) => b.totalHours - a.totalHours);

      // Meaningful Utilisation Calculation: (Booked Hours / Available Hours) * 100
      // Based on campus standard operating window of 14 hours/day (08:00 to 22:00) over 30 days = 420 available hours
      const DAILY_OPERATING_HOURS = 14;
      const MONTHLY_AVAILABLE_HOURS = 30 * DAILY_OPERATING_HOURS; // 420 hours per venue

      venueStats.forEach((s) => {
        const rate = (s.totalHours / MONTHLY_AVAILABLE_HOURS) * 100;
        s.utilisationPercent = Math.min(100, Math.round(rate * 10) / 10);
      });

      return res.render('dashboard/admin', {
        title: 'Admin Operations & Analytics Dashboard',
        activePage: 'dashboard',
        todayStr,
        todayEvents,
        upcomingEvents,
        pendingBookings,
        venuesCount: allVenues.length,
        totalRevenue,
        todayRevenue,
        venueStats
      });
    }

    // ========================================================================
    // 2. ORGANISER PORTAL DASHBOARD
    // ========================================================================
    // Fetch all bookings made by this logged-in organizer
    const myBookings = await Booking.find({ organizer: user._id })
      .populate('venue')
      .sort({ createdAt: -1 });

    // Filter for upcoming bookings
    const myUpcoming = myBookings.filter(
      (b) => b.date >= todayStr && (b.status === 'approved' || b.status === 'pending')
    );

    // Calculate organizer summary stats
    const myStats = {
      total: myBookings.length,
      pending: myBookings.filter((b) => b.status === 'pending').length,
      approved: myBookings.filter((b) => b.status === 'approved').length,
      completed: myBookings.filter((b) => b.status === 'completed').length
    };

    // Grab up to 4 available venues for quick discovery
    const featuredVenues = await Venue.find({ status: 'available' }).limit(4);

    res.render('dashboard/organizer', {
      title: 'Organiser Portal | Event & Venue Hub',
      activePage: 'dashboard',
      todayStr,
      myStats,
      myUpcoming,
      myRecentBookings: myBookings.slice(0, 5),
      featuredVenues
    });
  } catch (err) {
    next(err);
  }
};
