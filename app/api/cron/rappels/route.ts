import { createServiceClient } from "@/lib/supabase/server";
import { dateISOCourteParis } from "@/lib/fuseau";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";
import { construireEmailRappel } from "@/lib/email-rappel";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function decalerJours(dateISO: string, jours: number): string {
  const [a, m, j] = dateISO.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  d.setUTCDate(d.getUTCDate() + jours);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  // Vercel envoie automatiquement ce header pour ses propres appels
  // planifiés si CRON_SECRET est configuré côté Vercel — ça évite
  // que n'importe qui puisse déclencher l'envoi en devinant l'URL.
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
  const todayParis = dateISOCourteParis(new Date());

  // La séance de la semaine d'un événement récurrent n'existe en base
  // que si quelqu'un a visité sa page entre-temps (création à la
  // volée). On la résout nous-mêmes ici pour ne jamais rater un envoi
  // faute de visite.
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

  // Rappels actifs, avec l'événement concerné (une séance concrète,
  // jamais un modèle abstrait — d'où le filtre sur date_debut IS NOT NULL
  // qui exclut naturellement les lignes sans date réelle).
  const { data: rappels } = await supabase
    .from("rappels_planifies")
    .select("*, event:events(*)")
    .eq("actif", true);

  if (!rappels || rappels.length === 0) {
    return NextResponse.json({ envoyes: 0, rappelsDeclenches: 0 });
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  let totalEmails = 0;
  let rappelsDeclenches = 0;

  for (const rappel of rappels) {
    let event: any = Array.isArray(rappel.event) ? rappel.event[0] : rappel.event;
    if (!event) continue;

    // Le rappel est rattaché au MODÈLE d'un événement récurrent (pas
    // à la séance d'une semaine précise, qui change chaque semaine) —
    // on résout donc la séance actuelle avant tout calcul, pour que
    // ce même rappel continue de fonctionner semaine après semaine.
    if (event.recurrence === "hebdomadaire" && !event.parent_event_id) {
      if (event.statut !== "publie") continue;
      try {
        event = await obtenirOuCreerOccurrence(event);
      } catch (err) {
        console.error(`Résolution de séance échouée pour le rappel ${rappel.id} :`, err);
        continue;
      }
    }

    if (event.statut !== "publie") continue;

    const dateEvenementParis = dateISOCourteParis(new Date(event.date_debut));
    const dateCible = decalerJours(dateEvenementParis, -rappel.jours_avant);

    if (dateCible !== todayParis) continue;
    if (rappel.derniere_execution_paris === todayParis) continue; // déjà envoyé aujourd'hui

    // ---------- Détermine les destinataires ----------
    let destinataires: { prenom: string | null; nom: string | null; email: string }[] = [];

    if (rappel.cible === "inscrits") {
      const { data: tickets } = await supabase
        .from("tickets")
        .select("prenom, nom, email")
        .eq("event_id", event.id)
        .neq("statut", "annule")
        .not("email", "is", null);
      destinataires = tickets ?? [];
    } else {
      // anciens_participants : emails déjà vus sur une séance passée
      // de la même série, mais pas encore inscrits à celle-ci.
      const idSerie = event.parent_event_id ?? event.id;
      const { data: seances } = await supabase
        .from("events")
        .select("id")
        .or(`id.eq.${idSerie},parent_event_id.eq.${idSerie}`)
        .neq("id", event.id);

      const idsAutresSeances = (seances ?? []).map((s: { id: string }) => s.id);

      const { data: deja } = await supabase
        .from("tickets")
        .select("email")
        .eq("event_id", event.id)
        .not("email", "is", null);
      const emailsDejaInscrits = new Set(
        (deja ?? []).map((t: { email: string }) => t.email.toLowerCase())
      );

      const vus = new Map<string, { prenom: string | null; nom: string | null; email: string }>();

      if (idsAutresSeances.length > 0) {
        const { data: anciens } = await supabase
          .from("tickets")
          .select("prenom, nom, email")
          .in("event_id", idsAutresSeances)
          .neq("statut", "annule")
          .not("email", "is", null);

        for (const t of anciens ?? []) {
          const cle = t.email.toLowerCase();
          if (!emailsDejaInscrits.has(cle) && !vus.has(cle)) vus.set(cle, t);
        }
      }

      // Contacts ajoutés manuellement à la liste des anciens
      // participants (import Excel/CSV en mode "anciens participants",
      // sans billet créé).
      const { data: contactsImportes } = await supabase
        .from("anciens_contacts")
        .select("prenom, nom, email")
        .eq("event_id", idSerie);

      for (const c of contactsImportes ?? []) {
        const cle = c.email.toLowerCase();
        if (!emailsDejaInscrits.has(cle) && !vus.has(cle)) vus.set(cle, c);
      }

      destinataires = Array.from(vus.values());
    }

    if (destinataires.length === 0) {
      await supabase
        .from("rappels_planifies")
        .update({ derniere_execution_paris: todayParis })
        .eq("id", rappel.id);
      rappelsDeclenches++;
      continue;
    }

    const dateAffichee = new Date(event.date_debut).toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    for (const dest of destinataires) {
      try {
        // Pour un rappel "inscrits", le lien d'annulation existe et
        // pointe vers leur billet — pour une invitation à d'anciens
        // participants, ils n'ont pas encore de billet ici, donc pas
        // de lien d'annulation.
        let urlAnnulation: string | null = null;
        let lienBouton = rappel.lien_bouton || `${process.env.NEXT_PUBLIC_SITE_URL}/evenement/${event.slug}`;

        if (rappel.cible === "inscrits") {
          const { data: ticket } = await supabase
            .from("tickets")
            .select("id")
            .eq("event_id", event.id)
            .ilike("email", dest.email)
            .neq("statut", "annule")
            .maybeSingle();
          if (ticket) {
            const urlBillet = `${process.env.NEXT_PUBLIC_SITE_URL}/billet/${ticket.id}`;
            lienBouton = rappel.lien_bouton || urlBillet;
            urlAnnulation = `${urlBillet}/annuler`;
          }
        }

        const html = construireEmailRappel({
          nomExpediteur: rappel.nom_expediteur,
          logoUrl: event.logo_url,
          titreEvenement: event.titre,
          accroche: rappel.accroche,
          description: rappel.description,
          texteBouton: rappel.texte_bouton,
          lienBouton,
          couleurAccent: rappel.couleur_accent,
          dateAffichee,
          lieu: event.lieu,
          prenom: dest.prenom,
          urlAnnulation,
        });

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "CheckIn Free <billets@resend.dev>",
          to: dest.email,
          subject: rappel.sujet,
          html,
        });
        totalEmails++;
      } catch (err) {
        console.error(`Rappel ${rappel.id} non envoyé à ${dest.email} :`, err);
      }
    }

    await supabase
      .from("rappels_planifies")
      .update({ derniere_execution_paris: todayParis })
      .eq("id", rappel.id);
    rappelsDeclenches++;
  }

  return NextResponse.json({ envoyes: totalEmails, rappelsDeclenches });
}
