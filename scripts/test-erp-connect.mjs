async function main() {
  try {
    const res = await fetch("https://erp.methagukalanjiyam.in/");
    console.log("Status:", res.status, res.statusText);
    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    console.log("Title:", titleMatch ? titleMatch[1] : "No title");
    
    // Check for cloudflare error code
    const errMatch = html.match(/Error\s+([0-9]{4})/i) || html.match(/class="error-code"[^>]*>([^<]+)/i);
    console.log("Error code:", errMatch ? errMatch[0] : "None");

    // Look for error description
    const descMatch = html.match(/<p class="inline-block"[^>]*>([^<]+)<\/p>/i) || html.match(/<h2[^>]*>([^<]+)<\/h2>/i);
    console.log("Description:", descMatch ? descMatch[1] : "None");
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
main();
