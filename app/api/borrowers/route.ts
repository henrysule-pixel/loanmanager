import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { borrowerSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/supabase/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("borrowers").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json();
  const payload = borrowerSchema.safeParse(raw);
  if (!payload.success) return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  const normalizedPayload = {
    ...payload.data,
    phone: payload.data.phone ?? payload.data.phone_number,
    phone_number: payload.data.phone_number ?? payload.data.phone,
    government_id: payload.data.government_id ?? payload.data.government_id_number,
    government_id_number: payload.data.government_id_number ?? payload.data.government_id,
  };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("borrowers").insert(normalizedPayload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
