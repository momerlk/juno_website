# Comprehensive API Migration Gap Analysis (v1 to v2)

This report details every endpoint, data model, and business logic component from `api_docs_v1.yaml` that is currently missing from `api_documentation.json` (v2).

## 1. Missing Functional Modules (Entirely Omitted)

### 1.1 Work Management Dashboard (Internal Operations)
The entire internal ecosystem for Juno employees and CEO oversight is missing.
*   **Business Functionality:** Task assignment, performance tracking, weekly reporting, and CEO-level auditing.
*   **Missing Endpoints:**
    *   `POST /work/auth/login`: Employee authentication.
    *   `POST /work/auth/register`: Employee onboarding.
    *   `GET /work/auth/me`: Auth context for employees.
    *   `GET /work/employees`: Directory of internal staff.
    *   `GET /work/performance`: Global performance metrics.
    *   `GET /work/performance/{employee_id}`: Granular staff analytics.
    *   `GET /work/reports`: Retrieval of weekly status updates.
    *   `POST /work/reports`: Submission of status updates.
    *   `GET/POST/PUT/DELETE /work/tasks`: Full CRUD for internal task management (CEO Only).
    *   `PUT /work/tasks/{id}/status`: Task lifecycle management.
*   **Missing Models:** `handlers.LoginResponse`, `handlers.GetReportsResponse`, `handlers.GetTasksResponse`, `models.Employee`, `models.PerformanceStats`, `models.Task`, `models.WeeklyReport`.

### 1.2 Admin Portal (Platform Management)
All administrative control over the marketplace ecosystem is missing.
*   **Business Functionality:** Seller approval, user management, global notification broadcasting, and system health monitoring.
*   **Missing Endpoints:**
    *   `GET /admin/analytics/events`: Raw event stream auditing.
    *   `GET /admin/analytics/sales-funnel`: Macro-conversion metrics.
    *   `GET /admin/carts`: System-wide cart auditing.
    *   `GET /admin/chapter-forms`: Oversight of campus ambassador applications.
    *   `GET /admin/delivery-bookings`: Platform-wide logistics monitoring.
    *   `GET /admin/health`: System status and uptime.
    *   `GET /admin/interactions`: Global user-product interaction logs.
    *   `GET /admin/invites`: Referral code management.
    *   `GET /admin/orders`: Global order oversight.
    *   `PUT /admin/orders/{orderID}`: Admin override for orders.
    *   `GET /admin/otps`: Audit log of active security codes.
    *   `GET /admin/products-queue`: Approval system for indie labels.
    *   `GET /admin/sellers`: Seller directory management.
    *   `PUT /admin/sellers/{id}/approve`: The core "gatekeeper" functionality for the marketplace.
    *   `GET /admin/waitlist`: Early access user management.
*   **Missing Models:** `models.AnalyticsSummary`, `models.CustomerBehavior`, `models.SalesFunnel`, `models.ProductsQueue`.

### 1.3 Ambassador / Chapter Dashboard
The "Juno Campus" ecosystem for university leads is missing.
*   **Business Functionality:** Institute-specific growth tracking, team management, and gamified tasks.
*   **Missing Endpoints:**
    *   `GET /ambassador/dashboard`: Role-specific growth metrics.
    *   `GET /ambassador/data`: Verification of ambassador status.
    *   `POST /ambassador/login`: Dedicated login for campus leads.
    *   `GET /ambassador/ranking`: Competitive institute leaderboard.
    *   `GET /ambassador/tasks`: Specialized tasks for campus growth.
    *   `GET /ambassador/team`: Peer-to-peer management within chapters.
    *   `GET /ambassador/users`: Student-specific user directory.
*   **Missing Models:** `models.AmbassadorDashboardResponse`, `models.AmbassadorLoginResponse`, `models.AmbassadorTask`, `models.AmbassadorUserResponse`, `models.ChapterForm`, `models.InstituteRanking`.

### 1.4 Gamification: Tournaments & Outfits
The "Swipe-to-Shop" and "Indie Spirit" discovery mechanism is missing.
*   **Business Functionality:** Community voting (swiping), outfit contests, and leaderboard rewards.
*   **Missing Endpoints:**
    *   `GET/POST /tournaments`: Contest lifecycle management.
    *   `POST /tournaments/{id}/register`: User participation.
    *   `POST /tournaments/{id}/vote`: The "Swipe" mechanic implementation.
    *   `GET /tournaments/{id}/leaderboard`: Real-time ranking logic.
    *   `POST /tournaments/{id}/add-outfit`: Content submission.
    *   `GET/POST/PUT/DELETE /outfits`: Personal styling engine endpoints.
    *   `PATCH /outfits/{id}/rename`: Content management.
