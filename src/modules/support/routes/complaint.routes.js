const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');
const validate = require('../../../shared/middlewares/validate.middleware');
const { createComplaintSchema } = require('../validators/complaint.validator');

// All complaint submission routes require an authenticated session (Parent or Tutor)
router.use(protect);

// POST /api/complaints - Submit a complaint
router.post(
    '/',
    validate(createComplaintSchema, 'body'),
    complaintController.createComplaint
);

// GET /api/complaints/my - View complaints submitted by the logged-in user
router.get(
    '/my',
    complaintController.getMyComplaints
);

module.exports = router;
