const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const COOKIE_NAME = authMiddleware.COOKIE_NAME;
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE || 'strict').toLowerCase();
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: COOKIE_SAME_SITE,
    path: '/api',
    maxAge: 60 * 60 * 1000,
};

function issueSession(res, user) {
    const token = jwt.sign(
        { username: user.username },
        process.env.JWT_SECRET,
        {
            algorithm: 'HS256',
            subject: String(user.id),
            expiresIn: '1h',
        }
    );
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

function validCredentials(username, password) {
    return typeof username === 'string'
        && username.trim().length >= 3
        && username.trim().length <= 50
        && typeof password === 'string'
        && Buffer.byteLength(password, 'utf8') >= 12
        && Buffer.byteLength(password, 'utf8') <= 72;
}

router.post('/register', async (req, res, next) => {
    const { username, password } = req.body || {};
    if (!validCredentials(username, password)) {
        return res.status(400).json({
            message: 'Username must be 3–50 characters and password must be 12–72 bytes.',
        });
    }

    try {
        const normalizedUsername = username.trim();
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await db.tx(async transaction => {
            await transaction.query('SELECT pg_advisory_xact_lock(41823, 1)');
            const { count } = await transaction.one(
                'SELECT COUNT(*)::int AS count FROM users'
            );
            if (count > 0) return null;

            return transaction.one(
                `INSERT INTO users (username, password_hash)
                 VALUES ($1, $2)
                 RETURNING id, username`,
                [normalizedUsername, passwordHash]
            );
        });

        if (!user) {
            return res.status(403).json({ message: 'Initial account setup is already complete.' });
        }

        issueSession(res, user);
        return res.status(201).json({ user });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Username is already in use.' });
        }
        return next(error);
    }
});

router.post('/login', async (req, res, next) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string'
        || typeof password !== 'string'
        || Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    try {
        const user = await db.oneOrNone(
            'SELECT id, username, password_hash FROM users WHERE lower(username) = lower($1)',
            [username.trim()]
        );
        const isMatch = user
            ? await bcrypt.compare(password, user.password_hash)
            : false;

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const safeUser = { id: user.id, username: user.username };
        issueSession(res, safeUser);
        return res.json({ user: safeUser });
    } catch (error) {
        return next(error);
    }
});

router.get('/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: COOKIE_SAME_SITE,
        path: '/api',
    });
    res.status(204).end();
});

module.exports = router;
