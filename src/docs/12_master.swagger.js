/**
 * @swagger
 * tags:
 *   name: Master Data
 *   description: Educational categories, academic subjects, and taxonomy configuration.
 */

/**
 * @swagger
 * /api/master/categories:
 *   get:
 *     summary: Get all active categories with their subjects
 *     description: |
 *       **Purpose:** Public taxonomies for dropdowns, search filters, and profile registration.
 *       **Access Level:** 🌐 Public.
 *     tags: [Master Data]
 *     security: []
 *     responses:
 *       200:
 *         description: List of categories with nested active subjects.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: "cat_1a2b3c4d"
 *                   name: "Academics"
 *                   description: "School & College curriculum"
 *                   subjects:
 *                     - id: "sub_1a2b3c4d"
 *                       name: "Mathematics"
 *                     - id: "sub_2b3c4d5e"
 *                       name: "Physics"
 *                 - id: "cat_2b3c4d5e"
 *                   name: "Special Education"
 *                   description: "Learning differences & special needs support"
 *                   subjects:
 *                     - id: "sub_3c4d5e6f"
 *                       name: "Speech Therapy"
 *                     - id: "sub_4d5e6f7a"
 *                       name: "Dyslexia Support"
 */

/**
 * @swagger
 * /api/admin/master/categories:
 *   get:
 *     summary: List all categories (Admin view including inactive)
 *     description: |
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All master categories.
 *
 *   post:
 *     summary: Create a new educational category
 *     description: |
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Languages"
 *               description:
 *                 type: string
 *                 example: "Foreign and regional language studies"
 *     responses:
 *       201:
 *         description: Category created.
 */

/**
 * @swagger
 * /api/admin/master/categories/{categoryId}/subjects:
 *   post:
 *     summary: Add a new subject to a category
 *     description: |
 *       **Access Level:** 🛡️ ADMIN ONLY.
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "French"
 *     responses:
 *       201:
 *         description: Subject created under specified category.
 */
