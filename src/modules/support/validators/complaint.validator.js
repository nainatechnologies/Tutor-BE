const { z } = require('zod');
const { COMPLAINT_STATUS, COMPLAINT_CATEGORY, COMPLAINT_PRIORITY } = require('../constants/complaint.constants');

const createComplaintSchema = z.object({
    category: z.enum(Object.values(COMPLAINT_CATEGORY), {
        errorMap: () => ({ message: 'Invalid category. Must be one of: ' + Object.values(COMPLAINT_CATEGORY).join(', ') })
    }),
    subject: z.string().min(3, 'Subject must be at least 3 characters').max(150, 'Subject cannot exceed 150 characters'),
    description: z.string().min(10, 'Detailed description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters'),
    reportedId: z.string().uuid('Invalid user ID').optional().nullable(),
    priority: z.enum(Object.values(COMPLAINT_PRIORITY)).optional().default(COMPLAINT_PRIORITY.MEDIUM),
});

const updateComplaintStatusSchema = z.object({
    status: z.enum(Object.values(COMPLAINT_STATUS), {
        errorMap: () => ({ message: 'Invalid status. Must be one of: ' + Object.values(COMPLAINT_STATUS).join(', ') })
    }),
    resolutionNotes: z.string().max(1000, 'Resolution notes cannot exceed 1000 characters').optional().nullable(),
});

const getAdminComplaintsSchema = z.object({
    status: z.string().optional().default('ALL'),
    userType: z.enum(['ALL', 'PARENT', 'TUTOR', 'parent', 'tutor']).optional().default('ALL'),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

module.exports = {
    createComplaintSchema,
    updateComplaintStatusSchema,
    getAdminComplaintsSchema
};
