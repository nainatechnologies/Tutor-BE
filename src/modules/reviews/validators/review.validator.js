const { z } = require('zod');
const { REVIEW_TARGET_TYPE, REVIEW_STATUS } = require('../../../shared/constants/reviewConstants');

const createReviewSchema = z.object({
    targetType: z.enum(Object.values(REVIEW_TARGET_TYPE)),
    tutorId: z.string().uuid('Invalid tutor ID').optional().nullable(),
    parentId: z.string().uuid('Invalid parent ID').optional().nullable(),
    subject: z.string().max(100, 'Subject name too long').optional().nullable(),
    rating: z.coerce.number().int().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
    comment: z.string().max(3000, 'Comment too long').optional().nullable(),
});

const replyReviewSchema = z.object({
    reply: z.string().min(1, 'Reply cannot be empty').max(3000, 'Reply too long'),
});

const getTutorReviewsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

const getAdminReviewsSchema = z.object({
    targetType: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

const updateReviewStatusSchema = z.object({
    status: z.enum(Object.values(REVIEW_STATUS)),
});

module.exports = {
    createReviewSchema,
    replyReviewSchema,
    getTutorReviewsSchema,
    getAdminReviewsSchema,
    updateReviewStatusSchema,
};
