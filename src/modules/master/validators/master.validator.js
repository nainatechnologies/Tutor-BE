const { z } = require('zod');

const categoryTypeSchema = z.enum(['ACADEMIC', 'SERVICE']);

const categoryIdParamsSchema = z.object({
    categoryId: z.string().uuid(),
});

const subjectIdParamsSchema = z.object({
    subjectId: z.string().uuid(),
});

const createCategorySchema = z.object({
    name: z.string().trim().min(2).max(100),
    type: categoryTypeSchema,
});

const updateCategorySchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    type: categoryTypeSchema.optional(),
    isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one category field to update',
});

const createSubjectSchema = z.object({
    name: z.string().trim().min(2).max(150),
});

const updateSubjectSchema = z.object({
    name: z.string().trim().min(2).max(150).optional(),
    categoryId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one subject field to update',
});

module.exports = {
    categoryIdParamsSchema,
    subjectIdParamsSchema,
    createCategorySchema,
    updateCategorySchema,
    createSubjectSchema,
    updateSubjectSchema,
};