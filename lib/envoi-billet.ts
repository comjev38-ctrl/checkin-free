import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import { envoyerEmailAvecSecours } from "@/lib/envoi-email";

export async function construireEtEnvoyerBillet(
  supabase: SupabaseClient,
  ticketId: string
): Promise<{ ok: boolean; skipped?: boolean; erreur?: string }> {
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, prenom, nom, email, code, event:events(titre, slug, date_debut, lieu)")
    .eq("id", ticketId)
    .single();

  if (!ticket || !ticket.email) {
    return { ok: false, skipped: true };
  }

  const event: any = Array.isArray(ticket.event) ? ticket.event[0] : ticket.event;
  const nomComplet = [ticket.prenom, ticket.nom].filter(Boolean).join(" ");
  const urlBillet = `${process.env.NEXT_PUBLIC_SITE_URL}/billet/${ticket.id}`;
  // Une vraie URL d'image plutôt qu'une pièce jointe "cid:" (propre à
  // Resend) ou une data-URI (bloquée par de nombreux clients mail) :
  // fonctionne à l'identique partout, Resend comme Brevo.
  const urlQr = `${process.env.NEXT_PUBLIC_SITE_URL}/api/qr/${ticket.id}`;

  const dateEvenement = new Date(event.date_debut).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  });

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /></head><body style="margin:0; padding:0;">
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
                  ${dateEvenement}${
    event.lieu
      ? `<br><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          event.lieu
        )}" style="color:#5B5FEF; text-decoration:underline;">${event.lieu}</a>`
      : ""
  }
                </div>
                <div style="margin-top:16px; padding-top:14px; border-top:1px solid #E7E4F5;">
                  <span style="font-size:10px; letter-spacing:1px; text-transform:uppercase; color:#6B7280; font-weight:600;">Titulaire</span>
                  <div style="font-size:14px; color:#1E1B39; margin-top:2px;">${nomComplet}</div>
                </div>
              </td>
              <td width="1" style="border-left:1px dashed #E7E4F5;"></td>
              <td width="140" style="padding:20px; text-align:center; vertical-align:middle;">
                <img src="${urlQr}" width="100" height="100" alt="QR code" style="display:block; margin:0 auto;" />
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
      <tr>
        <td style="text-align:center; padding-top:10px; font-size:12px;">
          <a href="${urlBillet}/annuler" style="color:#9CA3AF; text-decoration:underline;">
            Un empêchement ? Annuler ma place
          </a>
        </td>
      </tr>
    </table>
  </div>
</body></html>
  `;

  const { ok, erreur } = await envoyerEmailAvecSecours({
    to: ticket.email,
    subject: `Ton billet — ${event.titre}`,
    html,
  });

  return { ok, erreur };
}
