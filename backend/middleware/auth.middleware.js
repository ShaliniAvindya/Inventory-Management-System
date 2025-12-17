const jwt = require('jsonwebtoken');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Read token from cookie
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized (No token)' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (err) {
    console.error("AUTH PROTECT ERROR:", err.message);
    res.status(401).json({ success: false, message: 'Not authorized (Invalid token)' });
  }
};
