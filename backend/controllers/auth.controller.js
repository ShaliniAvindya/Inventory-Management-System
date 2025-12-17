const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const formatUser = require('../utils/formatUser');

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = await User.create({
      username, email, password, first_name, last_name
    });

    res.status(201).json({ success: true, message: 'User registered successfully. Please log in.' });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// Login a User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Update last login timestamp
    user.last_login_at = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user);

    // Set cookie for cross-origin
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,           // must be true on Vercel
      sameSite: 'none',       // cross-origin cookie
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    const hydratedUser = await User.findById(user._id).populate('active_location_id');
    const responseUser = formatUser(hydratedUser);

    res.status(200).json({ success: true, user: responseUser });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// Logout
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });

  res.status(200).json({ success: true, data: {} });
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(req.user.id).populate('active_location_id');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (err) {
    console.error("GETME ERROR:", err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
