import { createClient } from "@/lib/supabase/server";
import Scanner from "./scanner";

export default async function PageScan({
  searchParams,
}: {
  searchParams: { event?: string };
}) {
  if (!searchParams.event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <p className="text-stone">
          Choisis un événement depuis le tableau de bord pour ouvrir le
          scanner.
        </p>
      </main>
    );
  }

  const supabase = createClient();
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
