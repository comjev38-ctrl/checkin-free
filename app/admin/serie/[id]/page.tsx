import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;

export default async function PageHistoriqueSerie({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: modele } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!modele || modele.recurrence !== "hebdomadaire") notFound();

  const { data: seances } = await supabase
    .from("events")
    .select("*, tickets(count)")
    .eq("parent_event_id", modele.id)
    .order("date_debut", { ascending: false });

  const maintenant = new Date();

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
          Historique des séances
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-ink">
          {modele.titre}
        </h1>
        <p className="mt-1 text-sm text-stone">
          Lien public stable : /evenement/{modele.slug} (affiche toujours la
          séance de la semaine en cours)
        </p>

        <div className="mt-8 divide-y divide-line border-t border-line">
          {seances?.length ? (
            seances.map((seance: any) => {
              const estFuture = new Date(seance.date_debut) >= maintenant;
              const nbBillets = seance.tickets?.[0]?.count ?? 0;
              return (
                <div
                  key={seance.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-ink">
                      {new Date(seance.date_debut).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {estFuture && (
                        <span className="ml-2 rounded-full bg-emerald/10 px-2 py-0.5 font-mono text-[10px] uppercase text-emerald">
                          À venir
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-stone">{nbBillets} billet(s)</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-wide">
                    <Link
                      href={`/admin/stats/${seance.id}`}
                      className="text-emerald hover:underline"
                    >
                      Stats
                    </Link>
                    <Link
                      href={`/admin/inscrits/${seance.id}`}
                      className="text-emerald hover:underline"
                    >
                      Inscrits
                    </Link>
                    <Link
                      href={`/admin/scan?event=${seance.id}`}
                      className="text-emerald hover:underline"
                    >
                      Scanner
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-10 text-center text-stone">
              Aucune séance générée pour l&apos;instant — elle se crée
              automatiquement à la première visite de la page publique
              chaque semaine.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
