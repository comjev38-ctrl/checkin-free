import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { Plus, MoreHorizontal, Ticket, Users2, PartyPopper } from "lucide-react";
import BoutonSupprimerEvenement from "./bouton-supprimer-evenement";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";

export const revalidate = 0;

const JOURS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

// Rotation de la palette de tuiles (direction artistique du dashboard
// de référence) pour les événements sans bannière — chaque carte
// prend la couleur suivante dans le cycle.
const TUILES = [
  { bg: "bg-violet", texte: "text-violet" },
  { bg: "bg-orange", texte: "text-orange" },
  { bg: "bg-bleu", texte: "text-bleu" },
  { bg: "bg-fuchsia", texte: "text-fuchsia" },
];

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
  // qui pointent directement dessus depuis le tableau de bord — et on
  // va chercher son nombre de billets à part, car la résolution de
  // séance ne le renvoie pas (elle ne sélectionne pas cette relation).
  const evenementsAvecSeance = await Promise.all(
    (events ?? []).map(async (event: any) => {
      if (event.recurrence === "hebdomadaire") {
        try {
          const seance = await obtenirOuCreerOccurrence(event);
          const { count } = await supabase
            .from("tickets")
            .select("*", { count: "exact", head: true })
            .eq("event_id", seance.id)
            .neq("statut", "annule");

          // Total toutes séances confondues (pour le message de
          // suppression, qui supprime tout l'historique en cascade).
          const { data: seances } = await supabase
            .from("events")
            .select("id")
            .eq("parent_event_id", event.id);
          const idsSeances = (seances ?? []).map((s: { id: string }) => s.id);
          const { count: totalToutesSeances } = idsSeances.length
            ? await supabase
                .from("tickets")
                .select("*", { count: "exact", head: true })
                .in("event_id", idsSeances)
                .neq("statut", "annule")
            : { count: 0 };

          return {
            ...event,
            seanceActuelle: { ...seance, nbBillets: count ?? 0 },
            totalBilletsSerie: totalToutesSeances ?? 0,
          };
        } catch {
          return { ...event, seanceActuelle: null, totalBilletsSerie: 0 };
        }
      }
      return event;
    })
  );

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet">
              Espace organisateur
            </p>
            <h1 className="mt-1 font-display text-3xl italic text-ink">
              Mes événements
            </h1>
          </div>
          <Link
            href="/admin/creer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-violet px-4 py-2.5 text-sm font-medium text-paper hover:bg-violet/90"
          >
            <Plus size={16} />
            Nouvel événement
          </Link>
        </div>

        {evenementsAvecSeance.length ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {evenementsAvecSeance.map((event: any, index: number) => {
              const recurrent = event.recurrence === "hebdomadaire";
              const seance = event.seanceActuelle;
              const idPourActions = recurrent ? seance?.id : event.id;
              const nbBillets = recurrent
                ? seance?.nbBillets ?? 0
                : event.tickets?.[0]?.count ?? 0;
              const tuile = TUILES[index % TUILES.length];

              return (
                <div
                  key={event.id}
                  className="flex flex-col rounded-xl border border-line bg-white"
                >
                  {/* Vignette */}
                  <div
                    className={`relative h-32 w-full overflow-hidden rounded-t-xl ${
                      event.image_url ? "bg-ink/5" : tuile.bg
                    }`}
                  >
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                          <PartyPopper size={26} className={tuile.texte} strokeWidth={1.75} />
                        </div>
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${
                        event.statut === "publie"
                          ? "bg-emerald text-paper"
                          : event.statut === "brouillon"
                          ? "bg-amber text-paper"
                          : "bg-stone text-paper"
                      }`}
                    >
                      {event.statut === "publie"
                        ? "Publié"
                        : event.statut === "brouillon"
                        ? "Brouillon"
                        : "Clos"}
                    </span>
                    {recurrent && (
                      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink shadow-sm">
                        Hebdomadaire
                      </span>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-display text-lg leading-snug text-ink">
                      {event.titre}
                    </h2>
                    <p className="mt-1 text-sm text-stone">
                      {recurrent
                        ? `Tous les ${JOURS[event.jour_semaine]} à ${event.heure_debut?.slice(0, 5)}`
                        : new Date(event.date_debut).toLocaleDateString("fr-FR", {
                            dateStyle: "long",
                          })}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-sm text-stone">
                      <span className="flex items-center gap-1.5">
                        <Ticket size={15} />
                        {nbBillets}
                      </span>
                      {recurrent && seance && (
                        <span className="flex items-center gap-1.5">
                          <Users2 size={15} />
                          prochaine :{" "}
                          {new Date(seance.date_debut).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2 pt-3">
                      <Link
                        href={`/evenement/${event.slug}`}
                        className="flex-1 rounded-md border border-line px-3 py-2 text-center text-sm text-ink hover:bg-line/20"
                      >
                        Voir la page
                      </Link>
                      {idPourActions && (
                        <Link
                          href={`/admin/stats/${idPourActions}`}
                          className="flex-1 rounded-md bg-violet px-3 py-2 text-center text-sm text-paper hover:bg-violet/90"
                        >
                          Administrer
                        </Link>
                      )}
                      <details className="relative">
                        <summary className="flex h-[38px] w-[38px] cursor-pointer list-none items-center justify-center rounded-md border border-line text-stone hover:bg-line/20 [&::-webkit-details-marker]:hidden">
                          <MoreHorizontal size={18} />
                        </summary>
                        <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-line bg-white py-1 shadow-lg">
                          {idPourActions && (
                            <>
                              <Link
                                href={`/admin/scan?event=${idPourActions}`}
                                className="block px-4 py-2 text-sm text-ink hover:bg-line/20"
                              >
                                Scanner les billets
                              </Link>
                              <Link
                                href={`/admin/stats/${idPourActions}`}
                                className="block px-4 py-2 text-sm text-ink hover:bg-line/20"
                              >
                                Stats en direct
                              </Link>
                              <Link
                                href={`/admin/inscrits/${idPourActions}`}
                                className="block px-4 py-2 text-sm text-ink hover:bg-line/20"
                              >
                                Inscrits
                              </Link>
                            </>
                          )}
                          {recurrent && (
                            <Link
                              href={`/admin/serie/${event.id}`}
                              className="block px-4 py-2 text-sm text-ink hover:bg-line/20"
                            >
                              Historique des séances
                            </Link>
                          )}
                          <Link
                            href={`/admin/modifier/${event.id}`}
                            className="block px-4 py-2 text-sm text-ink hover:bg-line/20"
                          >
                            Modifier
                          </Link>
                          <div className="my-1 border-t border-line" />
                          <BoutonSupprimerEvenement
                            eventId={event.id}
                            titre={event.titre}
                            nbBillets={
                              recurrent
                                ? event.totalBilletsSerie ?? 0
                                : event.tickets?.[0]?.count ?? 0
                            }
                            className="block w-full px-4 py-2 text-left text-sm text-rose hover:bg-rose/5 disabled:opacity-50"
                          />
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-line bg-white py-16 text-center text-stone">
            Aucun événement pour l&apos;instant. Crée le premier.
          </div>
        )}
      </div>
    </main>
  );
}
