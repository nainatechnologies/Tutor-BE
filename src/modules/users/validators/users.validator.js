const { z } = require('zod');

// Schema for adding/updating a child
const childSchema = z.object({
    name: z.string().min(2, "Child name must be at least 2 characters long"),
    grade: z.string().min(1, "Grade is required"),
    preferredSchedule: z.string().min(1, "Preferred schedule is required"),
    learningGoals: z.string().nullable().optional(),
    preferredMode: z.string().nullable().optional(),
    dateOfBirth: z.string().nullable().optional(), // Expected format YYYY-MM-DD
    gender: z.string().nullable().optional(),
    schoolName: z.string().nullable().optional(),
    medicalInformation: z.string().nullable().optional(),
    emergencyContactName: z.string().nullable().optional(),
    emergencyContactPhone: z.string().regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits").nullable().optional().or(z.literal('')),
    relationship: z.string().nullable().optional(),
    subjectIds: z.array(z.string()).optional(),
    subjects: z.array(z.string()).optional(),
}).refine(data => (Array.isArray(data.subjectIds) && data.subjectIds.length > 0) || (Array.isArray(data.subjects) && data.subjects.length > 0), {
    message: "At least one subject or service is required for the child",
    path: ["subjects"]
});

// Schema for updating parent profile
const updateParentProfileSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters long").optional().or(z.literal('')),
    city: z.string().min(2, "City is required").optional().or(z.literal('')),
    pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits").optional().or(z.literal('')),
    street: z.string().optional().or(z.literal('')),
    district: z.string().optional().or(z.literal('')),
    village: z.string().optional().or(z.literal('')),
    mandal: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    landmark: z.string().optional().or(z.literal('')),
    children: z.array(childSchema).max(2, "A parent can register a maximum of 2 children").optional(),
}).passthrough();

// Schema for tutor analytics query params
const analyticsQuerySchema = z.object({
    timeRange: z.enum(['7d', '30d', '3m', '12m']).optional().default('30d'),
});

module.exports = {
    updateParentProfileSchema,
    childSchema,
    analyticsQuerySchema,
};
