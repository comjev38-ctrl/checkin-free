import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RetourAdmin from "@/components/retour-admin";
import FormulaireImport from "./formulaire-import";

export const revalidate = 0;

export default async function PageImporterContacts({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, titre, parent_event_id, recurrence")
    .eq("id", params.id)
    .single();

  if (!event) notFound();

  // Les "anciens contacts" se rattachent toujours au MODÈLE d'une
  // série récurrente (jamais à une séance précise) — null pour un
  // événement ponctuel, qui n'a pas cette notion.
  const serieId = event.parent_event_id ?? (event.recurrence === "hebdomadaire" ? event.id : null);

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <RetourAdmin href="/admin" />
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-indigo">
          Import de contacts
        </p>
        <h1 className="mt-1 font-sans text-3xl font-bold text-encre">
          {event.titre}
        </h1>
        <p className="mt-2 text-sm text-sourdine">
          Importe un fichier Excel ou CSV avec les colonnes{" "}
          <strong>Prénom</strong>, <strong>Nom</strong> et <strong>Email</strong>{" "}
          (l&apos;ordre des colonnes n&apos;a pas d&apos;importance, les
          intitulés sont détectés automatiquement).
        </p>

        <FormulaireImport eventId={event.id} serieId={serieId} />
      </div>
    </main>
  );
}
