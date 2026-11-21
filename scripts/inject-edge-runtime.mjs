import fs from "fs";
import path from "path";

const files = [
  "src/app/blog/[slug]/page.tsx",
  "src/app/orders/[orderNumber]/page.tsx",
  "src/app/api/admin/articles/route.ts",
  "src/app/api/admin/books/route.ts",
  "src/app/api/admin/erp/queue/route.ts",
  "src/app/api/admin/erp/status/route.ts",
  "src/app/api/admin/erp/sync-books/route.ts",
  "src/app/api/admin/erp/sync-order/route.ts",
  "src/app/api/admin/erp/test-connection/route.ts",
  "src/app/api/admin/orders/route.ts",
  "src/app/api/admin/settings/route.ts",
  "src/app/api/admin/supporters/route.ts",
  "src/app/api/admin/upload-image/route.ts",
  "src/app/api/auth/admin/login/route.ts",
  "src/app/api/auth/admin/logout/route.ts",
  "src/app/api/auth/admin/resend-otp/route.ts",
  "src/app/api/auth/admin/verify-otp/route.ts",
  "src/app/api/auth/login/route.ts",
  "src/app/api/auth/logout/route.ts",
  "src/app/api/auth/resend-verification/route.ts",
  "src/app/api/auth/session/route.ts",
  "src/app/api/auth/signup/route.ts",
  "src/app/api/auth/verify-email/route.ts",
  "src/app/api/health/route.ts",
  "src/app/api/orders/[orderNumber]/route.ts",
  "src/app/api/orders/create/route.ts",
  "src/app/api/orders/my-orders/route.ts",
  "src/app/api/orders/verify/route.ts",
  "src/app/api/webhooks/razorpay/route.ts"
];

let updated = 0;
for (const rel of files) {
  const p = path.resolve(rel);
  if (!fs.existsSync(p)) {
    console.warn("Missing file:", rel);
    continue;
  }
  let content = fs.readFileSync(p, "utf8");
  if (!content.includes("export const runtime")) {
    content = 'export const runtime = "edge";\n\n' + content;
    fs.writeFileSync(p, content, "utf8");
    updated++;
  }
}
console.log("Successfully injected edge runtime into " + updated + " routes.");
