const { z } = require('zod');

const searchTutorsQuerySchema = z.object({
    city: z.string().trim().optional(),
    pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits").optional().or(z.literal('')),
    subjectId: z.string().uuid("Invalid subject ID").optional().or(z.literal('')),
    tutorType: z.string().trim().optional(),
    professionalType: z.string().trim().optional(),
    maxFee: z.coerce.number().positive("Max fee must be a positive number").optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
});

const tutorIdParamSchema = z.object({
    id: z.string().uuid("Invalid tutor ID"),
});

module.exports = {
    searchTutorsQuerySchema,
    tutorIdParamSchema,
};
