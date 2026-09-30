const { z } = require('zod');

// Schema for User Registration
const registerSchema = z.object({
    role: z.enum(['PARENT', 'TUTOR'], { 
        errorMap: () => ({ message: "Role must be either 'PARENT' or 'TUTOR'" }) 
    }),
    email: z.string().email("Invalid email format"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    name: z.string().min(2, "Name must be at least 2 characters long"),
    city: z.string().min(2, "City is required"),
    pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits"),
    
    // Parent specific (optional but recommended)
    street: z.string().optional(),
    district: z.string().optional(),
    
    // Tutor specific
    aadharNumber: z.string().regex(/^[0-9]{12}$/, "Aadhar must be exactly 12 digits").optional(),
    
    // Subjects array for the Junction Table
    subjectIds: z.array(z.string().uuid("Invalid subject ID")).optional()
}).refine(data => {
    // If role is TUTOR, aadharNumber is required
    if (data.role === 'TUTOR') return !!data.aadharNumber;
    return true;
}, {
    message: "Aadhar number is required for Tutors",
    path: ["aadharNumber"]
});

// Schema for User Login
const loginSchema = z.object({
    identifier: z.string().min(1, "Email or phone is required"),
    password: z.string().min(1, "Password is required")
});

module.exports = {
    registerSchema,
    loginSchema
};
