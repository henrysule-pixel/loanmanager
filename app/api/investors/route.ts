import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { investorSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/supabase/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("investors").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json();
  const payload = investorSchema.safeParse(raw);
  if (!payload.success) return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  const normalizedPayload = {
    ...payload.data,
    total_returns: payload.data.total_returns ?? payload.data.total_returns_earned,
    total_returns_earned: payload.data.total_returns_earned ?? payload.data.total_returns,
  };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("investors").insert(normalizedPayload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
