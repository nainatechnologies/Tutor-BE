const reviewService = require('../services/review.service');

/**
 * Submit a review for a tutor or for the platform
 */
const createReview = async (req, res, next) => {
    try {
        const result = await reviewService.createReview(req.user.id, req.body);
        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: result.review,
            updatedTutorRating: result.updatedTutorRating,
            updatedParentRating: result.updatedParentRating,
            updatedReviewCount: result.updatedReviewCount,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get reviews received by a parent (evaluated by tutors)
 */
const getParentPublicReviews = async (req, res, next) => {
    try {
        const result = await reviewService.getParentPublicReviews(req.params.parentId, req.query);
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get reviews received by the logged in parent
 */
const getParentPortalReviews = async (req, res, next) => {
    try {
        const result = await reviewService.getParentPortalReviews(req.user.id);
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get public reviews and rating stats for a tutor
 */
const getTutorPublicReviews = async (req, res, next) => {
    try {
        const result = await reviewService.getTutorPublicReviews(req.params.tutorId, req.query);
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get reviews received by the logged in tutor
 */
const getTutorPortalReviews = async (req, res, next) => {
    try {
        const result = await reviewService.getTutorPortalReviews(req.user.id);
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Tutor writes a public reply to a review
 */
const replyToReview = async (req, res, next) => {
    try {
        const updated = await reviewService.replyToReview(req.user.id, req.params.id, req.body.reply);
        return res.status(200).json({
            success: true,
            message: 'Reply posted successfully',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get reviews submitted by the logged in user
 */
const getMySubmittedReviews = async (req, res, next) => {
    try {
        const reviews = await reviewService.getMySubmittedReviews(req.user.id);
        return res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Get all reviews with filter and search
 */
const getAdminReviews = async (req, res, next) => {
    try {
        const result = await reviewService.getAdminReviews(req.query);
        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Update review moderation status
 */
const updateReviewStatus = async (req, res, next) => {
    try {
        const updated = await reviewService.updateReviewStatusByAdmin(req.params.id, req.body.status);
        return res.status(200).json({
            success: true,
            message: `Review status updated to ${req.body.status}`,
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Public: Get published testimonials for the landing page
 */
const getTestimonials = async (req, res, next) => {
    try {
        const testimonials = await reviewService.getTestimonials(req.query.limit);
        return res.status(200).json({
            success: true,
            data: testimonials,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createReview,
    getTutorPublicReviews,
    getParentPublicReviews,
    getTutorPortalReviews,
    getParentPortalReviews,
    replyToReview,
    getMySubmittedReviews,
    getAdminReviews,
    updateReviewStatus,
    getTestimonials,
};
