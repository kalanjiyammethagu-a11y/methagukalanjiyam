import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addressSchema } from "@/lib/validators/order";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addressPostSchema = addressSchema.extend({
  country: z.string().trim().max(80).default("India"),
});

const addressPatchSchema = addressPostSchema.partial().extend({
  id: z.string().uuid("Invalid address ID"),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to view addresses." }, { status: 401 });
    }

    const { data: addresses, error } = await (supabase.from("addresses") as any)
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/addresses error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ addresses: addresses || [] });
  } catch (err: any) {
    console.error("GET /api/addresses error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to add an address." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const parsed = addressPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid address data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      label,
      full_name,
      phone,
      house_name,
      street,
      landmark,
      city,
      state,
      pincode,
      country,
      is_default,
    } = parsed.data;

    // If new address is set as default, unset existing default addresses for this user
    if (is_default) {
      await (supabase.from("addresses") as any)
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data: newAddress, error } = await (supabase.from("addresses") as any)
      .insert({
        user_id: user.id,
        label: label || "Home",
        full_name,
        phone,
        house_name,
        street: street || null,
        landmark: landmark || null,
        city,
        state,
        pincode,
        country: country || "India",
        is_default: Boolean(is_default),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("POST /api/addresses error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ address: newAddress, message: "Address saved successfully" }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/addresses error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to update an address." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const parsed = addressPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid address update payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, is_default, ...updates } = parsed.data;

    if (is_default) {
      await (supabase.from("addresses") as any)
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (is_default !== undefined) payload.is_default = Boolean(is_default);
    if (updates.label !== undefined) payload.label = updates.label;
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.house_name !== undefined) payload.house_name = updates.house_name;
    if (updates.street !== undefined) payload.street = updates.street;
    if (updates.landmark !== undefined) payload.landmark = updates.landmark;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.pincode !== undefined) payload.pincode = updates.pincode;
    if (updates.country !== undefined) payload.country = updates.country;

    const { data: updatedAddress, error } = await (supabase.from("addresses") as any)
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("PATCH /api/addresses error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ address: updatedAddress, message: "Address updated successfully" });
  } catch (err: any) {
    console.error("PATCH /api/addresses error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to delete an address." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    const { error } = await (supabase.from("addresses") as any)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("DELETE /api/addresses error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/addresses error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
