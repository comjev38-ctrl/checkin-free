import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 0;

export default async function PageAccueil() {
  const supabase = createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*, tickets(count)")
    .in("statut", ["publie", "clos"])
    .order("date_debut", { ascending: true });

  const maintenant = new Date();
  const evenementsAVenir =
    events?.filter((e) => new Date(e.date_debut) >= maintenant) ?? [];
  const evenementsPasses =
    events?.filter((e) => new Date(e.date_debut) < maintenant) ?? [];

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <p className="font-display text-xl italic text-ink">CheckIn Free</p>
          <Link
            href="/admin/connexion"
            className="font-mono text-xs uppercase tracking-wide text-stone hover:text-ink hover:underline"
          >
            Espace organisateur
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
          Billetterie associative
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl italic leading-tight text-ink sm:text-5xl">
          Réserve ta place, en deux minutes, sans compte à créer.
        </h1>
        <p className="mt-4 max-w-xl text-ink/70">
          Choisis un événement ci-dessous pour réserver ta place. Ton billet
          avec QR code arrive instantanément à l&apos;écran et par email.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        {evenementsAVenir.length > 0 ? (
          <>
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-stone">
              À venir
            </h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {evenementsAVenir.map((event) => (
                <CarteEvenement key={event.id} event={event} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-line bg-white px-6 py-14 text-center text-stone">
            Aucun événement ouvert aux inscriptions pour l&apos;instant.
            <br />
            Reviens bientôt !
          </div>
        )}

        {evenementsPasses.length > 0 && (
          <>
            <h2 className="mt-14 font-mono text-xs uppercase tracking-[0.2em] text-stone">
              Passés
            </h2>
            <div className="mt-4 grid gap-5 opacity-60 sm:grid-cols-2">
              {evenementsPasses.map((event) => (
                <CarteEvenement key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function CarteEvenement({ event }: { event: any }) {
  const date = new Date(event.date_debut).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/evenement/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition hover:border-ink/30 hover:shadow-md"
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
          <div className="flex h-full w-full items-center justify-center bg-ink/5">
            <span className="font-display text-3xl italic text-ink/20">
              {event.titre.charAt(0)}
            </span>
          </div>
        )}
        {event.logo_url && (
          <div className="absolute bottom-3 left-3 h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm">
            <Image src={event.logo_url} alt="" fill className="object-cover" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[11px] uppercase tracking-wide text-emerald">
          {date}
        </p>
        <h3 className="mt-2 font-display text-xl italic leading-snug text-ink">
          {event.titre}
        </h3>
        {event.lieu && (
          <p className="mt-1 text-sm text-stone">{event.lieu}</p>
        )}
        <span className="mt-auto pt-4 font-mono text-xs uppercase tracking-wide text-ink underline-offset-4 group-hover:underline">
          Voir l&apos;événement →
        </span>
      </div>
    </Link>
  );
}
