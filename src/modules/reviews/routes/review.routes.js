const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');
const validate = require('../../../shared/middlewares/validate.middleware');
const {
    createReviewSchema,
    replyReviewSchema,
    getTutorReviewsSchema,
} = require('../validators/review.validator');

// Public route: View published reviews & rating distribution for a tutor
router.get(
    '/tutors/:tutorId',
    validate(getTutorReviewsSchema, 'query'),
    reviewController.getTutorPublicReviews
);

// Public route: View published testimonials for the landing page
router.get(
    '/testimonials',
    reviewController.getTestimonials
);

// All other endpoints require authenticated session
router.use(protect);

// POST /api/reviews - Submit review for a tutor or for the platform
router.post(
    '/',
    validate(createReviewSchema, 'body'),
    reviewController.createReview
);

// GET /api/reviews/my-reviews - Reviews submitted by the logged-in parent
router.get(
    '/my-reviews',
    reviewController.getMySubmittedReviews
);

// GET /api/reviews/tutor/my-feedback - Reviews received by the logged-in tutor
router.get(
    '/tutor/my-feedback',
    reviewController.getTutorPortalReviews
);

// GET /api/reviews/parent/my-feedback - Reviews received by the logged-in parent
router.get(
    '/parent/my-feedback',
    reviewController.getParentPortalReviews
);

// GET /api/reviews/parents/:parentId - Reviews received by a specific parent
router.get(
    '/parents/:parentId',
    reviewController.getParentPublicReviews
);

// POST /api/reviews/:id/reply - Tutor or Parent replies to a received review
router.post(
    '/:id/reply',
    validate(replyReviewSchema, 'body'),
    reviewController.replyToReview
);

module.exports = router;
