import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";
import { construireEmailRappel } from "@/lib/email-rappel";

type Destinataire = { prenom: string | null; nom: string | null; email: string };

/**
 * Résout l'événement RÉEL (une séance concrète) auquel se rattache un
 * rappel — pour un événement récurrent, le rappel est toujours
 * rattaché au modèle (voir migration 13/14), donc on résout la
 * séance de la semaine avant tout envoi.
 */
export async function resoudreEvenementDuRappel(
  supabase: SupabaseClient,
  eventBrut: any
): Promise<any | null> {
  let event = eventBrut;
  if (event.recurrence === "hebdomadaire" && !event.parent_event_id) {
    if (event.statut !== "publie") return null;
    event = await obtenirOuCreerOccurrence(event);
  }
  if (event.statut !== "publie") return null;
  return event;
}

async function determinerDestinataires(
  supabase: SupabaseClient,
  rappel: any,
  event: any
): Promise<{ liste: Destinataire[]; dejaInscritsExclus: number }> {
  if (rappel.cible === "inscrits") {
    const { data: tickets } = await supabase
      .from("tickets")
      .select("prenom, nom, email")
      .eq("event_id", event.id)
      .neq("statut", "annule")
      .not("email", "is", null);
    return { liste: tickets ?? [], dejaInscritsExclus: 0 };
  }

  // anciens_participants : emails déjà vus sur une séance passée de
  // la même série, plus les contacts importés manuellement, moins
  // ceux déjà inscrits à la séance actuelle (volontaire : on ne
  // relance pas quelqu'un déjà venu pour cette séance-ci).
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

  const vus = new Map<string, Destinataire>();
  let dejaInscritsExclus = 0;
  const dejaComptes = new Set<string>();

  function ajouter(t: { prenom?: string | null; nom?: string | null; email: string }) {
    const cle = t.email.toLowerCase();
    if (emailsDejaInscrits.has(cle)) {
      if (!dejaComptes.has(cle)) {
        dejaComptes.add(cle);
        dejaInscritsExclus++;
      }
      return;
    }
    if (!vus.has(cle)) vus.set(cle, { prenom: t.prenom ?? null, nom: t.nom ?? null, email: t.email });
  }

  if (idsAutresSeances.length > 0) {
    const { data: anciens } = await supabase
      .from("tickets")
      .select("prenom, nom, email")
      .in("event_id", idsAutresSeances)
      .neq("statut", "annule")
      .not("email", "is", null);

    for (const t of anciens ?? []) ajouter(t);
  }

  const { data: contactsImportes } = await supabase
    .from("anciens_contacts")
    .select("prenom, nom, email")
    .eq("event_id", idSerie);

  for (const c of contactsImportes ?? []) ajouter(c);

  return { liste: Array.from(vus.values()), dejaInscritsExclus };
}

/**
 * Envoie effectivement un rappel/invitation à tous ses destinataires,
 * et marque la date d'exécution du jour (Europe/Paris) pour éviter un
 * double envoi si la tâche planifiée tourne aussi le même jour.
 */
export async function envoyerRappelMaintenant(
  supabase: SupabaseClient,
  rappel: any,
  eventBrut: any,
  todayParis: string,
  declencheur: "planifie" | "manuel" = "planifie"
): Promise<{
  emailsEnvoyes: number;
  echecs: number;
  destinataires: number;
  dejaInscritsExclus: number;
}> {
  const event = await resoudreEvenementDuRappel(supabase, eventBrut);
  if (!event) return { emailsEnvoyes: 0, echecs: 0, destinataires: 0, dejaInscritsExclus: 0 };

  const { liste: destinataires, dejaInscritsExclus } = await determinerDestinataires(
    supabase,
    rappel,
    event
  );

  if (destinataires.length === 0) {
    await supabase
      .from("rappels_planifies")
      .update({ derniere_execution_paris: todayParis })
      .eq("id", rappel.id);
    return { emailsEnvoyes: 0, echecs: 0, destinataires: 0, dejaInscritsExclus };
  }

  const dateAffichee = new Date(event.date_debut).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  let totalEmails = 0;
  let totalEchecs = 0;

  for (const dest of destinataires) {
    try {
      let urlAnnulation: string | null = null;
      let lienBouton =
        rappel.lien_bouton || `${process.env.NEXT_PUBLIC_SITE_URL}/evenement/${event.slug}`;

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

      // Important : Resend ne lève pas toujours une exception en cas
      // de refus (email invalide, domaine non vérifié...), il renvoie
      // un champ "error" dans sa réponse — sans cette vérification
      // explicite, un envoi refusé pouvait être compté comme réussi.
      const { error: erreurResend } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "CheckIn Free <billets@resend.dev>",
        to: dest.email,
        subject: rappel.sujet,
        html,
      });

      if (erreurResend) {
        throw new Error(erreurResend.message ?? "Resend a refusé l'envoi.");
      }

      totalEmails++;
      const { error: erreurJournal } = await supabase.from("rappels_envois").insert({
        rappel_id: rappel.id,
        destinataire_email: dest.email,
        destinataire_nom: [dest.prenom, dest.nom].filter(Boolean).join(" ") || null,
        statut: "envoye",
        declencheur,
      });
      if (erreurJournal) {
        console.error(
          `Email envoyé à ${dest.email} mais le suivi n'a pas pu être enregistré (la table rappels_envois existe-t-elle ? voir migration 16) :`,
          erreurJournal
        );
      }
    } catch (err) {
      totalEchecs++;
      console.error(`Rappel ${rappel.id} non envoyé à ${dest.email} :`, err);
      const { error: erreurJournal } = await supabase.from("rappels_envois").insert({
        rappel_id: rappel.id,
        destinataire_email: dest.email,
        destinataire_nom: [dest.prenom, dest.nom].filter(Boolean).join(" ") || null,
        statut: "echec",
        declencheur,
        erreur: err instanceof Error ? err.message : "Erreur inconnue",
      });
      if (erreurJournal) {
        console.error("Échec ET impossible d'enregistrer le suivi de l'échec :", erreurJournal);
      }
    }
  }

  await supabase
    .from("rappels_planifies")
    .update({ derniere_execution_paris: todayParis })
    .eq("id", rappel.id);

  return {
    emailsEnvoyes: totalEmails,
    echecs: totalEchecs,
    destinataires: destinataires.length,
    dejaInscritsExclus,
  };
}
