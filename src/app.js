const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import error handler
const errorHandler = require('./shared/middlewares/error.middleware');

// Initialize express
const app = express();

// Middlewares
const isDev = process.env.NODE_ENV !== 'production';

// Allowed client origins derived dynamically from environment variables
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
].filter(Boolean).map(url => url.replace(/\/$/, ''));

app.use(cors({
    origin: (origin, callback) => {
        // 1. Allow non-browser requests (Postman, mobile apps, server-to-server)
        if (!origin) return callback(null, true);

        const cleanOrigin = origin.replace(/\/$/, '');

        // 2. Allow localhost and 127.0.0.1 in development mode only
        if (isDev && (cleanOrigin.startsWith('http://localhost:') || cleanOrigin.startsWith('http://127.0.0.1:'))) {
            return callback(null, true);
        }

        // 3. Strict whitelist check against .env client domains
        if (allowedOrigins.includes(cleanOrigin)) {
            return callback(null, true);
        }

        // 4. Reject all unauthorized origins
        return callback(null, false);
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Swagger Documentation ---
const { swaggerUi, specs } = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

// --- Routes ---
const authRoutes = require('./modules/auth/routes/auth.routes');
const masterRoutes = require('./modules/master/routes/master.routes');
const usersRoutes = require('./modules/users/routes/users.routes');
const connectionRoutes = require('./modules/connections/routes/connection.routes');
const paymentRoutes = require('./modules/payments/routes/payment.routes');
const searchRoutes = require('./modules/search/routes/search.routes');
const walletRoutes = require('./modules/wallet/routes/wallet.routes');

const reviewRoutes = require('./modules/reviews/routes/review.routes');
const complaintRoutes = require('./modules/support/routes/complaint.routes');
const notificationRoutes = require('./modules/notifications/routes/notification.routes');
const adminRoutes = require('./modules/admin/routes/admin.routes');
const adminMasterRoutes = require('./modules/master/routes/master.admin.routes');

// Mount routes with and without /api prefix for maximum compatibility
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/master', '/master'], masterRoutes);
app.use(['/api/users', '/users'], usersRoutes);
app.use(['/api/connections', '/connections'], connectionRoutes);
app.use(['/api/payments', '/payments'], paymentRoutes);
app.use(['/api/search', '/search'], searchRoutes);
app.use(['/api/wallet', '/wallet'], walletRoutes);

app.use(['/api/reviews', '/reviews'], reviewRoutes);
app.use(['/api/complaints', '/complaints'], complaintRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/admin/catalog', '/admin/catalog'], adminMasterRoutes);

// Basic routes to check if server is running
app.get(['/', '/api'], (req, res) => {
    res.json({ status: 'success', message: 'Tutor Backend API is running smoothly!' });
});

// Use global error handler (should be the last middleware)
app.use(errorHandler);

module.exports = app;
