const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');
const { requireRole } = require('../../../shared/middlewares/role.middleware');
const validate = require('../../../shared/middlewares/validate.middleware');
const {
    updateStatusSchema,
    registerTutorSchema,
    getRegistrationRequestsSchema,
    getAdminLeadsSchema,
    getAdminPaymentsSchema,
    getParentRegistrationsSchema,
    getAdminAppointmentsSchema,
    updateAdminAppointmentSchema,
} = require('../validators/admin.validator');

// Protect admin routes: Verify JWT authentication and enforce Admin role
router.use(protect);
router.use(requireRole('admin', 'ADMIN'));

// GET /api/admin/registration-requests
router.get(
    '/registration-requests',
    validate(getRegistrationRequestsSchema, 'query'),
    adminController.getRegistrationRequests
);


// PATCH /api/admin/registration-requests/:id
router.patch(
    '/registration-requests/:id',
    validate(updateStatusSchema, 'body'),
    adminController.updateRegistrationStatus
);

// POST /api/admin/registration-requests (or POST /api/admin/tutors)
router.post(
    '/registration-requests',
    validate(registerTutorSchema, 'body'),
    adminController.registerTutor
);
router.post(
    '/tutors',
    validate(registerTutorSchema, 'body'),
    adminController.registerTutor
);
// GET /api/admin/dashboard/stats
router.get(
    '/dashboard/stats',
    adminController.getDashboardStats
);

// GET /api/admin/leads
router.get(
    '/leads',
    validate(getAdminLeadsSchema, 'query'),
    adminController.getAdminLeads
);

// GET /api/admin/payments
router.get(
    '/payments',
    validate(getAdminPaymentsSchema, 'query'),
    adminController.getAdminPayments
);

// GET /api/admin/parent-registrations
router.get(
    '/parent-registrations',
    validate(getParentRegistrationsSchema, 'query'),
    adminController.getParentRegistrations
);

// GET /api/admin/appointments
router.get(
    '/appointments',
    validate(getAdminAppointmentsSchema, 'query'),
    adminController.getAppointments
);

// PATCH /api/admin/appointments/:id
router.patch(
    '/appointments/:id',
    validate(updateAdminAppointmentSchema, 'body'),
    adminController.updateAppointment
);

module.exports = router;

