// ============================================================================
// MIDDLEWARE/AUTH.JS - AUTHENTICATION & ROLE GUARDS
// ============================================================================
// Middleware functions in Express sit in between the request and the controller.
// They can check if a user is logged in, check their role, and redirect them if
// they don't have permission to view a page.
// ============================================================================

// 1. Check if the user is logged in
// If logged in, proceed with next(). If not, redirect them to the /login page.
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next(); // User is logged in, continue to the requested route
  }
  // Remember where the user was trying to go so we can redirect them back after login
  req.session.returnTo = req.originalUrl;
  return res.redirect('/login?err=' + encodeURIComponent('Please sign in to access this page.'));
};

// 2. Check if the logged-in user is an Administrator (Venue Manager)
// Used to protect admin-only pages like /admin/bookings and /venues/new.
exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next(); // User is an admin, allow access
  }
  // If not admin, redirect with an error message
  return res.redirect('/?err=' + encodeURIComponent('Access denied. Administrator privileges required.'));
};

// 3. Check if the logged-in user is an Event Organiser
exports.isOrganizer = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'organizer') {
    return next(); // User is an organizer, allow access
  }
  return res.redirect('/?err=' + encodeURIComponent('Access denied. Organizer privileges required.'));
};

// 4. Helper middleware: Make user data and alert messages available to ALL EJS templates
// This avoids having to manually pass 'currentUser' and 'message' in every single res.render() call!
exports.bindUserToLocals = (req, res, next) => {
  res.locals.currentUser = req.session ? req.session.user : null;
  res.locals.message = req.query.msg || null;
  res.locals.error = req.query.err || null;
  res.locals.currentPath = req.path;
  next();
};
