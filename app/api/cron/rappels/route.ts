import { createServiceClient } from "@/lib/supabase/server";
import { dateISOCourteParis } from "@/lib/fuseau";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Vercel envoie automatiquement ce header pour ses propres appels
  // planifiés si CRON_SECRET est configuré côté Vercel — ça évite
  // que n'importe qui puisse déclencher l'envoi de rappels en
  // devinant l'URL.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ envoyes: 0, message: "RESEND_API_KEY absente." });
  }

  const supabase = createServiceClient();

  // La séance de la semaine d'un événement récurrent n'existe en
  // base que si quelqu'un a visité sa page entre-temps (création à
  // la volée). On la résout donc nous-mêmes ici, pour ne jamais
  // rater un rappel faute de visite.
  const { data: modeles } = await supabase
    .from("events")
    .select("*")
    .eq("recurrence", "hebdomadaire")
    .is("parent_event_id", null)
    .eq("statut", "publie");

  for (const modele of modeles ?? []) {
    try {
      await obtenirOuCreerOccurrence(modele);
    } catch (err) {
      console.error(`Résolution de séance échouée pour ${modele.titre} :`, err);
    }
  }

  const demain = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const demainISO = dateISOCourteParis(demain);

  const { data: evenements } = await supabase
    .from("events")
    .select("id, titre, slug, date_debut, heure_fin, lieu")
    .eq("statut", "publie")
    .eq("rappel_envoye", false);

  const aRappeler = (evenements ?? []).filter(
    (e: { date_debut: string }) => dateISOCourteParis(new Date(e.date_debut)) === demainISO
  );

  if (aRappeler.length === 0) {
    return NextResponse.json({ envoyes: 0, evenements: 0 });
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  let totalEmails = 0;

  for (const event of aRappeler) {
    const { data: tickets } = await supabase
      .from("tickets")
      .select("id, prenom, nom, email")
      .eq("event_id", event.id)
      .neq("statut", "annule")
      .not("email", "is", null);

    const dateAffichee = new Date(event.date_debut).toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    const heureFinAffichee = event.heure_fin
      ? event.heure_fin.slice(0, 5).replace(":", "h")
      : null;

    for (const ticket of tickets ?? []) {
      if (!ticket.email) continue;
      const urlBillet = `${process.env.NEXT_PUBLIC_SITE_URL}/billet/${ticket.id}`;

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "CheckIn Free <billets@resend.dev>",
          to: ticket.email,
          subject: `Rappel — ${event.titre} c'est demain`,
          html: `
            <div style="font-family: -apple-system,'Segoe UI',Helvetica,Arial,sans-serif; max-width: 480px; margin: auto;">
              <p style="text-transform:uppercase; letter-spacing:1px; font-size:11px; color:#5B5FEF; font-weight:700;">
                Rappel
              </p>
              <h1 style="font-size:20px; font-weight:700; color:#1E1B39; margin:4px 0 16px;">${event.titre}</h1>
              <p style="color:#1E1B39;">
                Bonjour ${[ticket.prenom, ticket.nom].filter(Boolean).join(" ")}, petit rappel :
                c'est <strong>demain</strong> !
              </p>
              <p style="color:#1E1B39; text-transform:capitalize;">
                ${dateAffichee}${heureFinAffichee ? ` – ${heureFinAffichee}` : ""}
                ${event.lieu ? `<br>${event.lieu}` : ""}
              </p>
              <p style="margin-top:24px;">
                <a href="${urlBillet}" style="display:inline-block; background:#5B5FEF; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:12px 24px; border-radius:10px;">
                  Voir mon billet
                </a>
              </p>
              <p style="margin-top:20px; font-size:12px;">
                <a href="${urlBillet}/annuler" style="color:#9CA3AF; text-decoration:underline;">
                  Un empêchement ? Annuler ma place
                </a>
              </p>
            </div>
          `,
        });
        totalEmails++;
      } catch (err) {
        console.error(`Rappel non envoyé pour le billet ${ticket.id} :`, err);
      }
    }

    await supabase.from("events").update({ rappel_envoye: true }).eq("id", event.id);
  }

  return NextResponse.json({ envoyes: totalEmails, evenements: aRappeler.length });
}