*   **Missing Models:** `models.Tournament`, `models.TournamentOutfit`, `models.TournamentStats`, `models.Leaderboard`, `models.RankingEntry`, `models.Outfit`, `handlers.VoteInTournamentPayload`.

### 1.5 Social & Community
The interactive layer of the marketplace is missing.
*   **Business Functionality:** Real-time buyer/seller communication, group discovery, and personal "Closets".
*   **Missing Endpoints:**
    *   `GET/POST/PUT/DELETE /closets`: Public/Private shareable collections.
    *   `POST /closets/{id}/items`: Collection curation.
    *   `GET/POST /groupchat/messages`: Community chat layer.
    *   `POST /groupchat/admin`: Moderation logic (mute/ban).
    *   `POST /groupchat/upload`: Media sharing in community channels.
*   **Missing Models:** `models.Closet`, `models.ClosetItem`, `models.GroupMessage`.

---

## 2. Missing Core Logic & Infrastructure

### 2.1 Logistics & Webhooks (Deep Integrations)
v2 has a generic fare estimate but lacks the actual execution logic.
*   **Missing Endpoints:**
    *   `POST /bykea/bill-payment`, `POST /bykea/delivery`, `POST /bykea/purchase`: Full Bykea service suite.
    *   `PUT /bykea/cancel-booking`: Order cancellation logic.
    *   `GET /bykea/tracking/{tripID}`: Real-time logistics updates.
    *   `POST /bykea/webhook`: Critical status update listener.
    *   `POST /webhook/postex`: Courier status integration.
*   **Missing Models:** All `models.Bykea*` definitions (15+ models).

### 2.2 Notification Ecosystem
v2 has no mechanism for push notifications (crucial for mobile conversion).
*   **Missing Endpoints:**
    *   `POST /notifications/register`: Expo push token storage.
    *   `POST /notifications/users/me/send`: Direct user communication.
    *   `POST /admin/notifications/broadcast`: Platform-wide alerts.
    *   `POST /admin/notifications/receipts/check`: Delivery verification.
*   **Missing Models:** `models.NotificationToken`, `models.ExpoPushTicket`, `models.ExpoPushReceipt`, `handlers.SendNotificationRequest`.

### 2.3 Authentication Gaps
v2 simplifies auth but removes essential security features.
*   **Missing Endpoints:**
    *   `POST /auth/refresh`: Token lifecycle management (preventing logout).
    *   `POST /auth/change-password`: Basic security.
    *   `POST /auth/reset-password/request`: Recovery flow.
    *   `POST /auth/send-otp`: Multi-factor verification.
*   **Missing Models:** `models.RefreshTokenRequest`, `models.ResetPasswordRequest`.

---

## 3. Data Model Degradation (Missing Fields)

### 3.1 Product Model (`models.Product`)
The v2 `catalog.Product` is a "skeleton" compared to v1.
*   **Missing Fields:**
    *   `care_instructions`: Critical for Pakistani fabrics.
    *   `customization_options`: For "Made-to-Order" indie brands.
    *   `is_ready_to_wear`, `is_customizable`: Business logic flags.
    *   `return_eligibility`: Policy compliance.
    *   `occasion`, `season`: Discovery metadata.
    *   `wash_care`: Practical usage data.
    *   `sizing_guide`: Detailed measurement tables.

### 3.2 User Model (`models.User`)
v2 lacks the personalization data required for the AI-driven mission.
*   **Missing Fields:**
    *   `measurement_profile`: (Bust, waist, hip, inseam) for fit prediction.
    *   `preferences`: (Favorite brands, color preferences, style tags).
    *   `recently_viewed`: For "Swipe-to-Shop" personalization.
    *   `referral_code`: For growth tracking.

### 3.3 Order Model (`models.Order`)
v2 lacks the "Marketplace Splitting" logic.
*   **Missing Fields/Logic:**
    *   `parent_order_id`: Linking a multi-brand checkout to individual seller fulfillments.
    *   `delivery_booking_id`: Link to 3rd party logistics (Bykea/PostEx).
    *   `tracking_info`: Granular per-item tracking events.
    *   `airway-bill`: PDF generation for shipping labels.

## 4. Summary of Model Deficit
Total Definitions in v1: **~150**
Total Definitions in v2: **~40**

**Specific Omitted Logic:**
1.  **Image Processing:** `POST /neutral-image` (Conceptual background removal for indie brand consistency).
2.  **Waitlist:** `GET /waitlist-spots`, `GET /waitlist-status` (Pre-launch engagement).
3.  **Inventory:** `POST /seller/inventory/bulk-update`, `GET /seller/inventory/low-stock`.
4.  **Updates:** `GET/POST /updates` (Juno News/Announcements).
