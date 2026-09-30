const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import error handler
const errorHandler = require('./shared/middlewares/error.middleware');

// Initialize express
const app = express();

// Middlewares
app.use(cors({
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes will be imported here later ---
// e.g., app.use('/api/users', userRoutes);

// Basic route to check if server is running
app.get('/', (req, res) => {
    res.json({ message: 'Tutor Backend API is running smoothly!' });
});

// Use global error handler (should be the last middleware)
app.use(errorHandler);

module.exports = app;
