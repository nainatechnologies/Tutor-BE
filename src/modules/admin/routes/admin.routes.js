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
    updateAdminProfileSchema,
} = require('../validators/admin.validator');

// Protect admin routes: Verify JWT authentication and enforce Admin role
router.use(protect);
router.use(requireRole('admin', 'ADMIN'));

// GET /api/admin/profile - Retrieve admin & business profile
router.get('/profile', adminController.getAdminProfile);

// PUT /api/admin/profile - Update admin & business profile
router.put('/profile', validate(updateAdminProfileSchema), adminController.updateAdminProfile);

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

// GET /api/admin/revenue/analytics
router.get(
    '/revenue/analytics',
    adminController.getRevenueAnalytics
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

const reviewController = require('../../reviews/controllers/review.controller');
const {
    getAdminReviewsSchema,
    updateReviewStatusSchema,
} = require('../../reviews/validators/review.validator');

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

// GET /api/admin/reviews - Admin reviews moderation list
router.get(
    '/reviews',
    validate(getAdminReviewsSchema, 'query'),
    reviewController.getAdminReviews
);

// PATCH /api/admin/reviews/:id/status - Admin hide / show review
router.patch(
    '/reviews/:id/status',
    validate(updateReviewStatusSchema, 'body'),
    reviewController.updateReviewStatus
);

const complaintController = require('../../support/controllers/complaint.controller');
const {
    getAdminComplaintsSchema,
    updateComplaintStatusSchema,
} = require('../../support/validators/complaint.validator');

// GET /api/admin/complaints - Admin complaints moderation list
router.get(
    '/complaints',
    validate(getAdminComplaintsSchema, 'query'),
    complaintController.getAdminComplaints
);

// PATCH /api/admin/complaints/:id/status - Admin resolve / update complaint
router.patch(
    '/complaints/:id/status',
    validate(updateComplaintStatusSchema, 'body'),
    complaintController.updateComplaintStatus
);

module.exports = router;

