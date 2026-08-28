import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import TableauStatsLive from "./tableau-stats-live";
import RetourAdmin from "@/components/retour-admin";

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
        <RetourAdmin href="/admin" />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo">
              Stats en direct
            </p>
            <h1 className="mt-1 font-sans text-3xl font-bold text-encre">
              {event.titre}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/scan?event=${event.id}`}
              className="rounded-md bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo/90"
            >
              Scanner
            </Link>
            <Link
              href={`/admin/inscrits/${event.id}`}
              className="text-xs uppercase tracking-wide text-sourdine hover:text-encre hover:underline"
            >
              Voir les inscrits →
            </Link>
          </div>
        </div>

        <TableauStatsLive event={event} />
      </div>
    </main>
  );
}
