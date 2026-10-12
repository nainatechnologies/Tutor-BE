const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');
const validate = require('../../../shared/middlewares/validate.middleware');
const { updateStatusSchema, registerTutorSchema, getRegistrationRequestsSchema } = require('../validators/admin.validator');

// Protect admin routes with JWT
router.use(protect);

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

module.exports = router;

