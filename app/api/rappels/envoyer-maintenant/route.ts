import { createClient, createServiceClient } from "@/lib/supabase/server";
import { dateISOCourteParis } from "@/lib/fuseau";
import { envoyerRappelMaintenant } from "@/lib/envoi-rappel";
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

  const { data: rappel } = await supabase
    .from("rappels_planifies")
    .select("*, event:events(*)")
    .eq("id", rappelId)
    .single();

  if (!rappel) {
    return NextResponse.json({ message: "Rappel introuvable." }, { status: 404 });
  }

  const eventBrut: any = Array.isArray(rappel.event) ? rappel.event[0] : rappel.event;
  if (!eventBrut) {
    return NextResponse.json({ message: "Événement introuvable." }, { status: 404 });
  }

  const todayParis = dateISOCourteParis(new Date());
  const { emailsEnvoyes, destinataires } = await envoyerRappelMaintenant(
    supabase,
    rappel,
    eventBrut,
    todayParis,
    "manuel"
  );

  return NextResponse.json({ ok: true, emailsEnvoyes, destinataires });
}
