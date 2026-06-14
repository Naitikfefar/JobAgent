const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  let token;
  try {
    // Log whether an Authorization header is present for debugging (do not log full token)
    const incomingAuth = req.header('Authorization');
    if (!incomingAuth) {
      console.warn('Auth middleware: No Authorization header on', req.method, req.originalUrl);
    } else {
      console.log('Auth middleware: Authorization header present, length=', incomingAuth.length, 'for', req.method, req.originalUrl);
    }
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error('JWT verify failed. token len:', token?.length, 'JWT_SECRET set:', !!process.env.JWT_SECRET, 'error:', error && error.message);
    res.status(401).json({ message: 'Token is not valid', error: error && error.message });
  }
};

module.exports = auth;
