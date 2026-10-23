/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Platform administration, tutor verification, lead management, revenue analytics, and moderation.
 */

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Retrieve executive dashboard KPIs & metrics
 *     description: |
 *       **Purpose:** Returns platform-wide aggregate counts: total registered tutors, approved tutors, active parents,
 *       connections initiated, appointments completed, and total platform revenue.
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform KPI metrics.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 totalTutors: 124
 *                 approvedTutors: 98
 *                 pendingApprovals: 26
 *                 totalParents: 480
 *                 activeAppointments: 42
 *                 totalRevenueInr: 145000
 *       403:
 *         description: Forbidden (Requires ADMIN role).
 */

/**
 * @swagger
 * /api/admin/revenue/analytics:
 *   get:
 *     summary: Get detailed financial analytics & revenue breakdowns
 *     description: |
 *       **Purpose:** Returns monthly and weekly revenue trends, transaction volume, and coin package distributions.
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial revenue report.
 */

/**
 * @swagger
 * /api/admin/registration-requests:
 *   get:
 *     summary: List tutor registration and verification requests
 *     description: |
 *       **Purpose:** Lists all tutors awaiting review, their submitted qualifications, subjects, and ID proofs.
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by approval status.
 *     responses:
 *       200:
 *         description: List of tutor registration requests.
 */

/**
 * @swagger
 * /api/admin/registration-requests/{id}:
 *   patch:
 *     summary: Approve or reject a tutor verification request
 *     description: |
 *       **Purpose:** Approves a tutor (making their profile publicly searchable) or rejects with a reason.
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Admin]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *                 example: "APPROVED"
 *               rejectionReason:
 *                 type: string
 *                 example: "Qualification certificates are unclear. Please re-upload."
 *     responses:
 *       200:
 *         description: Status updated successfully.
 */

/**
 * @swagger
 * /api/admin/leads:
 *   get:
 *     summary: View all parent-tutor connection leads
 *     description: |
 *       **Purpose:** Displays platform-wide lead interactions, matchmaking rates, and conversation statuses.
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform leads list.
 */

/**
 * @swagger
 * /api/admin/payments:
 *   get:
 *     summary: Platform payment transaction history
 *     description: |
 *       **Purpose:** Returns comprehensive list of all Razorpay payment records, amounts, statuses, and user accounts.
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment transaction records.
 */

/**
 * @swagger
 * /api/admin/reviews/{id}/status:
 *   patch:
 *     summary: Moderate review visibility (Publish or Hide)
 *     description: |
 *       **Purpose:** Allows administrators to toggle a review's status between `published` and `hidden` to prevent spam/abuse.
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Admin]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [published, hidden]
 *                 example: "hidden"
 *     responses:
 *       200:
 *         description: Review visibility updated.
 */

/**
 * @swagger
 * /api/admin/complaints/{id}/status:
 *   patch:
 *     summary: Resolve or update complaint ticket status
 *     description: |
 *       **Purpose:** Admin resolves a complaint ticket and attaches resolution notes.
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Admin]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IN_PROGRESS, RESOLVED, CLOSED]
 *                 example: "RESOLVED"
 *               resolutionNotes:
 *                 type: string
 *                 example: "Contacted tutor, session has been rescheduled and 50 coins refunded."
 *     responses:
 *       200:
 *         description: Complaint resolved.
 */
