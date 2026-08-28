import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import RetourAdmin from "@/components/retour-admin";

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
        <RetourAdmin href="/admin" />
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-indigo">
          Historique des séances
        </p>
        <h1 className="mt-1 font-sans text-3xl font-bold text-encre">
          {modele.titre}
        </h1>
        <p className="mt-1 text-sm text-sourdine">
          Lien public stable : /evenement/{modele.slug} (affiche toujours la
          séance de la semaine en cours)
        </p>

        <div className="mt-8 divide-y divide-ligne border-t border-ligne">
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
                    <p className="text-encre">
                      {new Date(seance.date_debut).toLocaleDateString("fr-FR", {
                        timeZone: "Europe/Paris",
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {estFuture && (
                        <span className="ml-2 rounded-full bg-vert/10 px-2 py-0.5 text-[10px] uppercase text-vert">
                          À venir
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-sourdine">{nbBillets} billet(s)</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs uppercase tracking-wide">
                    <Link
                      href={`/admin/stats/${seance.id}`}
                      className="text-vert hover:underline"
                    >
                      Stats
                    </Link>
                    <Link
                      href={`/admin/inscrits/${seance.id}`}
                      className="text-vert hover:underline"
                    >
                      Inscrits
                    </Link>
                    <Link
                      href={`/admin/scan?event=${seance.id}`}
                      className="text-vert hover:underline"
                    >
                      Scanner
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-10 text-center text-sourdine">
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
