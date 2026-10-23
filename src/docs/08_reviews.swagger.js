/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: 1-5 Star ratings, written testimonials, tutor replies, and public reviews moderation.
 */

/**
 * @swagger
 * /api/reviews/tutors/{tutorId}:
 *   get:
 *     summary: Get public reviews & ratings distribution for a tutor
 *     description: |
 *       **Purpose:** Returns all approved and published reviews for a tutor, including individual ratings,
 *       written feedback, subjects, and tutor public replies.
 *       **Access Level:** 🌐 Public.
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         schema:
 *           type: string
 *         example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *     responses:
 *       200:
 *         description: Reviews list and rating distribution.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 averageRating: 4.9
 *                 totalReviews: 28
 *                 distribution:
 *                   5: 25
 *                   4: 3
 *                   3: 0
 *                   2: 0
 *                   1: 0
 *                 reviews:
 *                   - id: "r1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
 *                     rating: 5
 *                     comment: "Dr. Smith explained complex calculus concepts with exceptional clarity."
 *                     subject: "Mathematics"
 *                     reviewerName: "Pranay S."
 *                     tutorReply: "Thank you Pranay! Aarav made remarkable progress this month."
 *                     tutorRepliedAt: "2026-10-22T12:00:00Z"
 *                     createdAt: "2026-10-21T09:30:00Z"
 */

/**
 * @swagger
 * /api/reviews/testimonials:
 *   get:
 *     summary: Get featured platform testimonials for landing page
 *     description: |
 *       **Purpose:** Returns highest-rated platform testimonials to showcase on public marketing pages.
 *       **Access Level:** 🌐 Public.
 *     tags: [Reviews]
 *     security: []
 *     responses:
 *       200:
 *         description: Featured testimonials.
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Submit a review and rating
 *     description: |
 *       **Purpose:** Allows a Parent to rate a Tutor (1 to 5 stars) after a completed appointment,
 *       or allows any user to submit platform feedback. Automatically recalculates the tutor's average rating.
 *       **Access Level:** 🔒 Authenticated Session (PARENT).
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               tutorId:
 *                 type: string
 *                 description: Required when rating a tutor.
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               appointmentId:
 *                 type: string
 *                 description: Optional completed appointment reference.
 *                 example: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Outstanding teaching style and very patient."
 *               subject:
 *                 type: string
 *                 example: "Mathematics"
 *               targetType:
 *                 type: string
 *                 enum: [TUTOR, PLATFORM]
 *                 default: "TUTOR"
 *     responses:
 *       201:
 *         description: Review submitted successfully.
 *       400:
 *         description: Validation error or rating outside 1-5 range.
 */

/**
 * @swagger
 * /api/reviews/{id}/reply:
 *   post:
 *     summary: Tutor or Parent reply to a received review
 *     description: |
 *       **Purpose:** Allows the tutor to write a public response to feedback received on their profile.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 example: "Thank you! It is a pleasure working with Aarav."
 *     responses:
 *       200:
 *         description: Reply added successfully.
 */
