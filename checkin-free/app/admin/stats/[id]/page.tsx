import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import TableauStatsLive from "./tableau-stats-live";

export const revalidate = 0;

export default async function PageStatsEvenement({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!event) notFound();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
          Stats en direct
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-ink">
          {event.titre}
        </h1>

        <TableauStatsLive event={event} />
      </div>
    </main>
  );
}
