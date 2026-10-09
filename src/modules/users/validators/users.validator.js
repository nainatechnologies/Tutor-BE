const { z } = require('zod');

// Schema for updating parent profile
const updateParentProfileSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters long").optional(),
    city: z.string().min(2, "City is required").optional(),
    pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits").optional(),
    street: z.string().optional(),
    district: z.string().optional(),
    village: z.string().optional(),
    mandal: z.string().optional(),
    state: z.string().optional(),
    landmark: z.string().optional(),
}).passthrough();

// Schema for adding/updating a child
const childSchema = z.object({
    name: z.string().min(2, "Child name is required"),
    grade: z.string().min(1, "Grade is required"),
    learningGoals: z.string().nullable().optional(),
    preferredMode: z.string().nullable().optional(),
    preferredSchedule: z.string().nullable().optional(),
    dateOfBirth: z.string().nullable().optional(), // Expected format YYYY-MM-DD
    gender: z.string().nullable().optional(),
    schoolName: z.string().nullable().optional(),
    medicalInformation: z.string().nullable().optional(),
    emergencyContactName: z.string().nullable().optional(),
    emergencyContactPhone: z.string().regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits").nullable().optional().or(z.literal('')),
    relationship: z.string().nullable().optional(),
    subjectIds: z.array(z.string().uuid("Invalid subject ID")).nullable().optional()
});

module.exports = {
    updateParentProfileSchema,
    childSchema
};
