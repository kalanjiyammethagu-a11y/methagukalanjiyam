import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/login", "/admin", "/admin/*"],
      },
    ],
    sitemap: "https://methagukalanjiyam.in/sitemap.xml",
  };
}
