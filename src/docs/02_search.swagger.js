/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Public tutor marketplace search, location/pincode filtering, category/subject matching, and profile discovery.
 */

/**
 * @swagger
 * /api/search/tutors:
 *   get:
 *     summary: Search & filter approved tutors in marketplace
 *     description: |
 *       **Purpose:** Searches tutors based on location, pincode, subject, category, teaching mode, and budget.
 *       Basic profile cards are public for SEO, while contact details (email/phone) are masked until a connection is unlocked.
 *       **Access Level:** 🌐 Public (Accessible to parents, guests, and authenticated users).
 *     tags: [Search]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keyword search matching tutor name, headline, bio, or location.
 *         example: "Mathematics"
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: City or location name.
 *         example: "Khammam"
 *       - in: query
 *         name: pincode
 *         schema:
 *           type: string
 *         description: 6-digit postal code.
 *         example: "507122"
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by master category UUID.
 *         example: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *         description: Filter by master subject UUID.
 *         example: "2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e"
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [ONLINE, OFFLINE, BOTH]
 *         description: Preferred teaching delivery mode.
 *         example: "BOTH"
 *       - in: query
 *         name: minFee
 *         schema:
 *           type: number
 *         description: Minimum hourly fee in INR.
 *         example: 300
 *       - in: query
 *         name: maxFee
 *         schema:
 *           type: number
 *         description: Maximum hourly fee in INR.
 *         example: 1500
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Pagination page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tutors per page.
 *     responses:
 *       200:
 *         description: Filtered list of verified tutors matching criteria.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 tutors:
 *                   - id: "e1b2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e"
 *                     name: "Dr. Sarah Smith"
 *                     headline: "Senior Mathematics Specialist (10+ Years Experience)"
 *                     avatarUrl: "https://res.cloudinary.com/tegm6tdw/image/upload/v1/avatar.jpg"
 *                     city: "Khammam"
 *                     pincode: "507122"
 *                     hourlyRate: 600
 *                     teachingMode: "BOTH"
 *                     rating: 4.9
 *                     reviewCount: 28
 *                     subjects: ["Mathematics", "Physics"]
 *                     isVerified: true
 *                 pagination:
 *                   total: 1
 *                   page: 1
 *                   limit: 10
 *                   totalPages: 1
 *       400:
 *         description: Invalid query parameters (e.g., non-numeric pincode or invalid UUID).
 */

/**
 * @swagger
 * /api/search/tutors/{id}:
 *   get:
 *     summary: Retrieve detailed public profile of a specific tutor
 *     description: |
 *       **Purpose:** Returns comprehensive professional details of a tutor including educational qualifications,
 *       subjects taught, bio, hourly rate, and teaching mode. Contact information remains protected.
 *       **Access Level:** 🌐 Public.
 *     tags: [Search]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tutor User UUID or Profile UUID.
 *         example: "e1b2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e"
 *     responses:
 *       200:
 *         description: Detailed tutor profile retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: "e1b2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e"
 *                 name: "Dr. Sarah Smith"
 *                 headline: "Senior Mathematics Specialist"
 *                 bio: "Experienced tutor specializing in high school and competitive entrance exam preparation."
 *                 experienceYears: 10
 *                 city: "Khammam"
 *                 pincode: "507122"
 *                 location: "Khammam, Telangana, 507122"
 *                 hourlyRate: 600
 *                 teachingMode: "BOTH"
 *                 rating: 4.9
 *                 reviewCount: 28
 *                 subjects: ["Calculus", "Algebra", "Geometry"]
 *                 qualifications: "M.Sc Mathematics, B.Ed"
 *                 isVerified: true
 *       404:
 *         description: Tutor not found or account is pending verification.
 */
