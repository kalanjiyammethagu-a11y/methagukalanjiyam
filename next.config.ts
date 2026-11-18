import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async headers() {
    // Content-Security-Policy directives
    const cspDirectives = [
      // Default: only self
      "default-src 'self'",

      // Scripts: self + 'unsafe-inline' + 'unsafe-eval' (required by Next.js for RSC hydration & Suspense replacement) + Razorpay + Cloudflare Turnstile
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://challenges.cloudflare.com",

      // Styles: self + Google Fonts + 'unsafe-inline' (required by Tailwind CSS)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

      // Fonts: self + Google Fonts static CDN + data URIs
      "font-src 'self' https://fonts.gstatic.com data:",

      // Images: self + Unsplash + data URIs + blob URIs
      "img-src 'self' https://images.unsplash.com data: blob:",

      // Connect: self + Supabase (HTTPS & Realtime WSS) + Razorpay API & analytics + Cloudflare Turnstile + dev websockets
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://challenges.cloudflare.com ws: wss:",

      // Frames: Razorpay checkout modal + Cloudflare Turnstile challenge iframe
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com",

      // Frame ancestors: none (prevents clickjacking, equivalent to X-Frame-Options: DENY)
      "frame-ancestors 'none'",

      // Form actions: self + WhatsApp checkout/chat endpoints
      "form-action 'self' https://*.whatsapp.com https://wa.me",

      // Base URI: self
      "base-uri 'self'",

      // Object: none (disallow Flash, Java applets, plugins)
      "object-src 'none'",

      // Upgrade insecure requests in production
      "upgrade-insecure-requests",
    ];

    const cspHeader = cspDirectives.join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      // Immutable cache for Next.js static build chunks
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Long cache for public images with stale-while-revalidate
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // Cache public static assets (favicons, icons, fonts)
      {
        source: "/:path*.(ico|svg|png|jpg|jpeg|gif|webp|avif|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // Strict no-cache for sensitive, authenticated, and checkout pages
      {
        source: "/(account|admin|cart|login)(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
          {
            key: "Vary",
            value: "Cookie, Authorization, Accept-Encoding",
          },
        ],
      },
      // Strict no-cache for all API routes
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/articles",
        destination: "/blog",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
