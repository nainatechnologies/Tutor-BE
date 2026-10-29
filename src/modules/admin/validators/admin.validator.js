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
    rciNumber: z.string().max(20).optional(),
    rciValidityDate: z.string().optional(),
    subjects: z.array(z.string()).optional(),
    perSessionFee: z.union([z.string(), z.number()]).optional(),
    sessionFee: z.union([z.string(), z.number()]).optional(),
    teachingModes: z.array(z.string()).optional(),
    mode: z.string().optional(),
    availability: z.any().optional(),
    avatarUrl: z.string().optional(),
    aadharNumber: z.string().optional(),
    aadharDocUrl: z.string().optional(),
    qualCertUrl: z.string().optional(),
    rciCertUrl: z.string().optional(),
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



const updateAdminProfileSchema = z.object({
    businessName: z.string().min(1, 'Business name cannot be empty').optional(),
    registrationNo: z.string().min(1, 'Registration number cannot be empty').optional(),
    address: z.string().min(1, 'Business address cannot be empty').optional(),
    businessDescription: z.string().min(1, 'Business description cannot be empty').optional(),
    name: z.string().min(1, 'Admin name cannot be empty').optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9').optional(),
});

module.exports = {
    updateStatusSchema,
    registerTutorSchema,
    getRegistrationRequestsSchema,
    getAdminLeadsSchema,
    getAdminPaymentsSchema,
    getParentRegistrationsSchema,
    updateAdminProfileSchema,
};


