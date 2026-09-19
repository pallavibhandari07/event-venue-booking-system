// ============================================================================
// CONTROLLERS/AUTHCONTROLLER.JS - USER AUTHENTICATION & SESSIONS
// ============================================================================
// This controller handles:
// 1. Rendering login and registration pages
// 2. Processing user login (checking email, verifying bcrypt password hash)
// 3. Storing authenticated user information inside req.session
// 4. Logging out (destroying session)
// 5. One-click demo login switcher for fast evaluation
// ============================================================================

const User = require('../models/User');

// GET /login - Show sign-in page
exports.getLogin = (req, res) => {
  // If user is already logged in, redirect them directly to the dashboard
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', {
    title: 'Sign In | Event & Venue Management',
    activePage: 'login'
  });
};

// POST /login - Process sign-in form submission
exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.redirect('/login?err=' + encodeURIComponent('Please provide both email and password.'));
    }

    // 2. Find user in MongoDB by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.redirect('/login?err=' + encodeURIComponent('Invalid email or password.'));
    }

    // 3. Compare entered password with hashed password in database using bcrypt
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.redirect('/login?err=' + encodeURIComponent('Invalid email or password.'));
    }

    // 4. Save safe user information into the session cookie
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization
    };

    // 5. Redirect user to intended page or dashboard
    const redirectUrl = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(redirectUrl + '?msg=' + encodeURIComponent(`Welcome back, ${user.name}!`));
  } catch (err) {
    next(err);
  }
};

// GET /register - Show registration page
exports.getRegister = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/register', {
    title: 'Register Account | Event & Venue Management',
    activePage: 'register'
  });
};

// POST /register - Process registration form submission
exports.postRegister = async (req, res, next) => {
  try {
    const { name, email, password, role, organization, phone } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.redirect('/register?err=' + encodeURIComponent('Name, email, and password are required.'));
    }

    // 2. Ensure email is not already taken
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.redirect('/register?err=' + encodeURIComponent('An account with this email already exists.'));
    }

    // 3. Create new user document in MongoDB (public registration always creates an organizer)
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'organizer',
      organization: organization ? organization.trim() : 'Campus Community',
      phone: phone ? phone.trim() : ''
    });

    // 4. Automatically log in the newly registered user
    req.session.user = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      organization: newUser.organization
    };

    res.redirect('/dashboard?msg=' + encodeURIComponent('Account created successfully!'));
  } catch (err) {
    next(err);
  }
};

// POST /logout - Log out current user
exports.logout = (req, res) => {
  // Destroy session cookie in MongoDB / memory
  req.session.destroy(() => {
    res.redirect('/login?msg=' + encodeURIComponent('You have been logged out successfully.'));
  });
};

// GET /demo-login/:role - Quick 1-click evaluator login
exports.demoLogin = async (req, res, next) => {
  try {
    const { role } = req.params;
    const targetEmail = role === 'admin' ? 'admin@campus.edu' : 'organizer@campus.edu';

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.redirect('/login?err=' + encodeURIComponent(`Demo ${role} account not found.`));
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization
    };

    const roleTitle = role === 'admin' ? 'Venue Manager / Admin' : 'Event Organiser';
    res.redirect('/dashboard?msg=' + encodeURIComponent(`Logged in as Demo ${roleTitle}`));
  } catch (err) {
    next(err);
  }
};
