import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";
import { construireEmailRappel } from "@/lib/email-rappel";
import { envoyerEmailAvecSecours } from "@/lib/envoi-email";

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

  // Ceux qui se sont désabonnés de cette série ne doivent plus jamais
  // réapparaître, quelle que soit la source (historique ou import).
  const { data: desabonnes } = await supabase
    .from("desabonnements_rappels")
    .select("email")
    .eq("event_id", idSerie);
  const emailsDesabonnes = new Set(
    (desabonnes ?? []).map((d: { email: string }) => d.email.toLowerCase())
  );

  const vus = new Map<string, Destinataire>();
  let dejaInscritsExclus = 0;
  const dejaComptes = new Set<string>();

  function ajouter(t: { prenom?: string | null; nom?: string | null; email: string }) {
    const cle = t.email.toLowerCase();
    if (emailsDesabonnes.has(cle)) return;
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
 * Envoie à UN SEUL destinataire et journalise le résultat (succès ou
 * échec) dans rappels_envois. Fonction du bas niveau, réutilisée par
 * l'envoi complet et par le renvoi ciblé aux échecs.
 */
async function envoyerUnDestinataire(
  supabase: SupabaseClient,
  rappel: any,
  event: any,
  dest: Destinataire,
  declencheur: "planifie" | "manuel",
  sujetPropre: string,
  dateAffichee: string
): Promise<boolean> {
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

    // Le module gère lui-même le repli sur Brevo si Resend échoue
    // (quota dépassé, panne...). Il vérifie aussi explicitement le
    // champ "error" de chaque réponse, qui n'est pas toujours signalé
    // par une exception.
    const { ok, erreur: erreurEnvoi, fournisseur } = await envoyerEmailAvecSecours({
      to: dest.email,
      subject: sujetPropre,
      html,
    });

    if (!ok) {
      throw new Error(erreurEnvoi ?? "Envoi refusé par tous les fournisseurs configurés.");
    }

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
    return true;
  } catch (err) {
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
    return false;
  }
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

  // Filet de sécurité : si un sujet a un jour été enregistré avec un
  // préfixe "[TEST]" (par exemple tapé par erreur dans le formulaire),
  // on le retire ici avant tout envoi réel.
  const sujetPropre = rappel.sujet.replace(/^\s*\[TEST\]\s*/i, "");

  let totalEmails = 0;
  let totalEchecs = 0;

  for (const dest of destinataires) {
    const ok = await envoyerUnDestinataire(
      supabase,
      rappel,
      event,
      dest,
      declencheur,
      sujetPropre,
      dateAffichee
    );
    if (ok) totalEmails++;
    else totalEchecs++;
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

/**
 * Renvoie UNIQUEMENT aux destinataires dont la dernière tentative
 * connue a échoué (et qui n'ont jamais reçu ce rappel avec succès) —
 * pratique après un dépassement de quota Resend, sans redoubler les
 * gens qui l'ont déjà bien reçu.
 */
export async function renvoyerEchecsRappel(
  supabase: SupabaseClient,
  rappelId: string,
  declencheur: "planifie" | "manuel" = "manuel"
): Promise<{ emailsEnvoyes: number; echecs: number; aRetenter: number }> {
  const { data: rappel } = await supabase
    .from("rappels_planifies")
    .select("*, event:events(*)")
    .eq("id", rappelId)
    .single();

  if (!rappel) return { emailsEnvoyes: 0, echecs: 0, aRetenter: 0 };

  const eventBrut: any = Array.isArray(rappel.event) ? rappel.event[0] : rappel.event;
  const event = await resoudreEvenementDuRappel(supabase, eventBrut);
  if (!event) return { emailsEnvoyes: 0, echecs: 0, aRetenter: 0 };

  const { data: envois } = await supabase
    .from("rappels_envois")
    .select("destinataire_email, destinataire_nom, statut")
    .eq("rappel_id", rappelId);

  const reussis = new Set<string>();
  const echecs = new Map<string, { prenom: string | null; nom: string | null; email: string }>();

  for (const e of envois ?? []) {
    const cle = e.destinataire_email.toLowerCase();
    if (e.statut === "envoye") reussis.add(cle);
  }
  for (const e of envois ?? []) {
    const cle = e.destinataire_email.toLowerCase();
    if (e.statut === "echec" && !reussis.has(cle) && !echecs.has(cle)) {
      const morceaux = (e.destinataire_nom ?? "").split(" ");
      echecs.set(cle, {
        prenom: morceaux[0] || null,
        nom: morceaux.slice(1).join(" ") || null,
        email: e.destinataire_email,
      });
    }
  }

  const aRetenter = Array.from(echecs.values());
  if (aRetenter.length === 0) {
    return { emailsEnvoyes: 0, echecs: 0, aRetenter: 0 };
  }

  const dateAffichee = new Date(event.date_debut).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sujetPropre = rappel.sujet.replace(/^\s*\[TEST\]\s*/i, "");

  let totalEmails = 0;
  let totalEchecs = 0;

  for (const dest of aRetenter) {
    const ok = await envoyerUnDestinataire(
      supabase,
      rappel,
      event,
      dest,
      declencheur,
      sujetPropre,
      dateAffichee
    );
    if (ok) totalEmails++;
    else totalEchecs++;
  }

  return { emailsEnvoyes: totalEmails, echecs: totalEchecs, aRetenter: aRetenter.length };
}

/**
 * Envoie UNIQUEMENT aux destinataires actuels de la cible du rappel
 * (inscrits ou anciens participants) qui n'ont JAMAIS été contactés
 * pour ce rappel précis, ni avec succès ni en échec — utile après une
 * correction qui élargit la liste des destinataires (ex: historique
 * des billets ajouté après un premier envoi), pour rattraper
 * uniquement les nouveaux venus sans redoubler personne.
 */
export async function envoyerAuxNouveauxRappel(
  supabase: SupabaseClient,
  rappelId: string,
  declencheur: "planifie" | "manuel" = "manuel"
): Promise<{ emailsEnvoyes: number; echecs: number; aContacter: number }> {
  const { data: rappel } = await supabase
    .from("rappels_planifies")
    .select("*, event:events(*)")
    .eq("id", rappelId)
    .single();

  if (!rappel) return { emailsEnvoyes: 0, echecs: 0, aContacter: 0 };

  const eventBrut: any = Array.isArray(rappel.event) ? rappel.event[0] : rappel.event;
  const event = await resoudreEvenementDuRappel(supabase, eventBrut);
  if (!event) return { emailsEnvoyes: 0, echecs: 0, aContacter: 0 };

  const { liste: destinatairesActuels } = await determinerDestinataires(supabase, rappel, event);

  const { data: envois } = await supabase
    .from("rappels_envois")
    .select("destinataire_email")
    .eq("rappel_id", rappelId);

  const dejaContactes = new Set(
    (envois ?? []).map((e: { destinataire_email: string }) => e.destinataire_email.toLowerCase())
  );

  const aContacter = destinatairesActuels.filter(
    (d) => !dejaContactes.has(d.email.toLowerCase())
  );

  if (aContacter.length === 0) {
    return { emailsEnvoyes: 0, echecs: 0, aContacter: 0 };
  }

  const dateAffichee = new Date(event.date_debut).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sujetPropre = rappel.sujet.replace(/^\s*\[TEST\]\s*/i, "");

  let totalEmails = 0;
  let totalEchecs = 0;

  for (const dest of aContacter) {
    const ok = await envoyerUnDestinataire(
      supabase,
      rappel,
      event,
      dest,
      declencheur,
      sujetPropre,
      dateAffichee
    );
    if (ok) totalEmails++;
    else totalEchecs++;
  }

  return { emailsEnvoyes: totalEmails, echecs: totalEchecs, aContacter: aContacter.length };
}
