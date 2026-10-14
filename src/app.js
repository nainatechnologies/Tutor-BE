const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import error handler
const errorHandler = require('./shared/middlewares/error.middleware');

// Initialize express
const app = express();

// Middlewares
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin === process.env.FRONTEND_URL ||
            origin === process.env.ADMIN_URL
        ) {
            return callback(null, true);
        }
        callback(null, true);
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Swagger Documentation ---
const { swaggerUi, specs } = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// --- Routes ---
const authRoutes = require('./modules/auth/routes/auth.routes');
const masterRoutes = require('./modules/master/routes/master.routes');
const usersRoutes = require('./modules/users/routes/users.routes');
const connectionRoutes = require('./modules/connections/routes/connection.routes');
const paymentRoutes = require('./modules/payments/routes/payment.routes');
const searchRoutes = require('./modules/search/routes/search.routes');
const walletRoutes = require('./modules/wallet/routes/wallet.routes');
const appointmentRoutes = require('./modules/appointments/routes/appointment.routes');
const adminRoutes = require('./modules/admin/routes/admin.routes');
const adminMasterRoutes = require('./modules/master/routes/master.admin.routes');

app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/catalog', adminMasterRoutes);

// Basic route to check if server is running
app.get('/', (req, res) => {
    res.json({ message: 'Tutor Backend API is running smoothly!' });
});

// Use global error handler (should be the last middleware)
app.use(errorHandler);

module.exports = app;
