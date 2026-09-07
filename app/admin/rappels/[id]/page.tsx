import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RetourAdmin from "@/components/retour-admin";
import GestionRappels from "./gestion-rappels";

export const revalidate = 0;

export default async function PageRappels({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, titre, slug, date_debut, parent_event_id, recurrence")
    .eq("id", params.id)
    .single();

  if (!event) notFound();

  const { data: rappels } = await supabase
    .from("rappels_planifies")
    .select("*")
    .eq("event_id", event.id)
    .order("jours_avant", { ascending: false });

  const faitPartieDuneSerie = !!event.parent_event_id || event.recurrence === "hebdomadaire";

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <RetourAdmin href="/admin" />
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-indigo">
          Rappels &amp; invitations
        </p>
        <h1 className="mt-1 font-sans text-3xl font-bold text-encre">
          {event.titre}
        </h1>

        <div className="mt-3 rounded-lg border border-ambre-clair bg-ambre-clair/40 px-4 py-3 text-sm text-encre">
          Vercel (gratuit) ne permet qu&apos;un seul passage automatique par
          jour, autour de 8h-10h heure de Paris selon la saison. L&apos;heure
          que tu choisis ci-dessous sert à t&apos;organiser, mais
          l&apos;envoi réel se fera à ce passage quotidien, pas exactement à
          l&apos;heure demandée.
        </div>

        <GestionRappels
          eventId={event.id}
          rappelsInitiaux={rappels ?? []}
          autoriserAnciensParticipants={faitPartieDuneSerie}
        />
      </div>
    </main>
  );
}
