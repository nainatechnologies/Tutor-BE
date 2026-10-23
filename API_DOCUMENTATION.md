# Nurtiva Tutor Platform — Comprehensive API Documentation

> **Specification Standard:** OpenAPI 3.0 / REST  
> **Interactive Documentation:** `http://localhost:5001/api-docs`  
> **Raw OpenAPI JSON Spec:** `http://localhost:5001/api-docs.json`  
> **Postman Collection:** `nurtiva_api_postman_collection.json` (Included in repository)

---

## 1. Quickstart & Environments

| Environment | Base URL | Purpose |
| :--- | :--- | :--- |
| **Local Development** | `http://localhost:5001` | Local backend testing |
| **Production (Railway)** | `https://your-railway-app.up.railway.app` | Cloud deployment |

---

## 2. Authentication & Authorization (RBAC)

All private endpoints require a JSON Web Token (JWT) passed in the `Authorization` HTTP header:

```http
Authorization: Bearer <your_7d_jwt_token>
```

### Access Tiers:
* 🌐 **`PUBLIC`** — Open to all users without authentication (SEO discovery, search, login, registration, OTP).
* 👨‍👩‍👧 **`PARENT ONLY`** — Requires authenticated user with `role: "PARENT"` (e.g. child management, connection requests, coin purchase).
* 🎓 **`TUTOR ONLY`** — Requires authenticated user with `role: "TUTOR"` (e.g. professional profile editing, accepting connections, tutor analytics).
* 🛡️ **`ADMIN ONLY`** — Requires authenticated user with `role: "ADMIN"` (e.g. tutor verification approvals, lead oversight, revenue reports, moderation).

---

## 3. Standard Response Envelopes

### Success Envelope (`200 OK`, `201 Created`):
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Error Envelope (`400`, `401`, `403`, `404`, `429`):
```json
{
  "success": false,
  "message": "Human readable error description",
  "error": {
    "code": "ERROR_CODE_CONSTANT",
    "details": [
      { "field": "email", "issue": "Invalid email address format" }
    ]
  }
}
```

---

## 4. Complete Module API Directory (48 Endpoints)

---

### Module 1: Authentication (`/api/auth`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | 🌐 `PUBLIC` | Register as Parent or Tutor account |
| `POST` | `/api/auth/login` | 🌐 `PUBLIC` | Authenticate with email/phone & get 7-day JWT |
| `POST` | `/api/auth/send-otp` | 🌐 `PUBLIC` | Dispatch 6-digit SMS OTP via gateway |
| `POST` | `/api/auth/reset-password` | 🌐 `PUBLIC` | Reset password using verified phone OTP |
| `POST` | `/api/auth/change-password`| 🔒 `ANY` | Update password for active logged-in user |
| `POST` | `/api/auth/logout` | 🌐 `OPTIONAL`| Invalidate client session token |

#### Sample Request: `POST /api/auth/login`
```json
{
  "identifier": "tutor1@gmail.com",
  "password": "Password@123"
}
```

#### Sample Response (`200 OK`):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Dr. Sarah Smith",
      "email": "tutor1@gmail.com",
      "role": "TUTOR"
    }
  }
}
```

---

### Module 2: Search & Marketplace Discovery (`/api/search`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/search/tutors` | 🌐 `PUBLIC` | Search tutors by pincode, city, subjects, mode, and fee |
| `GET` | `/api/search/tutors/:id` | 🌐 `PUBLIC` | Retrieve detailed public tutor profile card |

#### Query Parameters for `/api/search/tutors`:
* `search` (string): Keyword matching name or bio (e.g. `Mathematics`).
* `location` (string): City or area name (e.g. `Khammam`).
* `pincode` (string): 6-digit postal code (e.g. `507122`).
* `mode` (string): `ONLINE`, `OFFLINE`, or `BOTH`.
* `minFee` / `maxFee` (number): Hourly rate budget range.
* `page` (integer): Default `1`.
* `limit` (integer): Default `10`.

---

### Module 3: Users & Profiles (`/api/users`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | 🔒 `ANY` | Get currently logged-in user & child profiles |
| `PUT` | `/api/users/profile` | 🔒 `ANY` | Update bio, hourly rate, location, city, pincode, children |
| `POST` | `/api/users/upload` | 🔒 `ANY` | Upload multipart file (avatar/doc) to Cloudinary |
| `GET` | `/api/users/tutor/analytics`| 🎓 `TUTOR` | View total views, leads, and conversion metrics |

---

### Module 4: Connections & Matchmaking (`/api/connections`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/connections` | 🔒 `ANY` | View my connection leads & unlocked contact info |
| `POST` | `/api/connections` | 🔒 `ANY` | Request connection (deducts 50 coins) or accept/reject request |

#### Sample Request: Parent Requesting Tutor (`POST /api/connections`)
```json
{
  "tutorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "subject": "Mathematics",
  "message": "Looking for in-person tutoring on weekends"
}
```

