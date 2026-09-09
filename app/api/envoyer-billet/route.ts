import { createServiceClient } from "@/lib/supabase/server";
import { construireEtEnvoyerBillet } from "@/lib/envoi-billet";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { ticketId } = await req.json();
  if (!ticketId) {
    return NextResponse.json({ message: "ticketId requis" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY && !process.env.BREVO_API_KEY) {
    console.warn(
      "Aucun fournisseur d'email configuré (RESEND_API_KEY / BREVO_API_KEY) sur Vercel : email de billet non envoyé."
    );
    return NextResponse.json({ skipped: true });
  }

  const supabase = createServiceClient();
  const { ok, skipped, erreur } = await construireEtEnvoyerBillet(supabase, ticketId);

  if (skipped) {
    return NextResponse.json({ skipped: true });
  }
  if (!ok) {
    console.error("Envoi du billet refusé par tous les fournisseurs configurés :", erreur);
    return NextResponse.json({ sent: false, erreur }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
