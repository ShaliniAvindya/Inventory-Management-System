const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const formatUser = require('../utils/formatUser');

// Helper: generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '1d' }
    );
};

// ---------------- Register a new user ----------------
// @route POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { username, email, password, first_name, last_name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const user = await User.create({ username, email, password, first_name, last_name });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please log in.'
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ---------------- Login a user ----------------
// @route POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        console.log('Login attempt for email:', email);

        if (!user) {
            console.log('User not found');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Update last login timestamp
        user.last_login_at = new Date();
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user);

        // Fetch user with populated location
        const hydratedUser = await User.findById(user._id).populate('active_location_id');
        const responseUser = formatUser(hydratedUser);

        // Set cookie for frontend
        res.cookie('token', token, {
            httpOnly: true, // Cannot be accessed by JS
            secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
            sameSite: 'none', // Required for cross-site cookies (Vercel frontend)
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({
            success: true,
            user: responseUser
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

// ---------------- Logout ----------------
// @route POST /api/auth/logout
exports.logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // 10 seconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

// ---------------- Get current user ----------------
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('active_location_id');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: formatUser(user)
        });
    } catch (err) {
        console.error('GetMe error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching user data' });
    }
};
