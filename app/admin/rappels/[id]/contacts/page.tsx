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

  const { data: anciensContacts } = await supabase
    .from("anciens_contacts")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const { data: inscrits } = await supabase
    .from("tickets")
    .select("id, prenom, nom, email, statut, created_at")
    .eq("event_id", seanceActuelle.id)
    .neq("statut", "annule")
    .order("created_at", { ascending: false });

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
          anciensContacts={anciensContacts ?? []}
          inscrits={inscrits ?? []}
        />
      </div>
    </main>
  );
}
