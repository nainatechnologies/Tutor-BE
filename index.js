require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const http = require('http');

const PORT = process.env.PORT;

// Create the raw HTTP server
const server = http.createServer(app);


// Import models to ensure associations are registered
require('./src/modules/users/models');

// Start the server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Automatically create tables based on models (disabled alter to prevent ER_TOO_MANY_KEYS)
        await sequelize.sync();
        console.log('Database tables synchronized successfully.');
        // Listen using the server, not the Express app
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();
