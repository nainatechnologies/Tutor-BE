/**
 * @swagger
 * tags:
 *   name: Support
 *   description: User complaints submission, ticket resolution, and customer support tracking.
 */

/**
 * @swagger
 * /api/complaints:
 *   post:
 *     summary: Submit a new support complaint or ticket
 *     description: |
 *       **Purpose:** Allows parents or tutors to raise a support issue (e.g. appointment dispute, billing inquiry, tutor conduct).
 *       **Access Level:** 🔒 Authenticated Session (PARENT or TUTOR).
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - description
 *             properties:
 *               category:
 *                 type: string
 *                 example: "BILLING"
 *               targetId:
 *                 type: string
 *                 description: Optional user, appointment, or tutor UUID related to the issue.
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               description:
 *                 type: string
 *                 example: "Tutor did not attend the scheduled online session."
 *     responses:
 *       201:
 *         description: Ticket submitted successfully. Returns tracking ticket ID.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Complaint submitted successfully"
 *               data:
 *                 ticketId: "c1a2b3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
 *                 status: "OPEN"
 *
 * /api/complaints/my:
 *   get:
 *     summary: List complaints submitted by logged-in user
 *     description: |
 *       **Purpose:** Returns status updates and admin responses for all tickets filed by this user.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of complaints with admin resolution notes.
 */
