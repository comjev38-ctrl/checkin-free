import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Scanner from "./scanner";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";

export default async function PageScan({
  searchParams,
}: {
  searchParams: { event?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: moi } = await supabase
    .from("admins")
    .select("role")
    .eq("email", user?.email)
    .maybeSingle();

  const estScanneur = moi?.role === "scanneur";

  if (!searchParams.event) {
    if (estScanneur) {
      const { data: autorisations } = await supabase
        .from("admin_evenements_autorises")
        .select("event:events(*)")
        .eq("admin_email", user?.email);

      const evenementsBruts = (autorisations ?? [])
        .map((a: any) => (Array.isArray(a.event) ? a.event[0] : a.event))
        .filter(Boolean);

      // Pour un événement récurrent, on scanne la séance de la
      // semaine (qui change chaque semaine), jamais le modèle
      // lui-même — on résout donc l'id réel à utiliser ici.
      const evenements = await Promise.all(
        evenementsBruts.map(async (e: any) => {
          if (e.recurrence === "hebdomadaire") {
            try {
              const seance = await obtenirOuCreerOccurrence(e);
              return { id: seance.id, titre: e.titre };
            } catch {
              return null;
            }
          }
          return { id: e.id, titre: e.titre };
        })
      ).then((liste) => liste.filter(Boolean) as { id: string; titre: string }[]);

      return (
        <main className="min-h-screen bg-fond px-6 py-10">
          <div className="mx-auto max-w-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo">
              Contrôle d&apos;accès
            </p>
            <h1 className="mt-1 font-sans text-2xl font-bold text-encre">
              Choisis un événement
            </h1>
            {evenements.length ? (
              <div className="mt-6 space-y-2">
                {evenements.map((e: any) => (
                  <Link
                    key={e.id}
                    href={`/admin/scan?event=${e.id}`}
                    className="block rounded-xl border border-ligne bg-white px-4 py-3 text-encre shadow-carte hover:border-indigo"
                  >
                    {e.titre}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sourdine">
                Aucun événement ne t&apos;a encore été autorisé pour le scan.
                Demande à un propriétaire de te l&apos;attribuer depuis la
                page Membres.
              </p>
            )}
          </div>
        </main>
      );
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-fond px-6">
        <p className="text-sourdine">
          Choisis un événement depuis le tableau de bord pour ouvrir le
          scanner.
        </p>
      </main>
    );
  }

  // Un scanneur ne peut ouvrir que les événements qui lui ont été
  // explicitement autorisés — directement, ou via le modèle parent
  // si c'est une séance d'un événement récurrent (le scan se fait
  // sur la séance de la semaine, qui change chaque semaine, donc
  // l'autorisation est donnée une fois pour toutes sur le modèle).
  if (estScanneur) {
    const { data: evenementScanne } = await supabase
      .from("events")
      .select("id, parent_event_id")
      .eq("id", searchParams.event)
      .single();

    const idsAVerifier = [searchParams.event, evenementScanne?.parent_event_id].filter(
      Boolean
    ) as string[];

    const { data: autorisation } = await supabase
      .from("admin_evenements_autorises")
      .select("event_id")
      .eq("admin_email", user?.email)
      .in("event_id", idsAVerifier)
      .maybeSingle();

    if (!autorisation) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-fond px-6">
          <p className="text-center text-sourdine">
            Tu n&apos;es pas autorisé à scanner pour cet événement.
          </p>
        </main>
      );
    }
  }

  const { data: event } = await supabase
    .from("events")
    .select("titre, date_debut")
    .eq("id", searchParams.event)
    .single();

  return (
    <Scanner
      eventId={searchParams.event}
      eventTitre={event?.titre ?? null}
      eventDate={event?.date_debut ?? null}
    />
  );
}
