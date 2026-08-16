import { createServiceClient } from "@/lib/supabase/server";
import { genererQrDataUrl } from "@/lib/qrcode";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { ticketId } = await req.json();
  if (!ticketId) {
    return NextResponse.json({ message: "ticketId requis" }, { status: 400 });
  }

  // Optionnel : si aucune clé Resend n'est configurée, on ne bloque
  // pas l'inscription — la page de confirmation avec QR suffit.
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: true });
  }

  const supabase = createServiceClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("nom, email, code, event:events(titre, date_debut, lieu)")
    .eq("id", ticketId)
    .single();

  if (!ticket || !ticket.email) {
    return NextResponse.json({ skipped: true });
  }

  const event: any = Array.isArray(ticket.event) ? ticket.event[0] : ticket.event;
  const qrDataUrl = await genererQrDataUrl(ticket.code);
  const qrBase64 = qrDataUrl.split(",")[1];

  const resend = new Resend(process.env.RESEND_API_KEY);
  const dateEvenement = new Date(event.date_debut).toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "CheckIn Free <billets@resend.dev>",
    to: ticket.email,
    subject: `Ton billet — ${event.titre}`,
    attachments: [
      { filename: "billet.png", content: qrBase64 },
    ],
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <p style="text-transform:uppercase; letter-spacing:0.1em; font-size:11px; color:#1B7A5B;">Billet confirmé</p>
        <h1 style="font-size:22px; margin:4px 0 16px;">${event.titre}</h1>
        <p>${dateEvenement}${event.lieu ? ` — ${event.lieu}` : ""}</p>
        <p>Titulaire : <strong>${ticket.nom}</strong></p>
        <p>Code billet : <strong>${ticket.code}</strong></p>
        <p>Ton QR code est en pièce jointe. Présente-le à l'entrée.</p>
      </div>
    `,
  });

  return NextResponse.json({ sent: true });
}
