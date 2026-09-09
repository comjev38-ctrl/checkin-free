import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RetourAdmin from "@/components/retour-admin";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";
import ListeContacts from "./liste-contacts";

export const revalidate = 0;

export default async function PageContactsRappels({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!event) notFound();

  // "id" est toujours le MODÈLE pour un événement récurrent (voir
  // gestion des rappels) — on résout la séance actuelle pour lister
  // les vrais inscrits, mais les anciens contacts restent rattachés
  // au modèle directement.
  let seanceActuelle = event;
  if (event.recurrence === "hebdomadaire" && !event.parent_event_id) {
    try {
      seanceActuelle = await obtenirOuCreerOccurrence(event);
    } catch {
      seanceActuelle = event;
    }
  }

  const { data: inscrits } = await supabase
    .from("tickets")
    .select("id, prenom, nom, email, statut, created_at")
    .eq("event_id", seanceActuelle.id)
    .neq("statut", "annule")
    .order("created_at", { ascending: false });

  const emailsDejaInscrits = new Set(
    (inscrits ?? [])
      .map((t) => t.email?.toLowerCase())
      .filter((e): e is string => !!e)
  );

  // ---------- "Anciens participants" : deux sources combinées ----------
  // 1) Contacts importés manuellement (table dédiée).
  const { data: contactsImportes } = await supabase
    .from("anciens_contacts")
    .select("id, prenom, nom, email, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  // 2) Historique réel des billets sur les séances passées de la
  //    série — c'est cette source qui manquait sur cette page (elle
  //    est bien utilisée à l'envoi, mais n'était jamais affichée ici).
  const { data: autresSeances } = await supabase
    .from("events")
    .select("id")
    .or(`id.eq.${event.id},parent_event_id.eq.${event.id}`)
    .neq("id", seanceActuelle.id);

  const idsAutresSeances = (autresSeances ?? []).map((s) => s.id);

  let ticketsHistorique: { prenom: string | null; nom: string; email: string | null; created_at: string }[] = [];
  if (idsAutresSeances.length > 0) {
    const { data } = await supabase
      .from("tickets")
      .select("prenom, nom, email, created_at")
      .in("event_id", idsAutresSeances)
      .neq("statut", "annule")
      .not("email", "is", null);
    ticketsHistorique = data ?? [];
  }

  // Fusion des deux sources, dédupliquée par email, avec l'origine et
  // le statut "déjà inscrit" affichés pour chaque personne.
  type AncienParticipant = {
    id: string;
    prenom: string | null;
    nom: string | null;
    email: string;
    created_at: string;
    source: "import" | "historique";
    dejaInscrit: boolean;
  };

  const fusionnes = new Map<string, AncienParticipant>();

  for (const t of ticketsHistorique) {
    if (!t.email) continue;
    const cle = t.email.toLowerCase();
    if (!fusionnes.has(cle)) {
      fusionnes.set(cle, {
        id: `hist-${cle}`,
        prenom: t.prenom,
        nom: t.nom,
        email: t.email,
        created_at: t.created_at,
        source: "historique",
        dejaInscrit: emailsDejaInscrits.has(cle),
      });
    }
  }
  for (const c of contactsImportes ?? []) {
    const cle = c.email.toLowerCase();
    if (!fusionnes.has(cle)) {
      fusionnes.set(cle, {
        id: c.id,
        prenom: c.prenom,
        nom: c.nom,
        email: c.email,
        created_at: c.created_at,
        source: "import",
        dejaInscrit: emailsDejaInscrits.has(cle),
      });
    }
  }

  const anciensParticipants = Array.from(fusionnes.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <RetourAdmin href={`/admin/rappels/${event.id}`} label="Rappels & invitations" />
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-indigo">
          Contacts
        </p>
        <h1 className="mt-1 font-sans text-3xl font-bold text-encre">
          {event.titre}
        </h1>

        <ListeContacts
          anciensParticipants={anciensParticipants}
          inscrits={inscrits ?? []}
        />
      </div>
    </main>
  );
}
