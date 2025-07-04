// middleware/auth.js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to the request object (e.g., req.user = { userId: ..., role: ... })
            req.user = decoded; // The payload from our JWT

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ error: 'Unauthorized', details: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Unauthorized', details: 'Not authorized, no token.' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden', details: 'Access denied. You do not have the required role.' });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };