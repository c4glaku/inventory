const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), quiet: true });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const { testConnection, closeDatabase } = require('./src/config/database');
const authMiddleware = require('./src/middleware/auth');
const authRoutes = require('./src/routes/auth');
const productsRouter = require('./src/routes/products');
const suppliersRouter = require('./src/routes/suppliers');
const exportImportRouter = require('./src/routes/export-import');

const app = express();
const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS || 'http://localhost:5173')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
);

function validateEnvironment() {
    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
        throw new Error('JWT_SECRET must contain at least 32 random bytes.');
    }
    if (!process.env.DB_PASSWORD && !process.env.DATABASE_URL) {
        throw new Error('Set DB_PASSWORD or DATABASE_URL before starting the server.');
    }
    const sameSite = (process.env.COOKIE_SAME_SITE || 'strict').toLowerCase();
    if (!['strict', 'lax', 'none'].includes(sameSite)) {
        throw new Error('COOKIE_SAME_SITE must be strict, lax, or none.');
    }
    if (sameSite === 'none' && process.env.NODE_ENV !== 'production') {
        throw new Error('COOKIE_SAME_SITE=none requires NODE_ENV=production and HTTPS.');
    }
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        callback(null, !origin || allowedOrigins.has(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
}));
app.use((req, res, next) => {
    const changesState = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const origin = req.get('origin');
    if (changesState && origin && !allowedOrigins.has(origin)) {
        return res.status(403).json({ message: 'Request origin is not allowed.' });
    }
    return next();
});

app.use('/api/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts. Try again later.' },
}));
app.use(express.json({ limit: '2mb', strict: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', authMiddleware, productsRouter);
app.use('/api/suppliers', authMiddleware, suppliersRouter);
app.use('/api', authMiddleware, exportImportRouter);

app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const requestedStatus = error.status || error.statusCode;
    const status = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
        ? requestedStatus
        : 500;
    if (status >= 500) {
        console.error('API request failed:', error.code || error.name || 'unknown error');
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'CSV file exceeds the 10 MB limit.' });
    }
    if (typeof error.code === 'string' && error.code.startsWith('LIMIT_')) {
        return res.status(400).json({ message: 'The uploaded file is invalid.' });
    }
    if (error.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request body exceeds the 2 MB limit.' });
    }
    return res.status(status).json({
        message: status >= 500 ? 'An unexpected server error occurred.' : error.message,
    });
});

async function start() {
    validateEnvironment();
    if (!(await testConnection())) {
        throw new Error('Unable to connect to PostgreSQL. Check the database settings.');
    }

    const port = Number(process.env.PORT || 3000);
    const host = process.env.HOST || '127.0.0.1';
    const server = app.listen(port, host, () => {
        console.log(`Inventory API listening at http://${host}:${port}`);
    });

    const shutdown = signal => {
        console.log(`Received ${signal}; closing the server.`);
        server.close(async () => {
            await closeDatabase();
            process.exit(0);
        });
    };
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
}

if (require.main === module) {
    start().catch(async error => {
        console.error(error.message);
        await closeDatabase();
        process.exitCode = 1;
    });
}

module.exports = { app, start };
