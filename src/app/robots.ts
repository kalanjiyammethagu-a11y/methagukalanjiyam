import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/login",
          "/signup",
          "/admin",
          "/admin/*",
          "/cart",
          "/orders/*",
          "/api/*",
          "/verify-email",
        ],
      },
    ],
    sitemap: "https://methagukalanjiyam.in/sitemap.xml",
  };
}
