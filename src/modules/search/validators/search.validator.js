const { z } = require('zod');

const searchTutorsQuerySchema = z.object({
    q: z.string().trim().optional(),
    query: z.string().trim().optional(),
    city: z.string().trim().optional(),
    pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits").optional().or(z.literal('')),
    subjectId: z.string().trim().optional().or(z.literal('')),
    childId: z.string().trim().optional().or(z.literal('all')).or(z.literal('')),
    parentId: z.string().trim().optional(),
    childIds: z.string().trim().optional(),
    explore: z.string().trim().optional(),
    tutorType: z.string().trim().optional(),
    professionalType: z.string().trim().optional(),
    gender: z.string().trim().optional(),
    minFee: z.coerce.number().min(0).optional(),
    maxFee: z.coerce.number().positive("Max fee must be a positive number").optional(),
    minSessionFee: z.coerce.number().min(0).optional(),
    maxSessionFee: z.coerce.number().positive("Max session fee must be a positive number").optional(),
    minMonthlyFee: z.coerce.number().min(0).optional(),
    maxMonthlyFee: z.coerce.number().positive("Max monthly fee must be a positive number").optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    minExperience: z.coerce.number().min(0).optional(),
    teachingMode: z.string().trim().optional(),
    sortBy: z.enum(['relevance', 'rating_desc', 'fee_asc', 'fee_desc', 'experience_desc', 'newest']).optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(12).optional(),
});

const tutorIdParamSchema = z.object({
    id: z.string().uuid("Invalid tutor ID"),
});

module.exports = {
    searchTutorsQuerySchema,
    tutorIdParamSchema,
};
