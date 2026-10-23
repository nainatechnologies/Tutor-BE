/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Virtual coin balances, top-up packages, automatic coin deduction, and transaction ledger.
 */

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     summary: Retrieve live coin balance and transaction ledger
 *     description: |
 *       **Purpose:** Returns the user's available coin balance, expiry dates, and full historical credit/debit transactions.
 *       **Access Level:** 🔒 Authenticated Session (PARENT).
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance and recent transactions retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 balance: 150
 *                 validUntil: "2026-11-23T00:00:00Z"
 *                 transactions:
 *                   - id: "w1b2a3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c"
 *                     type: "DEBIT"
 *                     amount: 50
 *                     reason: "Connection request to Dr. Sarah Smith"
 *                     createdAt: "2026-10-23T15:00:00Z"
 *                   - id: "w9a8b7c6-5d4e-3f2a-1b0c-9d8e7f6a5b4c"
 *                     type: "CREDIT"
 *                     amount: 200
 *                     reason: "Online payment recharge (order_TrHdfKK9yU7bwS)"
 *                     createdAt: "2026-10-23T14:30:00Z"
 */

/**
 * @swagger
 * /api/wallet/packages:
 *   get:
 *     summary: Get available coin purchase packages
 *     description: |
 *       **Purpose:** Returns available coin bundles with prices in INR, bonus coins, and validity duration.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coin packages.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: "pkg_basic_50"
 *                   name: "Starter Pack"
 *                   coins: 50
 *                   priceInr: 299
 *                   validityDays: 30
 *                 - id: "pkg_popular_150"
 *                   name: "Standard Pack (Best Value)"
 *                   coins: 150
 *                   bonusCoins: 25
 *                   priceInr: 799
 *                   validityDays: 60
 */

/**
 * @swagger
 * /api/wallet/topup:
 *   post:
 *     summary: Top up wallet with coins (internal or after payment confirmation)
 *     description: |
 *       **Purpose:** Credits coins to the user's wallet with validity calculation and transaction ledger creation.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coins
 *             properties:
 *               coins:
 *                 type: integer
 *                 example: 100
 *               packageId:
 *                 type: string
 *                 example: "pkg_basic_50"
 *               paymentId:
 *                 type: string
 *                 example: "pay_TrHea99812bca"
 *     responses:
 *       200:
 *         description: Wallet credited successfully.
 */

/**
 * @swagger
 * /api/wallet/deduct:
 *   post:
 *     summary: Atomically deduct coins from wallet
 *     description: |
 *       **Purpose:** Deducts coins for platform actions (e.g., unlocking contact details). Ensures atomic safety against race conditions.
 *       **Access Level:** 🔒 Authenticated Session.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coins
 *               - reason
 *             properties:
 *               coins:
 *                 type: integer
 *                 example: 50
 *               reason:
 *                 type: string
 *                 example: "Connection request to Tutor"
 *     responses:
 *       200:
 *         description: Coins deducted successfully.
 *       400:
 *         description: Insufficient wallet balance.
 */
