import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Parameters<typeof cookieStore.set>[2];
          }>
        ) {
          try {
            const isProduction = process.env.NODE_ENV === "production";
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                path: options?.path || "/",
                sameSite: (options?.sameSite as any) || "lax",
                httpOnly: options?.httpOnly ?? true,
                secure: isProduction,
              })
            );
          } catch {
            // Handled in Server Components where cookies cannot be set directly
          }
        },
      },
    }
  );
}
