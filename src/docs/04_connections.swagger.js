/**
 * @swagger
 * tags:
 *   name: Connections
 *   description: Parent-Tutor connection requests, coin deductions, lead matchmaking, and contact detail unlocking.
 */

/**
 * @swagger
 * /api/connections:
 *   get:
 *     summary: Get list of active and pending connections
 *     description: |
 *       **Purpose:** Returns all connection relationships for the authenticated user.
 *       - If **Parent**: Returns requested tutors, connection statuses, and unlocked contact info.
 *       - If **Tutor**: Returns student connection leads, messages, and parent contact details.
 *       **Access Level:** 🔒 Authenticated Session (PARENT or TUTOR).
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connections retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: "b2a1c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
 *                   status: "ACCEPTED"
 *                   subject: "Mathematics"
 *                   message: "Looking for weekly calculus tutoring"
 *                   tutor:
 *                     id: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                     name: "Dr. Sarah Smith"
 *                     phone: "9876543210"
 *                     email: "tutor1@gmail.com"
 *                   createdAt: "2026-10-23T10:00:00Z"
 *
 *   post:
 *     summary: Request new connection or update connection status
 *     description: |
 *       **Purpose:** Dual-action connection endpoint:
 *       1. **Parent Requesting Tutor:** Pass `tutorId`, `subject`, and optional `message`.
 *          Deducts 50 coins from Parent wallet automatically.
 *       2. **Tutor Responding to Request:** Pass `connectionId` and `status` (`ACCEPTED` or `REJECTED`).
 *       **Access Level:** 🔒 Authenticated Session.
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
 *               tutorId:
 *                 type: string
 *                 description: Required when Parent initiates a new request.
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               subject:
 *                 type: string
 *                 description: Required when requesting.
 *                 example: "Mathematics"
 *               message:
 *                 type: string
 *                 description: Optional initial inquiry message.
 *                 example: "Looking for in-person tutoring on weekends"
 *               connectionId:
 *                 type: string
 *                 description: Required when Tutor updates an existing request.
 *                 example: "b2a1c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACCEPTED, REJECTED]
 *                 description: Required when Tutor responds to a request.
 *                 example: "ACCEPTED"
 *     responses:
 *       201:
 *         description: Connection requested successfully (New connection initiated).
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Connection requested successfully"
 *               data:
 *                 connectionId: "b2a1c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
 *                 status: "PENDING"
 *                 coinsDeducted: 50
 *       200:
 *         description: Connection status updated successfully (e.g. Tutor ACCEPTED).
 *       400:
 *         description: Insufficient coins in wallet or validation failure.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Insufficient coins to request connection. Please recharge your wallet."
 */
