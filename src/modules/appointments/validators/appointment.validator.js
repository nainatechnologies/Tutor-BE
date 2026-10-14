const { z } = require('zod');

const createAppointmentSchema = z.object({
    tutorId: z.string().uuid('Invalid tutor ID'),
    childId: z.string().uuid('Invalid child ID').optional().nullable(),
    subjectId: z.string().uuid('Invalid subject ID').optional().nullable(),
    scheduledDate: z.string().min(1, 'Scheduled date and time is required'),
    durationMinutes: z.coerce.number().int().min(15).max(360).default(60),
    mode: z.enum(['ONLINE', 'OFFLINE']).default('ONLINE'),
    meetingLink: z.string().url('Invalid meeting link').optional().nullable(),
    notes: z.string().max(2000, 'Notes too long').optional().nullable(),
});

const updateAppointmentStatusSchema = z.object({
    status: z.enum(['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
    scheduledDate: z.string().optional().nullable(),
    durationMinutes: z.coerce.number().int().optional().nullable(),
    meetingLink: z.string().optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
});

const getAppointmentsSchema = z.object({
    status: z.enum(['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
    mode: z.enum(['ONLINE', 'OFFLINE']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const getAdminAppointmentsSchema = z.object({
    status: z.string().optional(),
    mode: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

module.exports = {
    createAppointmentSchema,
    updateAppointmentStatusSchema,
    getAppointmentsSchema,
    getAdminAppointmentsSchema,
};
