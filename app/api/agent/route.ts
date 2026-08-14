import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { upsertVapiAssistant } from "@/lib/vapi";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile?.org_id) return NextResponse.json({ error: "No org found" }, { status: 400 });

  const body = await req.json();

  // Existing assistant id, if this agent was already created
  let existingAssistantId: string | null = null;
  if (body.id) {
    const { data: existing } = await supabase
      .from("agents").select("vapi_assistant_id").eq("id", body.id).single();
    existingAssistantId = existing?.vapi_assistant_id ?? null;
  }

  const webhookUrl = `${req.nextUrl.origin}/api/vapi/webhook`;

  let assistant;
  try {
    assistant = await upsertVapiAssistant(
      {
        vapi_assistant_id: existingAssistantId,
        name: "Receptionist",
        business_name: body.business_name,
        greeting: body.greeting,
        voice: body.voice,
        knowledge: body.knowledge
      },
      webhookUrl
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }

  const row = {
    org_id: profile.org_id,
    vapi_assistant_id: assistant.id ?? existingAssistantId,
    name: "Receptionist",
    business_name: body.business_name,
    greeting: body.greeting,
    voice: body.voice,
    knowledge: body.knowledge,
    phone_number: body.phone_number,
    updated_at: new Date().toISOString()
  };

  const query = body.id
    ? supabase.from("agents").update(row).eq("id", body.id).select().single()
    : supabase.from("agents").insert(row).select().single();

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
