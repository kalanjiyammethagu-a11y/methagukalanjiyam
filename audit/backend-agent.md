BE-1: Inconsistent Zod validation across API routes 
Severity: High  
Confidence: Confirmed  
Location: src/app/api/admin/upload-image/route.ts, src/app/api/admin/supporters/route.ts, src/app/api/admin/categories/route.ts  
What is wrong: Several admin routes manually validate inputs using if checks instead of Zod schemas, creating validation gaps and inconsistent validation rigor.  
Evidence: upload-image route line 34 checks file type; supporters PATCH line 132 has manual id check.  
Impact: Malformed inputs can reach database operations.  
Recommended fix: Create and use Zod schemas for all route inputs following the patterns established in src/lib/validators/ 
BE-2: Non-uniform API response format  
Severity: Medium  
Confidence: Confirmed  
Location: Multiple route files across src/app/api/  
What is wrong: API routes return varying response shapes without a consistent envelope pattern. Some routes return { error: ... } on failure, others return { success: true, ... } on success; some include message, some dont; response structures differ between { books: [...] }, { orders: [...] }, { order: data }, etc.  
Impact: Client code must handle multiple response formats, increasing integration complexity and reducing type safety; harder to write consistent API consumers.  
Recommended fix: Establish and enforce a consistent API response interface, such as { success: boolean, data?: T, error?: string, message?: string }, and ensure all routes follow this pattern 
BE-3: Admin session validation checks session validity but not explicit role  
Severity: High  
Confidence: Confirmed  
Location: src/lib/auth-service.ts validateAdminSession() function; src/app/api/admin/*/route.ts checkAdmin() functions; src/middleware.ts updateSession  
What is wrong: The validateAdminSession function verifies session token integrity, expiry, and idle timeout but does NOT query the profiles table for role=admin. The checkAdmin function in each admin route only calls validateAdminSession(adminCookie), which means any user with a valid session cookie can access admin routes regardless of their assigned role in the database.  
Evidence: validateAdminSession (auth-service.ts line 284-326) returns { valid: true, userId } after checking the admin_sessions DB table for expiry and idle timeout, but never checks profiles.role. checkAdmin (admin books route line 7-12) simply calls validateAdminSession(adminCookie) and returns the boolean. The admin login flow (auth admin login route) does check profile?.role === admin (line 71-72), but this check is bypassed when ADMIN_2FA_ENABLED=false which issues a session directly without re-verifying the role from the database.  
Impact: Privilege escalation risk - a user without an admin role in profiles could potentially access admin endpoints if they obtain a valid session token; the 2FA bypass path compounds this by granting session without role re-verification.  
Recommended fix: Integrate role-based access checks into the middleware layer or validateAdminSession function by also querying the profiles table for role=admin, or at minimum re-verify the role in each admin route handler after session validation 
BE-4: Per-process rate limiter not suitable for Cloudflare/serverless deployment  
Severity: High  
Confidence: Confirmed  
Location: src/lib/rate-limit.ts; src/middleware.ts RATE_LIMIT_RULES  
What is wrong: The rateLimit module uses an in-memory Map that persists across requests within the same Node.js process but does not sync across processes. In a Cloudflare or multi-instance deployment, each process maintains its own rate limit state, rendering the in-memory limiter ineffective as a cross-process defense. The code even acknowledges this: // per-process rate limiter. In a serverless or multi-instance deployment, each process maintains its own state.  
Impact: Rate limits can be bypassed by distributing requests across multiple processes/stances; legitimate requests may be rate-limited in one process while another process has capacity; false sense of security.  
Recommended fix: Replace the in-memory rate limiter with a distributed solution such as Redis-backed rate limiting, or rely primarily on Cloudflare WAF rate limiting rules as the code already notes as primary defense (CLOUDFLARE-SETUP.md). The in-memory limiter should remain only as a defense-in-depth layer for single-instance deployments 
BE-4: Per-process rate limiter not suitable for Cloudflare/serverless deployment 
Severity: High 
Confirmed 
What is wrong: The rateLimit module uses an in-memory Map that persists across requests within the same Node.js process but does not sync across processes. In a Cloudflare or multi-instance deployment, each process maintains its own rate limit state, rendering the in-memory limiter ineffective as a cross-process defense. The code even acknowledges this: // per-process rate limiter. In a serverless or multi-instance deployment, each process maintains its own state. 
Impact: Rate limits can be bypassed by distributing requests across multiple processes/stances; legitimate requests may be rate-limited in one process while another process has capacity; false sense of security. 
Recommended fix: Replace the in-memory rate limiter with a distributed solution such as Redis-backed rate limiting, or rely primarily on Cloudflare WAF rate limiting rules as the code already notes as primary defense (CLOUDFLARE-SETUP.md). The in-memory limiter should remain only as a defense-in-depth layer for single-instance deployments 
BE-5: Order creation fallback to mock order when DB is placeholder 
Severity: Medium 
Confidence: Confirmed 
Location: src/app/api/orders/create/route.ts line 103-163; src/lib/razorpay.ts line 97-116 
What is wrong: When Supabase credentials are placeholder/missing (development/placeholder config), order creation falls back to a mock order object (mock-order-) but the Razorpay order is still created via the real/graceful SDK. This creates a potential inconsistency: the system has a real Razorpay order ID but only a mock order record in the database, or vice versa. The mock order ID format differs from the RPC-created order ID format, which could cause issues in payment verification and ERP sync. 
Impact: In placeholder/development mode, the system processes real payments but only mock-order records exist, making it impossible to track orders, verify payments, or sync to ERP properly. Production deployment with misconfigured placeholders could lead to order data loss. 
Recommended fix: Ensure placeholder mode is only used in true development environments with no payment processing. Add validation that prevents the API from functioning with placeholder DB credentials in contexts where order persistence is required. Add explicit warnings when running in placeholder mode. 
BE-6: Silent error suppression with .catch(() =
Severity: Medium 
Confidence: Confirmed 
Location: src/lib/erp/sync-queue.ts multiple locations; src/app/api/erp/*/route.ts files 
What is wrong: Multiple locations use try { ... } catch { /* .catch(() = */ patterns that silently swallow errors, making debugging difficult and potentially leaving the system in an inconsistent state. The ERP sync queue module has no fewer than 5-6 .catch(() = calls that ignore errors entirely. 
Impact: Errors in critical paths (ERP sync, database writes) are silently lost; operators have no visibility into failures; data can become desynchronized between the platform and ERPNext; difficult to audit or troubleshoot issues. 
Recommended fix: Replace .catch(() = with proper error handling that logs the error, potentially retries the operation, or propagates the error appropriately. At minimum, ensure all caught errors are logged with sufficient context for debugging. 
BE-7: ERP sync queue uses in-memory store that loses data on restart 
Confidence: Confirmed 
Location: src/lib/erp/sync-queue.ts; .erp-sync-queue.json; .erp-audit-log.json 
What is wrong: The ERP sync queue primarily uses an in-memory queueItems array with JSON file persistence (.erp-sync-queue.json). While files are written on each operation, the in-memory state is reset on server restart, and the file persistence may not capture the most recent state if the process crashes before write. The audit logs face the same issue with .erp-audit-log.json. The code comments acknowledge this: // In serverless / read-only filesystem environments, file writes are safely caught. 
Impact: Pending ERP sync items can be lost on server restart, leading to order data not being synced to ERPNext; audit trail gaps; potential order loss for recent transactions. 
Recommended fix: Implement more robust persistence, such as using Supabase database tables for the sync queue and audit logs instead of JSON files, or add transactional file writes with atomic rename. Consider using the existing erp_sync_queue Supabase table that syncItemToDatabase already writes to, as the primary store rather than in-memory + JSON. 
BE-8: Payment verification idempotency only checks same payment ID 
Severity: High 
Confidence: Confirmed 
Location: src/app/api/orders/verify/route.ts line 106-128 
What is wrong: The idempotency check in the payment verification route only prevents replay attacks where the same razorpay_payment_id is submitted twice. It does not prevent a replay attack where a different payment ID is used for the same order - specifically, if an order was already paid with one Razorpay payment, a different payment ID could potentially be submitted and (depending on database state) could either be rejected or create a duplicate payment record. 
Impact: Replay attacks with different payment IDs could result in double-payment or order confusion; particularly dangerous in placeholder/development mode where database records may not accurately reflect payment state. 
Recommended fix: Add a database-level unique constraint or check on razorpay_order_id to ensure each order can only be verified once, regardless of the payment ID. Enhance the idempotency check to also verify the order hasn't already been paid, not just that the same payment ID is being resubmitted. 
BE-9: Missing validation on guest checkout fields 
Severity: Low 
Confidence: Inference 
Location: src/app/api/orders/create/route.ts; src/lib/validators/order.ts 
What is wrong: The order creation flow requires authentication (if (!userId) return 401) and defaults to is_guest_checkout: false, but the createOrderSchema includes guest_phone and guest_email fields with validation. This creates a contradictory situation where guest checkout fields are validated but guest checkout is not permitted. If the auth check fails or is bypassed, these fields could be misused. 
Impact: If authentication is somehow bypassed, the guest checkout fields have validation that could be exploited; confusing API behavior where guest fields are accepted but guest checkout is not permitted. 
Recommended fix: Either fully support guest checkout with proper validation and order creation path, or remove the guest_phone and guest_email fields from the schema and API entirely if guest checkout is not supported. If guest checkout is intended to be supported, add the auth exemption and proper order creation logic. 
BE-10: Audit logging is inconsistent across routes 
Severity: Medium 
Confidence: Confirmed 
Location: Multiple route files across src/app/api/ 
What is wrong: Audit logs are tracked for some routes (signup creates audit log entry, admin login creates entries, payment verification creates entries) but many other routes do not log any actions: book CRUD operations (admin books GET/POST/PATCH/DELETE), category operations, address operations, supporter operations, and even order my-orders fetch has no audit logging. This creates an incomplete audit trail. 
Impact: Inability to trace administrative actions; compliance gaps for financial/payment operations; difficulty investigating unauthorized access or data modifications; incomplete forensic data. 
Recommended fix: Implement consistent audit logging across all API routes that modify data or authenticate users. At minimum, log: action type, user ID (or IP if unauthenticated), timestamp, and outcome (success/failure). Use the existing issueUserVerificationToken/verifyUserEmailToken pattern or the adminSupabase.from(\" "audit_logs\) insert pattern that's already established in the codebase. 
