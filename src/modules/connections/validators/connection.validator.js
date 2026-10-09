const { z } = require('zod');

const connectionRequestSchema = z.object({
    tutorId: z.string().uuid("Invalid tutor ID"),
    message: z.string().max(500, "Message is too long").optional(),
});

const updateConnectionSchema = z.object({
    status: z.enum(['ACCEPTED', 'REJECTED']),
});

module.exports = {
    connectionRequestSchema,
    updateConnectionSchema,
};
