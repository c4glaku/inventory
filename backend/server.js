require('dotenv').config();
const express = require('express');
const { testConnection } = require('./src/config/database');
const cors = require('cors');

// Initialize express
const app = express();

// Middleware Setup
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});


// Health Check Endpoint
app.get('/api/health', (req,res) => {
    res.json({
        status: 'success',
        message: 'Server is healthy',
        timestame: new Date().toISOString()
    });
});

// app.get('api/test', (req, res) => {  // Missing forward slash
//     res.json({ message: 'CORS is working' });
// });

// Routes
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

const authMiddleware = require('./src/middleware/auth');

const productsRouter = require('./src/routes/products');
const suppliersRouter = require('./src/routes/suppliers');
const exportImportRouter = require('./src/routes/export-import');


app.use('/api/products', authMiddleware, productsRouter);
app.use('/api/suppliers', authMiddleware, suppliersRouter);
app.use('/api', authMiddleware, exportImportRouter);

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Something broke!'
    });
});

const PORT = process.env.PORT || 3000;

testConnection()
    .then(connected => {
        if (connected) {
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        } else {
            console.log('Failed to connect to database');
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Server startup error:', err);
        process.exit(1);
    });

// Uncaught Exceptions Handler
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception: ', err);
    process.exit(1);
})

// Unhandled Rejection Handler
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection: ', err);
    process.exit(1);
});