---

### Module 5: Payments & Checkout (`/api/payments`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/create-order` | 👨‍👩‍👧 `PARENT` | Generate official Razorpay `order_id` |
| `POST` | `/api/payments/verify` | 🔒 `ANY` | Verify HMAC SHA256 signature & credit coins |
| `POST` | `/api/payments/callback` | 🌐 `PUBLIC` | 3D-Secure bank redirect handler |

---

### Module 6: Wallet & Virtual Coins (`/api/wallet`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/wallet/balance` | 🔒 `ANY` | Get coin balance, expiry, and transaction ledger |
| `GET` | `/api/wallet/packages` | 🔒 `ANY` | List available coin recharge packages |
| `POST` | `/api/wallet/topup` | 🔒 `ANY` | Credit coins with validity calculation |
| `POST` | `/api/wallet/deduct` | 🔒 `ANY` | Atomically deduct coins for platform actions |

---

### Module 7: Appointments & Scheduling (`/api/appointments`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/appointments` | 🔒 `ANY` | List booked sessions with status filters |
| `POST` | `/api/appointments` | 👨‍👩‍👧 `PARENT` | Book appointment for date, time-slot & subject |
| `GET` | `/api/appointments/:id` | 🔒 `ANY` | Get details of a single appointment |
| `PATCH`| `/api/appointments/:id/status`| 🔒 `ANY` | Confirm, Complete, or Cancel appointment |

---

### Module 8: Reviews & Ratings (`/api/reviews`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reviews/tutors/:tutorId` | 🌐 `PUBLIC` | Public 1-5 star ratings and reviews for a tutor |
| `GET` | `/api/reviews/testimonials` | 🌐 `PUBLIC` | Featured marketing reviews for home page |
| `POST` | `/api/reviews` | 👨‍👩‍👧 `PARENT` | Submit 1-5 star review and written feedback |
| `POST` | `/api/reviews/:id/reply` | 🎓 `TUTOR` | Post 1-time public tutor response to a review |

---

### Module 9: Support & Complaints (`/api/complaints`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints` | 🔒 `ANY` | Raise dispute, billing inquiry, or conduct complaint |
| `GET` | `/api/complaints/my` | 🔒 `ANY` | Track ticket status and admin resolution notes |

---

### Module 10: In-App Notifications (`/api/notifications`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | 🔒 `ANY` | Paginated in-app alerts (connections, sessions) |
| `GET` | `/api/notifications/unread-count`| 🔒 `ANY` | Unread badge count for header bell icon |
| `PATCH`| `/api/notifications/read-all` | 🔒 `ANY` | Mark all notifications as read |
| `PATCH`| `/api/notifications/:id/read` | 🔒 `ANY` | Mark single notification as read |
| `GET` | `/api/notifications/stream` | 🔒 `ANY` | Real-time Server-Sent Events (SSE) stream |

---

### Module 11: Admin Operations (`/api/admin`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard/stats` | 🛡️ `ADMIN` | Executive KPI cards (tutors, parents, revenue) |
| `GET` | `/api/admin/revenue/analytics` | 🛡️ `ADMIN` | Monthly and weekly revenue analytics |
| `GET` | `/api/admin/registration-requests`| 🛡️ `ADMIN` | List pending tutor onboarding applications |
| `PATCH`| `/api/admin/registration-requests/:id`| 🛡️ `ADMIN` | Approve or reject tutor application |
| `GET` | `/api/admin/leads` | 🛡️ `ADMIN` | Platform-wide lead activity overview |
| `GET` | `/api/admin/payments` | 🛡️ `ADMIN` | Full payment ledger across all parents |
| `PATCH`| `/api/admin/reviews/:id/status` | 🛡️ `ADMIN` | Toggle review visibility (`published` / `hidden`) |
| `PATCH`| `/api/admin/complaints/:id/status`| 🛡️ `ADMIN` | Resolve support ticket with resolution notes |

---

### Module 12: Master Data (`/api/master`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/master/categories` | 🌐 `PUBLIC` | Taxonomy categories with nested subjects |
| `GET` | `/api/admin/master/categories` | 🛡️ `ADMIN` | Admin categories management view |
| `POST` | `/api/admin/master/categories` | 🛡️ `ADMIN` | Create new subject category |
| `POST` | `/api/admin/master/categories/:id/subjects`| 🛡️ `ADMIN` | Create subject under category |

---

## 5. How to Import the Postman Collection

1. Open **Postman**.
2. Click **Import** (top left).
3. Select `nurtiva_api_postman_collection.json` located in the root of `Tutor-BE`.
4. You will see all **12 folders** containing all **48 pre-configured requests**.
5. Run the **`Auth` $\rightarrow$ `Login for Parents and Tutors`** request.
   * *The collection's automated test script will automatically capture the returned JWT token and apply it to all other requests in the collection!*
