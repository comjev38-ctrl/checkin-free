import { createClient, createServiceClient } from "@/lib/supabase/server";
import { construireEtEnvoyerBillet } from "@/lib/envoi-billet";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabaseSession = createClient();
  const {
    data: { user },
  } = await supabaseSession.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY && !process.env.BREVO_API_KEY) {
    return NextResponse.json(
      { message: "Aucun fournisseur d'email configuré (RESEND_API_KEY ou BREVO_API_KEY) sur Vercel." },
      { status: 400 }
    );
  }

  const { eventId } = await req.json();
  if (!eventId) {
    return NextResponse.json({ message: "Événement requis." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, email")
    .eq("event_id", eventId)
    .neq("statut", "annule")
    .not("email", "is", null);

  if (!tickets || tickets.length === 0) {
    return NextResponse.json({ envoyes: 0, echecs: 0, total: 0 });
  }

  let envoyes = 0;
  let echecs = 0;

  for (const t of tickets) {
    const { ok, skipped } = await construireEtEnvoyerBillet(supabase, t.id);
    if (skipped) continue;
    if (ok) envoyes++;
    else echecs++;
  }

  return NextResponse.json({ envoyes, echecs, total: tickets.length });
}
