import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { calculerProchaineOccurrence } from "@/lib/recurrence";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";
import EntetePublique from "@/components/entete-publique";
import NavAdmin from "@/app/admin/nav-admin";
import { PartyPopper } from "lucide-react";

export const revalidate = 0;

export default async function PageAccueil() {
  // Session (cookies) : sert uniquement à savoir si un admin est
  // connecté, pour afficher son menu ici aussi. Rien à voir avec la
  // clé privilégiée utilisée juste après pour les compteurs publics.
  const supabaseSession = createClient();
  const {
    data: { user },
  } = await supabaseSession.auth.getUser();

  let admin: { prenom: string | null; nom: string | null; role: string } | null = null;
  if (user?.email) {
    const { data } = await supabaseSession
      .from("admins")
      .select("prenom, nom, role")
      .eq("email", user.email)
      .maybeSingle();
    admin = data;
  }

  // Clé privilégiée : nécessaire pour compter les billets (leur
  // lecture détaillée est réservée aux admins), mais on n'expose ici
  // que des nombres agrégés — jamais les billets eux-mêmes.
  const supabase = createServiceClient();

  const { data: events } = await supabase
    .from("events")
    .select("*, tickets(count)")
    .in("statut", ["publie", "clos"])
    .is("parent_event_id", null)
    .order("date_debut", { ascending: true });

  // Pour un événement récurrent, le compteur du modèle lui-même est
  // presque toujours 0 : les vraies inscriptions vont sur la séance
  // de la semaine (un événement à part, avec ses propres billets), pas
  // sur le modèle. On va donc chercher le vrai nombre de la séance
  // en cours pour chaque événement récurrent affiché.
  const eventsAvecCompteur = await Promise.all(
    (events ?? []).map(async (event: any) => {
      if (event.recurrence !== "hebdomadaire") return event;
      try {
        const seance = await obtenirOuCreerOccurrence(event);
        const { count } = await supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .eq("event_id", seance.id)
          .neq("statut", "annule");
        return { ...event, nbBilletsSeance: count ?? 0 };
      } catch {
        return { ...event, nbBilletsSeance: 0 };
      }
    })
  );

  const maintenant = new Date();
  const evenementsAVenir =
    eventsAvecCompteur.filter(
      (e) => e.recurrence === "hebdomadaire" || new Date(e.date_debut) >= maintenant
    ) ?? [];
  const evenementsPasses =
    eventsAvecCompteur.filter(
      (e) => e.recurrence !== "hebdomadaire" && new Date(e.date_debut) < maintenant
    ) ?? [];

  return (
    <main className="min-h-screen bg-fond">
      {admin ? (
        <NavAdmin
          nomAffiche={[admin.prenom, admin.nom].filter(Boolean).join(" ") || user!.email!}
          role={admin.role}
        />
      ) : (
        <EntetePublique />
      )}

      <section className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo">
          Billetterie associative
        </p>
        <h1 className="mt-3 max-w-2xl font-sans text-4xl font-bold leading-tight text-encre sm:text-5xl">
          Réserve ta place, en deux minutes, sans compte à créer.
        </h1>
        <p className="mt-4 max-w-xl text-encre/70">
          Choisis un événement ci-dessous pour réserver ta place. Ton billet
          avec QR code arrive instantanément à l&apos;écran et par email.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        {evenementsAVenir.length > 0 ? (
          <>
            <h2 className="text-xs uppercase tracking-[0.2em] text-sourdine">
              À venir
            </h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {evenementsAVenir.map((event, i) => (
                <CarteEvenement key={event.id} event={event} index={i} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-ligne bg-white px-6 py-14 text-center text-sourdine">
            Aucun événement ouvert aux inscriptions pour l&apos;instant.
            <br />
            Reviens bientôt !
          </div>
        )}

        {evenementsPasses.length > 0 && (
          <>
            <h2 className="mt-14 text-xs uppercase tracking-[0.2em] text-sourdine">
              Passés
            </h2>
            <div className="mt-4 grid gap-5 opacity-60 sm:grid-cols-2">
              {evenementsPasses.map((event, i) => (
                <CarteEvenement key={event.id} event={event} index={i} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

const TUILES = [
  { bg: "bg-indigo", texte: "text-indigo" },
  { bg: "bg-ambre", texte: "text-ambre" },
  { bg: "bg-ciel", texte: "text-ciel" },
  { bg: "bg-corail", texte: "text-corail" },
];

function CarteEvenement({ event, index }: { event: any; index: number }) {
  const tuile = TUILES[index % TUILES.length];
  const JOURS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const heureFinAffichee = event.heure_fin ? event.heure_fin.slice(0, 5) : null;

  const date =
    event.recurrence === "hebdomadaire"
      ? (() => {
          const prochaine = calculerProchaineOccurrence(
            event.jour_semaine,
            event.heure_debut
          );
          const plage = heureFinAffichee
            ? `${event.heure_debut?.slice(0, 5)}–${heureFinAffichee}`
            : event.heure_debut?.slice(0, 5);
          return `Tous les ${JOURS[event.jour_semaine]}, ${plage} · prochaine séance le ${prochaine.toLocaleDateString(
            "fr-FR",
            { timeZone: "Europe/Paris", day: "numeric", month: "long" }
          )}`;
        })()
      : (() => {
          const base = new Date(event.date_debut).toLocaleString("fr-FR", {
            timeZone: "Europe/Paris",
            weekday: "short",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          });
          return heureFinAffichee ? `${base} – ${heureFinAffichee}` : base;
        })();

  const nbBillets =
    event.recurrence === "hebdomadaire"
      ? event.nbBilletsSeance ?? 0
      : event.tickets?.[0]?.count ?? 0;
  const placesRestantes =
    event.capacite_max != null ? Math.max(0, event.capacite_max - nbBillets) : null;

  return (
    <Link
      href={`/evenement/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ligne bg-white shadow-carte transition hover:-translate-y-0.5"
    >
      <div className="relative h-40 w-full">
        {event.image_url ? (
          <Image src={event.image_url} alt={event.titre} fill className="object-cover" />
        ) : event.logo_url ? (
          <Image
            src={event.logo_url}
            alt={event.titre}
            fill
            className="object-cover blur-sm"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${tuile.bg}`}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <PartyPopper size={26} className={tuile.texte} strokeWidth={1.75} />
            </div>
          </div>
        )}
        {event.logo_url && (
          <div className="absolute bottom-3 left-3 h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm">
            <Image src={event.logo_url} alt="" fill className="object-cover" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-vert">
          {date}
        </p>
        <h3 className="mt-2 font-sans text-xl font-bold leading-snug text-encre">
          {event.titre}
        </h3>
        {event.lieu && (
          <p className="mt-1 text-sm text-sourdine">{event.lieu}</p>
        )}
        {placesRestantes != null && (
          <p className="mt-1 text-sm text-sourdine">
            {placesRestantes > 0
              ? `${placesRestantes} place${placesRestantes > 1 ? "s" : ""} restante${
                  placesRestantes > 1 ? "s" : ""
                } sur ${event.capacite_max}`
              : "Complet"}
          </p>
        )}
        <span className="mt-auto self-start rounded-lg bg-indigo-clair px-3.5 py-2 text-sm font-semibold text-indigo transition group-hover:bg-indigo group-hover:text-white">
          Voir l&apos;événement →
        </span>
      </div>
    </Link>
  );
}
