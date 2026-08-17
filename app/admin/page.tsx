import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import BoutonSupprimerEvenement from "./bouton-supprimer-evenement";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";

export const revalidate = 0;

export default async function TableauDeBordAdmin() {
  const supabase = createClient();

  // On ne liste que les événements "racine" : ponctuels, ou modèles
  // récurrents. Les séances individuelles (enfants) sont accessibles
  // via l'historique de leur modèle, pas ici — sinon 52 lignes par an
  // pour un seul événement hebdomadaire.
  const { data: events } = await supabase
    .from("events")
    .select("*, tickets(count)")
    .is("parent_event_id", null)
    .order("date_debut", { ascending: true });

  // Pour chaque modèle récurrent, on résout (et crée si besoin) la
  // séance de la semaine, pour pouvoir proposer Scanner/Inscrits/Stats
  // qui pointent directement dessus depuis le tableau de bord.
  const evenementsAvecSeance = await Promise.all(
    (events ?? []).map(async (event: any) => {
      if (event.recurrence === "hebdomadaire") {
        try {
          const seance = await obtenirOuCreerOccurrence(event);
          return { ...event, seanceActuelle: seance };
        } catch {
          return { ...event, seanceActuelle: null };
        }
      }
      return event;
    })
  );

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
              Espace organisateur
            </p>
            <h1 className="mt-1 font-display text-3xl italic text-ink">
              Mes événements
            </h1>
          </div>
          <Link
            href="/admin/creer"
            className="inline-block rounded-md bg-ink px-4 py-2 text-center text-sm font-medium text-paper hover:bg-ink/90"
          >
            + Nouvel événement
          </Link>
        </div>

        <div className="mt-8 divide-y divide-line border-t border-line">
          {evenementsAvecSeance.length ? (
            evenementsAvecSeance.map((event: any) => {
              const recurrent = event.recurrence === "hebdomadaire";
              const seance = event.seanceActuelle;
              const idPourActions = recurrent ? seance?.id : event.id;
              const JOURS = [
                "",
                "lundi",
                "mardi",
                "mercredi",
                "jeudi",
                "vendredi",
                "samedi",
                "dimanche",
              ];

              return (
                <div
                  key={event.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="flex items-center gap-2 font-display text-lg text-ink">
                      {event.titre}
                      {recurrent && (
                        <span className="rounded-full bg-emerald/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-emerald">
                          Hebdomadaire
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-stone">
                      {recurrent ? (
                        <>
                          Tous les {JOURS[event.jour_semaine]} à{" "}
                          {event.heure_debut?.slice(0, 5)}
                          {seance && (
                            <>
                              {" "}
                              · prochaine séance{" "}
                              {new Date(seance.date_debut).toLocaleDateString("fr-FR", {
                                dateStyle: "long",
                              })}{" "}
                              · {seance.tickets?.[0]?.count ?? "…"} billet(s)
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {new Date(event.date_debut).toLocaleDateString("fr-FR", {
                            dateStyle: "long",
                          })}{" "}
                          ·{" "}
                          <span
                            className={
                              event.statut === "publie" ? "text-emerald" : "text-amber"
                            }
                          >
                            {event.statut}
                          </span>{" "}
                          · {event.tickets?.[0]?.count ?? 0} billet(s)
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-wide">
                    {idPourActions && (
                      <>
                        <Link
                          href={`/admin/stats/${idPourActions}`}
                          className="text-emerald hover:underline"
                        >
                          Stats
                        </Link>
                        <Link
                          href={`/admin/inscrits/${idPourActions}`}
                          className="text-emerald hover:underline"
                        >
                          Inscrits
                        </Link>
                        <Link
                          href={`/admin/scan?event=${idPourActions}`}
                          className="text-emerald hover:underline"
                        >
                          Scanner
                        </Link>
                      </>
                    )}
                    {recurrent && (
                      <Link
                        href={`/admin/serie/${event.id}`}
                        className="text-stone hover:underline"
                      >
                        Historique
                      </Link>
                    )}
                    <Link
                      href={`/admin/modifier/${event.id}`}
                      className="text-stone hover:underline"
                    >
                      Modifier
                    </Link>
                    <Link
                      href={`/evenement/${event.slug}`}
                      className="text-stone hover:underline"
                    >
                      Voir la page
                    </Link>
                    <BoutonSupprimerEvenement
                      eventId={event.id}
                      titre={event.titre}
                      nbBillets={event.tickets?.[0]?.count ?? 0}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-10 text-center text-stone">
              Aucun événement pour l&apos;instant. Crée le premier.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
