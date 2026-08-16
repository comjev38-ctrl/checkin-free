import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import FormulaireInscription from "./formulaire-inscription";

export const revalidate = 0;

export default async function PageEvenement({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", params.slug)
    .in("statut", ["publie", "clos"])
    .single();

  if (!event) notFound();

  const { count: placesReservees } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id)
    .neq("statut", "annule");

  const complet =
    event.capacite_max != null && (placesReservees ?? 0) >= event.capacite_max;

  const dateEvenement = new Date(event.date_debut).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-paper">
      {event.image_url && (
        <div className="relative h-64 w-full sm:h-80">
          <Image
            src={event.image_url}
            alt={event.titre}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
          {event.statut === "publie" ? "Inscription ouverte" : ""}
        </p>
        <h1 className="mt-3 font-display text-4xl italic text-ink sm:text-5xl">
          {event.titre}
        </h1>

        <dl className="mt-6 space-y-2 border-l-2 border-line pl-4 text-ink">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-mono text-xs uppercase text-stone">
              Quand
            </dt>
            <dd className="capitalize">{dateEvenement}</dd>
          </div>
          {event.lieu && (
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-mono text-xs uppercase text-stone">
                Où
              </dt>
              <dd>{event.lieu}</dd>
            </div>
          )}
        </dl>

        {event.description && (
          <p className="mt-8 whitespace-pre-line leading-relaxed text-ink/80">
            {event.description}
          </p>
        )}

        <div className="mt-10 border-t border-line pt-8">
          {event.statut === "clos" ? (
            <div className="rounded-lg border border-line bg-stone/5 px-5 py-4 text-stone">
              Les inscriptions à cet événement sont closes.
            </div>
          ) : complet ? (
            <div className="rounded-lg border border-rose/30 bg-rose/5 px-5 py-4 text-rose">
              Cet événement est complet. Les inscriptions sont closes.
            </div>
          ) : (
            <FormulaireInscription eventId={event.id} slug={params.slug} />
          )}
        </div>
      </div>
    </main>
  );
}
