/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (Parent or Tutor)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterPayload'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user exists
 *
 * /api/auth/login:
 *   post:
 *     summary: Login for Parents and Tutors
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginPayload'
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       401:
 *         description: Invalid credentials
 *
 * /api/auth/send-otp:
 *   post:
 *     summary: Send an OTP to a phone number
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendOtpPayload'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid action or phone already exists
 *
 * /api/auth/verify-otp:
 *   post:
 *     summary: Pre-verify an OTP code (does not consume it)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpPayload'
 *     responses:
 *       200:
 *         description: OTP is valid
 *       400:
 *         description: Invalid or expired OTP
 *
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordPayload'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: User not found
 *
 * /api/master/categories:
 *   get:
 *     summary: Get all active categories and their subjects
 *     tags: [Master]
 *     responses:
 *       200:
 *         description: Success
 *
 * /api/users/profile:
 *   get:
 *     summary: Get logged-in user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update user profile details (Universal)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Can contain any profile fields to update
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *
 * /api/users/profile/parent:
 *   put:
 *     summary: Update parent profile details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateParentProfilePayload'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *
 * /api/users/children:
 *   post:
 *     summary: Add a new child to a parent profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChildPayload'
 *     responses:
 *       201:
 *         description: Child added successfully
 *
 * /api/users/children/{childId}:
 *   put:
 *     summary: Update a child profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChildPayload'
 *     responses:
 *       200:
 *         description: Child updated successfully
 *
 * /api/users/children/{childId}/delete:
 *   delete:
 *     summary: Delete a child profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Child deleted successfully
 *
 *
 * /api/users/upload:
 *   post:
 *     summary: Upload a file (image/pdf) directly to Cloudinary
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *
 * /api/payments/create-order:
 *   post:
 *     summary: Create a Razorpay payment order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order created successfully
 *
 * /api/payments/verify:
 *   post:
 *     summary: Verify Razorpay payment signature
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *
 * /api/connections:
 *   get:
 *     summary: Get my connections (Tutors or Clients)
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connections retrieved successfully
 *
 *   post:
 *     summary: Manage a connection (Request new / Update existing)
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               connectionId:
 *                 type: string
 *                 description: Provide if responding to an existing request
 *               tutorId:
 *                 type: string
 *                 description: Provide if creating a new request
 *               message:
 *                 type: string
 *                 description: Optional message when requesting
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACCEPTED, REJECTED]
 *                 description: Required when responding to a request
 *     responses:
 *       200:
 *         description: Connection updated successfully
 *       201:
 *         description: Connection requested successfully
 */
