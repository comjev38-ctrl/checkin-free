import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import TableauInscrits from "./tableau-inscrits";
import RetourAdmin from "@/components/retour-admin";

export const revalidate = 0;

export default async function PageInscrits({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, titre, date_debut, parent_event_id")
    .eq("id", params.id)
    .single();

  if (!event) notFound();

  const estUneSeance = !!event.parent_event_id;
  const libelleDate = new Date(event.date_debut).toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const libelle = estUneSeance ? `${event.titre} — semaine du ${libelleDate}` : event.titre;

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, prenom, nom, email, statut, created_at, checkins(scanned_at)")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <RetourAdmin href="/admin" />
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-indigo">
          Inscrits
        </p>
        <h1 className="mt-1 font-sans text-3xl font-bold text-encre">
          {event.titre}
        </h1>
        {estUneSeance && (
          <p className="mt-1 text-sm capitalize text-sourdine">Semaine du {libelleDate}</p>
        )}

        <TableauInscrits eventId={event.id} eventTitre={libelle} tickets={tickets ?? []} />
      </div>
    </main>
  );
}
