import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo">
              Stats en direct
            </p>
            <h1 className="mt-1 font-sans text-3xl font-bold text-encre">
              {event.titre}
            </h1>
          </div>
          <Link
            href={`/admin/inscrits/${event.id}`}
            className="text-xs uppercase tracking-wide text-sourdine hover:text-encre hover:underline"
          >
            Voir les inscrits →
          </Link>
        </div>

        <TableauStatsLive event={event} />
      </div>
    </main>
  );
}
