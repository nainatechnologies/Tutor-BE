const { z } = require('zod');

// Schema for User Registration
const registerSchema = z.object({
    role: z.enum(['PARENT', 'TUTOR'], { 
        errorMap: () => ({ message: "Role must be either 'PARENT' or 'TUTOR'" }) 
    }),
    email: z.string().email("Invalid email format"),
    phone: z.string().regex(/^[6-9][0-9]{9}$/, "Phone number must be a valid 10-digit mobile number"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    name: z.string().min(2, "Name must be at least 2 characters long"),
    city: z.string().optional(),
    pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits").optional(),
    
    // Parent specific (optional but recommended)
    street: z.string().optional(),
    district: z.string().optional(),
    childName: z.string().optional(),
    childGrade: z.string().optional(),
    goal: z.string().optional(),
    mode: z.string().optional(),
    availableTime: z.string().optional(),
    
    // Tutor specific
    aadharNumber: z.string().regex(/^[0-9]{12}$/, "Aadhar must be exactly 12 digits").optional(),
    
    // Subjects array for the Junction Table
    subjectIds: z.array(z.string().uuid("Invalid subject ID")).optional(),

    // OTP Code
    otp: z.string().length(6, "OTP must be exactly 6 digits")
});

const loginSchema = z.object({
    identifier: z.string().min(1, "Email or phone is required"),
    password: z.string().min(1, "Password is required")
});

const sendOtpSchema = z.object({
    phone: z.string().regex(/^[6-9][0-9]{9}$/, "Phone must be a valid 10-digit mobile number"),
    email: z.string().email().optional(),
    action: z.enum(['REGISTER', 'RESET_PASSWORD'])
});



const resetPasswordSchema = z.object({
    phone: z.string().regex(/^[6-9][0-9]{9}$/, "Phone must be a valid 10-digit mobile number"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters long")
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters long")
}).refine(data => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"]
});

module.exports = {
    registerSchema,
    loginSchema,
    sendOtpSchema,
    resetPasswordSchema,
    changePasswordSchema
};
