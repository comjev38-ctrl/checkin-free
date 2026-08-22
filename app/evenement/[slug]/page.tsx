import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import FormulaireInscription from "./formulaire-inscription";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";
import EntetePublique from "@/components/entete-publique";

export const revalidate = 0;

export default async function PageEvenement({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: brut } = await supabase
    .from("events")
    .select("*")
    .eq("slug", params.slug)
    .in("statut", ["publie", "clos"])
    .single();

  if (!brut) notFound();

  // Modèle récurrent (ex: repas chaud hebdomadaire) : on résout ou
  // crée la séance de la semaine en cours, et c'est elle qu'on
  // affiche — le lien public reste toujours le même d'une semaine
  // à l'autre.
  let event = brut;
  let erreurResolution: string | null = null;
  if (brut.recurrence === "hebdomadaire" && !brut.parent_event_id) {
    try {
      event = await obtenirOuCreerOccurrence(brut);
    } catch (err) {
      console.error("Résolution de séance récurrente échouée :", err);
      erreurResolution =
        "Un souci technique empêche l'affichage de la séance de cette semaine. Réessaie dans un instant.";
    }
  }

  if (erreurResolution) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="max-w-sm text-center">
          <p className="font-display text-2xl italic text-ink">{brut.titre}</p>
          <p className="mt-4 text-stone">{erreurResolution}</p>
        </div>
      </main>
    );
  }

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

  const heureFinAffichee = event.heure_fin
    ? event.heure_fin.slice(0, 5).replace(":", "h")
    : null;

  return (
    <main className="min-h-screen bg-paper">
      <EntetePublique retour={{ href: "/", label: "CheckIn Free" }} />

      {event.image_url && (
        <div className="relative aspect-[16/5] max-h-[420px] w-full">
          <Image
            src={event.image_url}
            alt={event.titre}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        </div>
      )}

      {event.logo_url && (
        <div
          className={`mx-auto max-w-2xl px-6 ${
            event.image_url ? "-mt-10 sm:-mt-12" : "pt-10"
          }`}
        >
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-paper bg-white shadow-md sm:h-24 sm:w-24">
            <Image src={event.logo_url} alt="" fill className="object-cover" />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet">
          {event.parent_event_id
            ? "Rendez-vous hebdomadaire · cette semaine"
            : event.statut === "publie"
            ? "Inscription ouverte"
            : ""}
        </p>
        <h1 className="mt-3 font-display text-4xl italic text-ink sm:text-5xl">
          {event.titre}
        </h1>

        <dl className="mt-6 space-y-2 border-l-2 border-violet/40 pl-4 text-ink">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-mono text-xs uppercase text-stone">
              Quand
            </dt>
            <dd className="capitalize">
              {dateEvenement}
              {heureFinAffichee && <> – {heureFinAffichee}</>}
            </dd>
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
