/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time SSE notification stream, in-app alerts, unread counts, and admin broadcasts.
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Retrieve user's in-app notifications
 *     description: |
 *       **Purpose:** Returns paginated list of notification alerts (new connections, appointments booked, wallet top-ups).
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: If true, only returns unread notifications.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of notifications.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 notifications:
 *                   - id: "n1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c"
 *                     title: "New Connection Request"
 *                     message: "Pranay S. sent a connection request for Mathematics."
 *                     isRead: false
 *                     createdAt: "2026-10-23T15:30:00Z"
 *                 unreadCount: 3
 */

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get total count of unread notifications
 *     description: |
 *       **Purpose:** Lightweight endpoint for badge counters on notification bell icons.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total unread count.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 unreadCount: 3
 */

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all user notifications as read
 *     description: |
 *       **Purpose:** Sets `isRead: true` across all notifications for the current user.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read.
 */

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark specific notification as read
 *     description: |
 *       **Purpose:** Marks a single notification item as read when clicked.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Notifications]
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
 *         description: Notification marked as read.
 */

/**
 * @swagger
 * /api/notifications/stream:
 *   get:
 *     summary: Connect to real-time Server-Sent Events (SSE) stream
 *     description: |
 *       **Purpose:** Establishes a persistent SSE connection to receive live push alerts instantly without polling.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time event stream (`text/event-stream`).
 */
