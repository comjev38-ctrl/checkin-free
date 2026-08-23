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
    console.warn(
      "RESEND_API_KEY absente sur Vercel : email de billet non envoyé (c'est probablement la cause si aucun email n'arrive)."
    );
    return NextResponse.json({ skipped: true });
  }

  const supabase = createServiceClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, prenom, nom, email, code, event:events(titre, slug, date_debut, lieu)")
    .eq("id", ticketId)
    .single();

  if (!ticket || !ticket.email) {
    return NextResponse.json({ skipped: true });
  }

  const event: any = Array.isArray(ticket.event) ? ticket.event[0] : ticket.event;
  const nomComplet = [ticket.prenom, ticket.nom].filter(Boolean).join(" ");
  const qrDataUrl = await genererQrDataUrl(ticket.code);
  const qrBase64 = qrDataUrl.split(",")[1];
  const urlBillet = `${process.env.NEXT_PUBLIC_SITE_URL}/billet/${ticket.id}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const dateEvenement = new Date(event.date_debut).toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  // Email en table HTML (pas de flexbox : compatibilité Outlook/Gmail),
  // avec le QR intégré directement dans le corps du message via cid:.
  const html = `
  <div style="background:#F6F5FC; padding:32px 16px; font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px; margin:0 auto; border-collapse:collapse;">
      <tr>
        <td style="text-align:center; padding-bottom:20px;">
          <span style="display:inline-block; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#5B5FEF; font-weight:700;">
            Billet confirmé
          </span>
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff; border:1px solid #E7E4F5; border-left:3px solid #5B5FEF; border-radius:16px;">
          <table role="presentation" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="padding:24px; vertical-align:top;">
                <span style="font-size:10px; letter-spacing:1px; text-transform:uppercase; color:#6B7280; font-weight:600;">
                  CheckIn Free
                </span>
                <div style="font-size:20px; font-weight:700; color:#1E1B39; margin:8px 0 14px; line-height:1.3;">
                  ${event.titre}
                </div>
                <div style="font-size:14px; color:#1E1B39; line-height:1.6;">
                  ${dateEvenement}${event.lieu ? `<br>${event.lieu}` : ""}
                </div>
                <div style="margin-top:16px; padding-top:14px; border-top:1px solid #E7E4F5;">
                  <span style="font-size:10px; letter-spacing:1px; text-transform:uppercase; color:#6B7280; font-weight:600;">Titulaire</span>
                  <div style="font-size:14px; color:#1E1B39; margin-top:2px;">${nomComplet}</div>
                </div>
              </td>
              <td width="1" style="border-left:1px dashed #E7E4F5;"></td>
              <td width="140" style="padding:20px; text-align:center; vertical-align:middle;">
                <img src="cid:qr-billet" width="100" height="100" alt="QR code" style="display:block; margin:0 auto;" />
                <div style="margin-top:8px; font-size:10px; letter-spacing:1px; color:#1E1B39; word-break:break-all; font-family:monospace;">
                  ${ticket.code}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="text-align:center; padding-top:24px;">
          <a href="${urlBillet}" style="display:inline-block; background:#5B5FEF; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:12px 24px; border-radius:10px;">
            Voir mon billet en ligne
          </a>
        </td>
      </tr>
      <tr>
        <td style="text-align:center; padding-top:16px; font-size:13px; color:#6B7280;">
          Présente ce QR code — ou le code ci-dessus — à l'entrée.
        </td>
      </tr>
    </table>
  </div>

  `;

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "CheckIn Free <billets@resend.dev>",
      to: ticket.email,
      subject: `Ton billet — ${event.titre}`,
      html,
      attachments: [
        {
          filename: "billet.png",
          content: qrBase64,
          inlineContentId: "qr-billet",
        },
      ],
    });

    if (error) {
      console.error("Resend a refusé l'envoi du billet :", error);
      return NextResponse.json({ sent: false, erreur: error }, { status: 502 });
    }
  } catch (err) {
    console.error("Exception lors de l'envoi du billet via Resend :", err);
    return NextResponse.json({ sent: false }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}
