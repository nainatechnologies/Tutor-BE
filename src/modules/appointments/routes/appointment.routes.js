const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');
const validate = require('../../../shared/middlewares/validate.middleware');
const {
    createAppointmentSchema,
    updateAppointmentStatusSchema,
    getAppointmentsSchema,
} = require('../validators/appointment.validator');

// All appointment routes require authentication
router.use(protect);

// GET /api/appointments - Get appointments for current user (Parent or Tutor)
router.get(
    '/',
    validate(getAppointmentsSchema, 'query'),
    appointmentController.getMyAppointments
);

// POST /api/appointments - Book a new appointment
router.post(
    '/',
    validate(createAppointmentSchema, 'body'),
    appointmentController.createAppointment
);

// GET /api/appointments/:id - Get single appointment details
router.get('/:id', appointmentController.getAppointmentById);

// PATCH /api/appointments/:id/status - Update appointment status / schedule
router.patch(
    '/:id/status',
    validate(updateAppointmentStatusSchema, 'body'),
    appointmentController.updateAppointmentStatus
);

module.exports = router;
