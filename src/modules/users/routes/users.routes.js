const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');
const { updateParentProfileSchema, childSchema } = require('../validators/users.validator');

const validate = require('../../../shared/middlewares/validate.middleware');
const { protect } = require('../../../shared/middlewares/auth.middleware');
const { requireRole } = require('../../../shared/middlewares/role.middleware');
const upload = require('../../../shared/middlewares/upload.middleware');

// All profile routes require authentication
router.use(protect);

// Get my profile (Works for both PARENT and TUTOR)
router.get('/profile', usersController.getProfile);

// Update profile (Handles Parent + Children sync, or Tutor)
router.put(
    '/profile',
    validate(updateParentProfileSchema), // We can reuse this or rename it later
    usersController.updateProfile
);

// Upload files (Dedicated endpoint for Cloudinary)
router.post(
    '/upload',
    upload.single('file'),
    usersController.uploadFile
);

module.exports = router;
