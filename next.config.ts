import type { NextConfig } from "next";

const supabaseParsed = (() => {
  try {
    const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
    if (!raw || raw.includes("placeholder")) return null;
    const u = new URL(raw);
    const protocol = u.protocol.replace(":", "");
    if (protocol !== "http" && protocol !== "https") return null;
    return {
      protocol: protocol as "http" | "https",
      hostname: u.hostname,
      port: u.port || "",
      origin: u.origin,
    };
  } catch {
    return null;
  }
})();

const supabaseOrigin = supabaseParsed?.origin ?? null;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config) => {
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: "error",
    };
    return config;
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "images.methagukalanjiyam.in",
      },
      {
        protocol: "https",
        hostname: "yxghkhizyjsfrevtekbc.supabase.co",
        pathname: "/**",
      },
      ...(supabaseParsed && supabaseParsed.hostname !== "yxghkhizyjsfrevtekbc.supabase.co"
        ? [
            {
              protocol: supabaseParsed.protocol,
              hostname: supabaseParsed.hostname,
              ...(supabaseParsed.port ? { port: supabaseParsed.port } : {}),
              pathname: "/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
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

      // Images: self + Unsplash + Cloudflare R2 + Supabase + data URIs + blob URIs
      `img-src 'self' https://images.unsplash.com https://*.r2.cloudflarestorage.com https://images.methagukalanjiyam.in https://*.supabase.co${supabaseOrigin ? ` ${supabaseOrigin}` : ""} data: blob:`,

      // Media: self + Supabase Storage (direct uploaded MP4/WebM) + Cloudflare R2 + blob URIs
      `media-src 'self' https://*.supabase.co https://*.r2.cloudflarestorage.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""} blob:`,

      // Connect: self + Supabase (HTTPS & Realtime WSS) + Razorpay API & analytics + Cloudflare Turnstile + dev websockets
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://challenges.cloudflare.com ws: wss:",

      // Frames: Razorpay checkout modal + Cloudflare Turnstile challenge iframe + Video platforms (Odysee, YouTube, Vimeo)
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com https://odysee.com https://*.odysee.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",

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
      // Immutable cache for Next.js static build chunks (Edge + Browser 1 Year)
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Long cache for public images with stale-while-revalidate at Cloudflare Edge
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
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
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=2592000",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=2592000",
          },
        ],
      },
      // Cloudflare Edge Cache for public content pages (accelerates global TTFB via edge cache)
      {
        source: "/(books|videos|blog|supporters|certificate|privacy|terms)(.*)",
        headers: [
          {
            key: "CDN-Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=604800",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // Strict no-cache for sensitive, authenticated, and checkout pages
      {
        source: "/(account|admin|cart|login|signup|verify-email)(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
          {
            key: "CDN-Cache-Control",
            value: "no-store",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "no-store",
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
      // Strict no-cache for all API routes (prevents Cloudflare edge caching of private API transactions)
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
          {
            key: "CDN-Cache-Control",
            value: "no-store",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "no-store",
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
