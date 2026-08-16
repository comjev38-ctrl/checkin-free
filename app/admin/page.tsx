import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const revalidate = 0;

export default async function TableauDeBordAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("*, tickets(count)")
    .eq("admin_id", user!.id)
    .order("date_debut", { ascending: true });

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
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
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/90"
          >
            + Nouvel événement
          </Link>
        </div>

        <div className="mt-8 divide-y divide-line border-t border-line">
          {events?.length ? (
            events.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="font-display text-lg text-ink">
                    {event.titre}
                  </p>
                  <p className="text-sm text-stone">
                    {new Date(event.date_debut).toLocaleDateString("fr-FR", {
                      dateStyle: "long",
                    })}{" "}
                    ·{" "}
                    <span
                      className={
                        event.statut === "publie"
                          ? "text-emerald"
                          : "text-amber"
                      }
                    >
                      {event.statut}
                    </span>{" "}
                    · {event.tickets?.[0]?.count ?? 0} billet(s)
                  </p>
                </div>
                <div className="flex gap-3 font-mono text-xs uppercase tracking-wide">
                  <Link
                    href={`/admin/scan?event=${event.id}`}
                    className="text-emerald hover:underline"
                  >
                    Scanner
                  </Link>
                  <Link
                    href={`/evenement/${event.slug}`}
                    className="text-stone hover:underline"
                  >
                    Voir la page
                  </Link>
                </div>
              </div>
            ))
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
