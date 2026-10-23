const { z } = require('zod');

const connectionRequestSchema = z.object({
    tutorId: z.string().uuid("Invalid tutor ID"),
    message: z.string().max(3000, "Message is too long").optional(),
});

const updateConnectionSchema = z.object({
    connectionId: z.string().uuid("Invalid connection ID"),
    status: z.enum(['ACCEPTED', 'REJECTED'], {
        errorMap: () => ({ message: "Status must be either ACCEPTED or REJECTED" }),
    }),
});

const manageConnectionSchema = z.union([
    connectionRequestSchema,
    updateConnectionSchema,
]);

module.exports = {
    connectionRequestSchema,
    updateConnectionSchema,
    manageConnectionSchema,
};
