import { NextRequest, NextResponse } from "next/server";
import { verifyUserEmailToken } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/verify-email";
    url.searchParams.set("status", "error");
    url.searchParams.set("message", "Missing confirmation token.");
    return NextResponse.redirect(url);
  }

  const result = await verifyUserEmailToken(token);

  const url = req.nextUrl.clone();
  url.pathname = "/verify-email";

  if (!result.success) {
    url.searchParams.set("status", "error");
    url.searchParams.set("message", result.error || "Verification link is invalid or expired.");
    return NextResponse.redirect(url);
  }

  url.searchParams.set("status", "success");
  return NextResponse.redirect(url);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const result = await verifyUserEmailToken(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Invalid or expired token" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email address verified successfully. You may now sign in.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Verification failed", message: error.message },
      { status: 500 }
    );
  }
}

