/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User registration, authentication, phone OTP verification, password reset, and session control.
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new Parent or Tutor account
 *     description: |
 *       **Purpose:** Creates a new user in the platform. Supports registering as either a `PARENT` or `TUTOR`.
 *       If registering as a Tutor, an automated onboarding profile and approval request is initialized.
 *       **Access Level:** 🌐 Public (No authentication required).
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dr. Sarah Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "tutor1@gmail.com"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password@123"
 *               role:
 *                 type: string
 *                 enum: [PARENT, TUTOR]
 *                 example: "TUTOR"
 *     responses:
 *       201:
 *         description: User registered successfully. Returns authentication token and basic profile.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Registration successful"
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   id: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                   name: "Dr. Sarah Smith"
 *                   email: "tutor1@gmail.com"
 *                   role: "TUTOR"
 *       400:
 *         description: Validation failure or account already exists with given email/phone.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "User with this email already exists"
 *       429:
 *         description: Rate limit exceeded (Max 20 requests per 15 minutes).
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user & retrieve JWT token
 *     description: |
 *       **Purpose:** Authenticates user using email or phone and password. Generates a secure JWT token valid for 7 days.
 *       **Access Level:** 🌐 Public.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: User email or phone number.
 *                 example: "tutor1@gmail.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password@123"
 *     responses:
 *       200:
 *         description: Login successful. Returns 7-day JWT access token and user role.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Login successful"
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   id: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                   name: "Dr. Sarah Smith"
 *                   email: "tutor1@gmail.com"
 *                   role: "TUTOR"
 *                   status: "ACTIVE"
 *       401:
 *         description: Invalid credentials or inactive account.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid email/phone or password"
 */

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to phone for registration or password reset
 *     description: |
 *       **Purpose:** Generates a 6-digit one-time password and delivers it via the configured SMS gateway (SPEAR UC).
 *       **Access Level:** 🌐 Public.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - action
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               action:
 *                 type: string
 *                 enum: [REGISTRATION, RESET_PASSWORD]
 *                 example: "REGISTRATION"
 *     responses:
 *       200:
 *         description: OTP dispatched successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "OTP sent successfully to 9876543210"
 *       400:
 *         description: Phone already exists (on REGISTRATION) or phone not found (on RESET_PASSWORD).
 *       429:
 *         description: Rate limit exceeded (Max 5 OTP requests per hour per IP).
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset account password using verified OTP
 *     description: |
 *       **Purpose:** Updates user password after successfully verifying the OTP sent to their phone number.
 *       **Access Level:** 🌐 Public.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *               - newPassword
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewPassword@2026"
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Password reset successful. Please login with your new credentials."
 *       400:
 *         description: Invalid or expired OTP.
 */

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password for active authenticated session
 *     description: |
 *       **Purpose:** Allows logged-in users (Parents, Tutors, Admins) to update their account password by providing their current password.
 *       **Access Level:** 🔒 Authenticated Session (Any Role).
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: "Password@123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "UpdatedSecret@2026"
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Current password is incorrect or new password does not meet complexity rules.
 *       401:
 *         description: Unauthorized (Token missing or expired).
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: End authenticated session
 *     description: |
 *       **Purpose:** Safely logs out the user and signals the client to discard the JWT token.
 *       **Access Level:** 🌐 Optional Auth (Idempotent).
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successfully logged out.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Logged out successfully"
 */
