/**
 * Secure Manual Admin Provisioning Script
 * Usage:
 *   npx tsx scripts/create-admin.ts [--overwrite] [--force-production]
 *
 * Credentials can be supplied interactively or via environment variables:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=StrongPassword123! npx tsx scripts/create-admin.ts
 */

import readline from "readline";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match?.[1] !== undefined && match[2] !== undefined) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("placeholder")) {
  console.error("❌ Error: Valid NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const forceProduction = args.includes("--force-production");
const overwrite = args.includes("--overwrite");

// Safety guard: refuse to run against production without explicit flag
const isProduction =
  process.env.NODE_ENV === "production" ||
  supabaseUrl.includes("production") ||
  (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost"));

if (isProduction && !forceProduction) {
  console.error("❌ Refusing to run admin provisioning against PRODUCTION environment without --force-production flag.");
  console.error("   To proceed against production: npx tsx scripts/create-admin.ts --force-production");
  process.exit(1);
}

function askQuestion(query: string, hideInput = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hideInput) {
      process.stdout.write(query);
      const stdin = process.stdin;
      const oldRaw = stdin.isRaw;
      if (stdin.setRawMode) stdin.setRawMode(true);
      stdin.resume();

      let password = "";
      const onData = (char: Buffer) => {
        const str = char.toString("utf8");
        if (str === "\n" || str === "\r" || str === "\u0004") {
          stdin.removeListener("data", onData);
          if (stdin.setRawMode) stdin.setRawMode(oldRaw || false);
          stdin.pause();
          process.stdout.write("\n");
          rl.close();
          resolve(password);
        } else if (str === "\u0003") {
          process.exit(1);
        } else if (str === "\b" || str === "\x7f") {
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          password += str;
          process.stdout.write("*");
        }
      };

      stdin.on("data", onData);
    } else {
      rl.question(query, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

/**
 * Validates admin password strength:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special symbol
 */
function validateAdminPassword(password: string): { valid: boolean; reason?: string } {
  if (password.length < 12) {
    return { valid: false, reason: "Password must be at least 12 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one digit" };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one special character" };
  }
  return { valid: true };
}

async function main() {
  console.log("===============================================================");
  console.log("  METHAGU KALANJIYAM — SECURE MANUAL ADMIN PROVISIONING");
  console.log("===============================================================\n");

  const email = (process.env.ADMIN_EMAIL || (await askQuestion("Enter Administrator Email: "))).trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("❌ Invalid email address format.");
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await askQuestion("Enter Administrator Password (min 12 chars): ", true);
  }

  const passCheck = validateAdminPassword(password);
  if (!passCheck.valid) {
    console.error(`❌ Password does not satisfy admin security requirements: ${passCheck.reason}`);
    process.exit(1);
  }

  const fullName = (process.env.ADMIN_NAME || (await askQuestion("Enter Administrator Full Name: "))).trim() || "களஞ்சிய நிர்வாகி";

  console.log(`\nConnecting to Supabase at ${new URL(supabaseUrl!).hostname}...`);
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Check if user already exists
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Failed to query existing users:", listError.message);
    process.exit(1);
  }

  const existingUser = userList.users.find((u) => u.email?.toLowerCase() === email);

  if (existingUser) {
    if (!overwrite) {
      console.error(`❌ Administrator with email "${email}" already exists (ID: ${existingUser.id}).`);
      console.error("   To reset their credentials and re-assert admin role, run with: --overwrite");
      process.exit(1);
    }

    console.log(`Updating existing administrator (ID: ${existingUser.id})...`);

    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
      user_metadata: { full_name: fullName },
    });

    if (updateError) {
      console.error("❌ Failed to update admin auth account:", updateError.message);
      process.exit(1);
    }

    const { error: profileError } = await (supabase.from("profiles") as any).upsert({
      id: existingUser.id,
      full_name: fullName,
      role: "admin",
      locale: "ta",
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("❌ Failed to update admin profile in database:", profileError.message);
      process.exit(1);
    }

    // Insert audit log
    await (supabase.from("audit_logs") as any).insert({
      user_id: existingUser.id,
      action: "admin_provisioned_overwrite",
      resource_type: "auth",
      resource_id: existingUser.id,
      metadata: { email, provisioned_by: "cli_script" },
    });

    console.log(`\n✅ Administrator "${email}" successfully updated with role: 'admin' and email confirmed.`);
    console.log("   Admin may now sign in at /admin/login using two-step verification.");
    return;
  }

  // Create brand new administrator
  console.log(`Creating new administrator account for "${email}"...`);

  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Marked verified
    app_metadata: { role: "admin" },
    user_metadata: { full_name: fullName },
  });

  if (createError || !createData.user) {
    console.error("❌ Failed to create administrator in auth.users:", createError?.message);
    process.exit(1);
  }

  const newAdminId = createData.user.id;

  const { error: profileError } = await (supabase.from("profiles") as any).upsert({
    id: newAdminId,
    full_name: fullName,
    role: "admin",
    locale: "ta",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error("❌ Failed to create admin profile in database:", profileError.message);
    process.exit(1);
  }

  // Insert audit log
  await (supabase.from("audit_logs") as any).insert({
    user_id: newAdminId,
    action: "admin_provisioned_new",
    resource_type: "auth",
    resource_id: newAdminId,
    metadata: { email, provisioned_by: "cli_script" },
  });

  console.log(`\n✅ Administrator successfully provisioned!`);
  console.log(`   ID:    ${newAdminId}`);
  console.log(`   Email: ${email}`);
  console.log(`   Role:  admin (verified)`);
  console.log(`\nAccess URL: /admin/login (Two-Step Email OTP required)`);
}

main().catch((err) => {
  console.error("Fatal exception during admin provisioning:", err);
  process.exit(1);
});

