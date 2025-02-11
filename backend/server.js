const dotenv = require('dotenv');
const express = require('express');
const { testConnection } = require('./src/config/database');

dotenv.config();

const app = express();

const PORT = process.env.PORT;

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

// JSon Body Parser
app.use(express.json());

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
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