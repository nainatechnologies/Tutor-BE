const { z } = require('zod');

// Schema for adding/updating a child
const childSchema = z.object({
    name: z.string().min(2, "Child name must be at least 2 characters long"),
    grade: z.string().nullable().optional().or(z.literal('')).transform(val => val && val.trim() ? val.trim() : null),
    preferredSchedule: z.string().min(1, "Preferred schedule is required"),
    learningGoals: z.string().nullable().optional(),
    preferredMode: z.string().nullable().optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD").nullable().optional().or(z.literal('')),
    gender: z.enum(['Male', 'Female', 'Other', 'male', 'female', 'other'], {
        errorMap: () => ({ message: "Gender must be 'Male', 'Female', or 'Other'" })
    }).nullable().optional().or(z.literal('')).transform(val => val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : null),
    preferredTutorGender: z.enum(['Any', 'Female', 'Male', 'any', 'female', 'male', ''], {
        errorMap: () => ({ message: "Preferred educator gender must be 'Any', 'Female', or 'Male'" })
    }).nullable().optional().or(z.literal('')).transform(val => val && val.trim() ? (val.trim().toLowerCase() === 'any' ? 'Any' : val.trim().charAt(0).toUpperCase() + val.trim().slice(1).toLowerCase()) : 'Any'),
    schoolName: z.string().nullable().optional(),
    medicalInformation: z.string().max(1500, "Medical notes must not exceed 1500 characters").nullable().optional().or(z.literal('')),
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
