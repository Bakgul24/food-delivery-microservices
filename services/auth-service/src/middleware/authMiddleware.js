// src/middleware/authMiddleware.js
const { verifyToken } = require('../utils/jwt');

/**
 * Bu middleware, gelen isteğin Authorization header'ında geçerli bir JWT
 * olup olmadığını kontrol eder. Geçerliyse, token içindeki bilgiyi
 * req.user'a ekler ve isteğin devam etmesine izin verir.
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token gerekli (Authorization: Bearer <token>)' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // { userId, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }
}

/**
 * Belirli rollere izin veren ek bir middleware.
 * Kullanım: requireRole('restaurant', 'courier')
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }
        next();
    };
}

module.exports = { requireAuth, requireRole };