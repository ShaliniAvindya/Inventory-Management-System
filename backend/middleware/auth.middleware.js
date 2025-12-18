const jwt = require('jsonwebtoken');

exports.protect = async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route (No Token)' });
  }

  try {
    const decoded = jwt.verify(token, '05bbe048d946999d993af11d05dc430b');
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Not authorized to access this route (Invalid Token)' });
  }
};
