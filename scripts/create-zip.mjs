import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const zipName = "delivery-enterprise-upgrade.zip";
if (fs.existsSync(zipName)) {
  fs.unlinkSync(zipName);
}

const items = [
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "CLOUDFLARE-SETUP.md",
  "robots.txt",
  "supabase",
  "src",
  "scripts",
  "screenshots",
];

const psCmd = `powershell -NoProfile -Command "$ProgressPreference = 'SilentlyContinue'; Compress-Archive -Path ${items.join(', ')} -DestinationPath '${zipName}' -Force"`;
console.log("Running:", psCmd);
execSync(psCmd, { stdio: "inherit" });

const stats = fs.statSync(zipName);
console.log(`Successfully created ${zipName} (${(stats.size / 1024).toFixed(1)} KB)`);
