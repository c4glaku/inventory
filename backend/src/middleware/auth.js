const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'inventory_session';

function authMiddleware(req, res, next) {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
        });
        req.user = { id: Number(decoded.sub), username: decoded.username };
        return next();
    } catch {
        return res.status(401).json({ message: 'Session expired or invalid' });
    }
}

authMiddleware.COOKIE_NAME = COOKIE_NAME;

module.exports = authMiddleware;
