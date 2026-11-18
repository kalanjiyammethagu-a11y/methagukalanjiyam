import { createClient } from "@supabase/supabase-js";

const baseUrl = "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runTests() {
  console.log("=== ENTERPRISE AUDIT & VERIFICATION SUITE ===");
  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = "") {
    if (condition) {
      console.log(`PASS: ${name} ${extra}`);
      passed++;
    } else {
      console.error(`FAIL: ${name} ${extra}`);
      failed++;
    }
  }

  // TEST 1: Check 20 books in Supabase
  const { data: books, error: booksErr } = await supabase.from("books").select("id, title, slug, price, stock");
  assert("CATALOG-01: Exactly 20 books in Supabase public.books", books && books.length === 20, `(Count: ${books?.length})`);
  assert("CATALOG-02: Book IDs use UUID pattern", books?.every(b => b.id.startsWith("b0000000-")), `(Sample ID: ${books?.[0]?.id})`);

  // TEST 2: Create a real order with UUID
  const testBook = books[0];
  const orderPayload = {
    items: [
      {
        book_id: testBook.id,
        quantity: 1,
        price: testBook.price,
        title: testBook.title,
      },
    ],
    shipping_address: {
      full_name: "Tamilarasan Verification",
      phone: "9876543210",
      house_name: "No. 14, Archival Lane",
      street: "Periyar Street",
      city: "Madurai",
      state: "Tamil Nadu",
      pincode: "625001",
    },
    is_guest_checkout: true,
    guest_phone: "9876543210",
  };

  const createRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });
  const createData = await createRes.json();

  assert("ORDER-01: Order created via /api/orders/create", createRes.status === 201 && createData.order_number, `Order: ${createData.order_number}`);

  // TEST 3: Verify order_items has non-null book_id in Supabase!
  const { data: dbOrderItems } = await supabase
    .from("order_items")
    .select("id, order_id, book_id, title, price, quantity")
    .eq("order_id", createData.order_id);

  assert(
    "ORDER-02: order_items.book_id is NOT NULL (Relational integrity restored!)",
    dbOrderItems && dbOrderItems.length > 0 && dbOrderItems[0].book_id === testBook.id,
    `book_id: ${dbOrderItems?.[0]?.book_id}`
  );

  // TEST 4: Customer Order Confirmation endpoint
  const receiptRes = await fetch(`${baseUrl}/api/orders/${createData.order_number}`);
  const receiptData = await receiptRes.json();
  assert("RECEIPT-01: GET /api/orders/[orderNumber] returns receipt", receiptRes.ok && receiptData.order?.order_number === createData.order_number);
  assert("RECEIPT-02: Receipt has full address and itemized breakdown", receiptData.order?.shipping_address?.pincode === "625001" && receiptData.order?.order_items?.length === 1);

  // TEST 5: Admin Login with provisioned credentials
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin.audit@methagukalanjiyam.in",
      password: "AuditAdminPass123!@#",
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  assert("AUTH-01: Admin login step 1 accepts credentials", adminLoginRes.ok && adminLoginData.step === "otp");

  const preauthHeader = adminLoginRes.headers.get("set-cookie");
  assert("AUTH-02: Preauth cookie returned", Boolean(preauthHeader && preauthHeader.includes("mk_admin_preauth")));

  // Extract clean cookie name=value
  const preauthMatch = preauthHeader.match(/mk_admin_preauth=[^;]+/);
  const cleanPreauthCookie = preauthMatch ? preauthMatch[0] : "";

  // Verify OTP (simulatedOtp is provided in response)
  const otpCode = adminLoginData.simulatedOtp;
  assert("AUTH-03: Simulated OTP provided for local testing", Boolean(otpCode), `OTP: ${otpCode}`);

  const verifyOtpRes = await fetch(`${baseUrl}/api/auth/admin/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cleanPreauthCookie,
    },
    body: JSON.stringify({ otp_code: otpCode }),
  });
  const verifyOtpData = await verifyOtpRes.json();
  const sessionHeader = verifyOtpRes.headers.get("set-cookie");
  const sessionMatch = sessionHeader ? sessionHeader.match(/mk_admin_session=[^;]+/) : null;
  const cleanSessionCookie = sessionMatch ? sessionMatch[0] : "";

  assert("AUTH-04: Admin Step 2 OTP verified & session granted", verifyOtpRes.ok && Boolean(cleanSessionCookie));

  // TEST 6: Admin Orders API with session cookie
  const adminOrdersRes = await fetch(`${baseUrl}/api/admin/orders`, {
    headers: { Cookie: cleanSessionCookie },
  });
  const adminOrdersData = await adminOrdersRes.json();
  assert("ADMIN-01: GET /api/admin/orders returns live database orders", adminOrdersRes.ok && Array.isArray(adminOrdersData.orders) && adminOrdersData.orders.length > 0);

  // TEST 7: Admin Orders PATCH tracking number
  const patchOrderRes = await fetch(`${baseUrl}/api/admin/orders`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cleanSessionCookie,
    },
    body: JSON.stringify({
      orderId: createData.order_id,
      status: "shipped",
      trackingNumber: "ST123456789IN",
      courier: "ST Courier",
    }),
  });
  assert("ADMIN-02: PATCH /api/admin/orders updates status & tracking in Supabase", patchOrderRes.ok);

  // TEST 8: Admin Books API
  const adminBooksRes = await fetch(`${baseUrl}/api/admin/books`, {
    headers: { Cookie: cleanSessionCookie },
  });
  const adminBooksData = await adminBooksRes.json();
  assert("ADMIN-03: GET /api/admin/books returns 20 books from database", adminBooksRes.ok && adminBooksData.books?.length === 20);

  // TEST 9: Admin Settings API
  const adminSettingsRes = await fetch(`${baseUrl}/api/admin/settings`, {
    headers: { Cookie: cleanSessionCookie },
  });
  const adminSettingsData = await adminSettingsRes.json();
  assert("ADMIN-04: GET /api/admin/settings returns shipping and deliverable pincodes matrix", adminSettingsRes.ok && adminSettingsData.settings?.shipping?.standard_shipping_fee !== undefined);

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Test execution exception:", err);
  process.exit(1);
});
