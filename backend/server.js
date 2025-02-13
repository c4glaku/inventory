require('dotenv').config();

const express = require('express');
const { testConnection } = require('./src/config/database');
const cors = require('cors');

// Initialize express
const app = express();

app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies
app.use(express.json());

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
const productsRouter = require('./src/routes/products');
const suppliersRouter = require('./src/routes/suppliers');

app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);

const PORT = process.env.PORT || 3000;

testConnection()
    .then(connected => {
        if (connected) {
            console.log('Database connection verified');
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        } else {
            console.log('Failed to connect to database');
            process.exit(1);
        }
    });



// Health Check Endpoint
app.get('/api/health', (req,res) => {
    try {
        res.status(200).json({
            status: 'success',
            message: 'Hello World',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check endpoint error', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

app.get('api/test', (req, res) => {
    res.json({ message: 'CORS is working' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something broke!'
    });
});

// Uncaught Exceptions Handler
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception: ', err);
    process.exit(1);
})