import { spawn } from "node:child_process";
import path from "node:path";

const PORT = 3089;
const ADMIN_COOKIE = "mk_admin_session=eyJ1c2VySWQiOiJhZG1pbi0wMSJ9.signature_valid_mock_hmac_hash";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch {
      await sleep(300);
    }
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log("================================================================================");
  console.log(" VERIFYING ADMIN SUPPORTERS / MEMBERS CRUD API");
  console.log("================================================================================\n");

  const nextBin = path.resolve("node_modules/next/dist/bin/next");
  const server = spawn(
    process.execPath,
    [nextBin, "start", "-H", "127.0.0.1", "-p", String(PORT)],
    { stdio: "ignore", env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) } }
  );

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/`);
    console.log("Server ready on port " + PORT + "\n");

    // 1. GET /api/admin/supporters
    console.log("[1/4] Testing GET /api/admin/supporters...");
    const getRes = await fetch(`http://127.0.0.1:${PORT}/api/admin/supporters`, {
      headers: { Cookie: ADMIN_COOKIE },
    });
    const getData = await getRes.json();
    console.log(`      Status: ${getRes.status}, Total supporters returned: ${getData.supporters?.length}`);
    if (getRes.status !== 200 || !Array.isArray(getData.supporters)) {
      throw new Error("GET failed");
    }

    // 2. POST /api/admin/supporters (Create)
    console.log("\n[2/4] Testing POST /api/admin/supporters (Create Member)...");
    const postRes = await fetch(`http://127.0.0.1:${PORT}/api/admin/supporters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ADMIN_COOKIE,
      },
      body: JSON.stringify({
        nameEn: "Kavitha Raman",
        nameTa: "கவிதா ராமன்",
        roleEn: "Archival Research Specialist",
        roleTa: "ஆவண ஆராய்ச்சி நிபுணர்",
        image: "/images/supporters/ajay.webp",
        instagramUrl: "https://www.instagram.com/kavitha_archives",
        whatsappUrl: "https://wa.me/919876543210",
        isActive: true,
      }),
    });
    const postData = await postRes.json();
    console.log(`      Status: ${postRes.status}, Created ID: ${postData.supporter?.id}, Name: ${postData.supporter?.nameEn}`);
    if (postRes.status !== 201 || !postData.supporter?.id) {
      throw new Error("POST failed");
    }
    const createdId = postData.supporter.id;

    // 3. PATCH /api/admin/supporters (Update)
    console.log("\n[3/4] Testing PATCH /api/admin/supporters (Update Member)...");
    const patchRes = await fetch(`http://127.0.0.1:${PORT}/api/admin/supporters`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: ADMIN_COOKIE,
      },
      body: JSON.stringify({
        id: createdId,
        roleEn: "Senior Archival Research Director",
        isActive: false,
      }),
    });
    const patchData = await patchRes.json();
    console.log(`      Status: ${patchRes.status}, Updated Role: ${patchData.supporter?.roleEn}, IsActive: ${patchData.supporter?.isActive}`);
    if (patchRes.status !== 200 || patchData.supporter?.roleEn !== "Senior Archival Research Director") {
      throw new Error("PATCH failed");
    }

    // 4. DELETE /api/admin/supporters (Delete)
    console.log("\n[4/4] Testing DELETE /api/admin/supporters (Delete Member)...");
    const delRes = await fetch(`http://127.0.0.1:${PORT}/api/admin/supporters?id=${createdId}`, {
      method: "DELETE",
      headers: { Cookie: ADMIN_COOKIE },
    });
    const delData = await delRes.json();
    console.log(`      Status: ${delRes.status}, Success: ${delData.success}`);
    if (delRes.status !== 200 || !delData.success) {
      throw new Error("DELETE failed");
    }

    console.log("\n================================================================================");
    console.log(" ALL SUPPORTERS / MEMBERS CRUD TESTS PASSED WITH 100% SUCCESS!");
    console.log("================================================================================\n");

  } finally {
    server.kill();
  }
}

run().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
