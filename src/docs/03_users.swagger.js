/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Universal profile management, parent & child sub-profiles, tutor analytics, and Cloudinary media upload.
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Retrieve currently authenticated user profile
 *     description: |
 *       **Purpose:** Returns profile details of the logged-in user. If PARENT, returns parent details and registered children.
 *       If TUTOR, returns professional bio, hourly rate, pincode, and subjects.
 *       **Access Level:** 🔒 Authenticated Session (PARENT, TUTOR, or ADMIN).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                 name: "Pranay Salvadhi"
 *                 email: "pranaysalvadhi@gmail.com"
 *                 phone: "9876543210"
 *                 role: "PARENT"
 *                 parentProfile:
 *                   id: "7b1a2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d"
 *                   city: "Khammam"
 *                   pincode: "507122"
 *                   address: "Gandhi Nagar, Khammam"
 *                   children:
 *                     - id: "c1b2a3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
 *                       name: "Aarav"
 *                       grade: "Grade 8"
 *                       school: "Delhi Public School"
 *       401:
 *         description: Missing or invalid authentication token.
 *
 *   put:
 *     summary: Update profile details (Universal for Parent or Tutor)
 *     description: |
 *       **Purpose:** Updates personal information, location, pincode, city, bio, and associated child profiles.
 *       **Access Level:** 🔒 Authenticated Session (PARENT or TUTOR).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dr. Sarah Smith"
 *               city:
 *                 type: string
 *                 example: "Khammam"
 *               pincode:
 *                 type: string
 *                 example: "507122"
 *               location:
 *                 type: string
 *                 example: "Khammam, Telangana, 507122"
 *               headline:
 *                 type: string
 *                 example: "Special Educator & Senior Math Tutor"
 *               bio:
 *                 type: string
 *                 example: "Experienced educator with 10+ years specializing in personalized learning."
 *               hourlyRate:
 *                 type: number
 *                 example: 600
 *               teachingMode:
 *                 type: string
 *                 enum: [ONLINE, OFFLINE, BOTH]
 *                 example: "BOTH"
 *               children:
 *                 type: array
 *                 description: Array of children objects (for Parents).
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Aarav"
 *                     grade:
 *                       type: string
 *                       example: "Grade 8"
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Profile updated successfully"
 *       400:
 *         description: Validation error.
 */

/**
 * @swagger
 * /api/users/upload:
 *   post:
 *     summary: Upload file (avatar, certificate, ID proof) to Cloudinary
 *     description: |
 *       **Purpose:** Uploads multipart binary file to Cloudinary cloud storage under folder `tutor_platform_media`
 *       and returns the permanent HTTPS secure URL.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image (JPG, PNG) or Document (PDF) up to 10MB.
 *     responses:
 *       200:
 *         description: File uploaded successfully. Returns Cloudinary URL.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "File uploaded successfully"
 *               data:
 *                 url: "https://res.cloudinary.com/tegm6tdw/image/upload/v1792749000/tutor_platform_media/avatar_123.jpg"
 *       400:
 *         description: Missing file or unsupported file format.
 */

/**
 * @swagger
 * /api/users/tutor/analytics:
 *   get:
 *     summary: Get tutor portal dashboard metrics & analytics
 *     description: |
 *       **Purpose:** Returns high-level metrics for the logged-in tutor: total profile views, active leads,
 *       completed appointments, and average rating.
 *       **Access Level:** 🎓 TUTOR ONLY.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: "30d"
 *         description: Time period for analytics aggregation.
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 totalViews: 342
 *                 totalLeads: 28
 *                 totalAppointments: 19
 *                 averageRating: 4.9
 *                 completionRate: "95%"
 *       403:
 *         description: Forbidden (Requires TUTOR role).
 */
