import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

    const body = await req.json();
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
    } = body;

    if (!full_name || !phone || !house_name || !city || !state || !pincode) {
      return NextResponse.json(
        { error: "Full name, phone, house/building name, city, state, and pincode are required." },
        { status: 400 }
      );
    }

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
        full_name: full_name.trim(),
        phone: phone.trim(),
        house_name: house_name.trim(),
        street: street ? street.trim() : null,
        landmark: landmark ? landmark.trim() : null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
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

    const body = await req.json();
    const { id, is_default, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

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
