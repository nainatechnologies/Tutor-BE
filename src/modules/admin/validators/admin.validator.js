const { z } = require('zod');

const updateStatusSchema = z.object({
    status: z.enum(['Accepted', 'Rejected', 'Under Review', 'approved', 'rejected', 'pending']),
    rejectionReason: z.string().optional(),
});

const registerTutorSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Valid phone number is required'),
    password: z.string().optional(),
    professionalType: z.enum(['Teacher', 'Therapist', 'Tutor']).optional(),
    tutorType: z.enum(['In-house', 'Outsourced']).optional(),
    city: z.string().optional(),
    pincode: z.string().optional(),
    location: z.string().optional(),
    address: z.string().optional(),
    qualification: z.string().optional(),
    experience: z.union([z.string(), z.number()]).optional(),
    specialization: z.string().optional(),
    rciNumber: z.string().optional(),
    rciValidityDate: z.string().optional(),
    subjects: z.array(z.string()).optional(),
});

const getRegistrationRequestsSchema = z.object({
    page: z.preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 1), z.number().int().min(1).default(1)),
    limit: z.preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 10), z.number().int().min(1).max(100).default(10)),
    status: z.enum(['all', 'new', 'pending', 'accepted', 'rejected']).optional(),
    search: z.string().optional(),
});

const getAdminLeadsSchema = z.object({
    page: z.preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 1), z.number().int().min(1).default(1)),
    limit: z.preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 10), z.number().int().min(1).max(100).default(10)),
    status: z.string().optional(),
    search: z.string().optional(),
});

const getAdminPaymentsSchema = z.object({
    page: z.preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 1), z.number().int().min(1).default(1)),
    limit: z.preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 15), z.number().int().min(1).max(100).default(15)),
    status: z.string().optional(),
    search: z.string().optional(),
});

const getParentRegistrationsSchema = z.object({
    page: z.preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 1), z.number().int().min(1).default(1)),
    limit: z.preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 10), z.number().int().min(1).max(100).default(10)),
    search: z.string().optional(),
});

const getAdminAppointmentsSchema = z.object({
    page: z.preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 1), z.number().int().min(1).default(1)),
    limit: z.preprocess((val) => (val !== undefined && val !== '' ? parseInt(String(val), 10) : 10), z.number().int().min(1).max(100).default(10)),
    status: z.string().optional(),
    mode: z.string().optional(),
    search: z.string().optional(),
});

const updateAdminAppointmentSchema = z.object({
    status: z.string().optional(),
    meetingLink: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    scheduledDate: z.string().optional().nullable(),
});

module.exports = {
    updateStatusSchema,
    registerTutorSchema,
    getRegistrationRequestsSchema,
    getAdminLeadsSchema,
    getAdminPaymentsSchema,
    getParentRegistrationsSchema,
    getAdminAppointmentsSchema,
    updateAdminAppointmentSchema,
};


