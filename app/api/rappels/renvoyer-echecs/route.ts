import { createClient, createServiceClient } from "@/lib/supabase/server";
import { renvoyerEchecsRappel } from "@/lib/envoi-rappel";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabaseSession = createClient();
  const {
    data: { user },
  } = await supabaseSession.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { message: "RESEND_API_KEY absente sur Vercel." },
      { status: 400 }
    );
  }

  const { rappelId } = await req.json();
  if (!rappelId) {
    return NextResponse.json({ message: "Rappel requis." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const resultat = await renvoyerEchecsRappel(supabase, rappelId, "manuel");

  return NextResponse.json({ ok: true, ...resultat });
}
