import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import TableauInscrits from "./tableau-inscrits";

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
        <Link
          href="/admin"
          className="font-mono text-xs uppercase tracking-wide text-stone hover:text-ink hover:underline"
        >
          ← Mes événements
        </Link>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-emerald">
          Inscrits
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-ink">
          {event.titre}
        </h1>
        {estUneSeance && (
          <p className="mt-1 text-sm capitalize text-stone">Semaine du {libelleDate}</p>
        )}

        <TableauInscrits eventTitre={libelle} tickets={tickets ?? []} />
      </div>
    </main>
  );
}
