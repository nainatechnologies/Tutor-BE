/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Session booking, scheduling, time-slot selection, and status lifecycle management (PENDING, CONFIRMED, COMPLETED, CANCELLED).
 */

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get appointments for the authenticated user
 *     description: |
 *       **Purpose:** Returns all scheduled appointments.
 *       - If **Parent**: Returns booked sessions, tutor profiles, dates, and modes.
 *       - If **Tutor**: Returns student appointments, parent contact details, and locations.
 *       **Access Level:** 🔒 Authenticated Session (PARENT or TUTOR).
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED]
 *         description: Filter by status.
 *         example: "CONFIRMED"
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
 *                   status: "CONFIRMED"
 *                   date: "2026-10-25"
 *                   startTime: "16:00"
 *                   endTime: "17:00"
 *                   mode: "ONLINE"
 *                   meetingLink: "https://meet.google.com/xyz-abcd-efg"
 *                   subject: "Mathematics - Calculus"
 *                   tutor:
 *                     id: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                     name: "Dr. Sarah Smith"
 *
 *   post:
 *     summary: Book a new tutoring appointment
 *     description: |
 *       **Purpose:** Allows a Parent to book a tutoring appointment with a connected tutor for a specific child, date, and time.
 *       **Access Level:** 👨‍👩‍👧 PARENT ONLY.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tutorId
 *               - date
 *               - startTime
 *               - endTime
 *               - subject
 *               - mode
 *             properties:
 *               tutorId:
 *                 type: string
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               childId:
 *                 type: string
 *                 description: Optional registered child UUID.
 *                 example: "c1b2a3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-25"
 *               startTime:
 *                 type: string
 *                 example: "16:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00"
 *               subject:
 *                 type: string
 *                 example: "Mathematics"
 *               mode:
 *                 type: string
 *                 enum: [ONLINE, OFFLINE]
 *                 example: "ONLINE"
 *               notes:
 *                 type: string
 *                 example: "Please focus on derivative problems from chapter 4."
 *     responses:
 *       201:
 *         description: Appointment created successfully with initial status PENDING.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Appointment booked successfully"
 *               data:
 *                 id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
 *                 status: "PENDING"
 *       400:
 *         description: Invalid slot or validation failure.
 */

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Retrieve single appointment details
 *     description: |
 *       **Purpose:** Returns complete details for a specific appointment.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment details retrieved successfully.
 *       404:
 *         description: Appointment not found.
 */

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status (Confirm, Complete, or Cancel)
 *     description: |
 *       **Purpose:** Updates the appointment lifecycle.
 *       - Tutor can confirm (`CONFIRMED`) or complete (`COMPLETED`).
 *       - Either party can cancel (`CANCELLED`) with a cancellation reason.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Appointments]
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
 *                 enum: [CONFIRMED, COMPLETED, CANCELLED]
 *                 example: "CONFIRMED"
 *               meetingLink:
 *                 type: string
 *                 description: Optional video link when confirming an ONLINE session.
 *                 example: "https://meet.google.com/xyz-abcd-efg"
 *               cancellationReason:
 *                 type: string
 *                 description: Required if status is CANCELLED.
 *                 example: "Schedule conflict due to school exams."
 *     responses:
 *       200:
 *         description: Appointment status updated successfully.
 */
