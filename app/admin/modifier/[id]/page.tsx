import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FormulaireModifierEvenement from "./formulaire-modifier";

export const revalidate = 0;

export default async function PageModifierEvenement({
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
      <div className="mx-auto max-w-xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet">
          Modifier
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-ink">
          {event.titre}
        </h1>

        <FormulaireModifierEvenement event={event} />
      </div>
    </main>
  );
}
