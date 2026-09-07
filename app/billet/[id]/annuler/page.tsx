import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EntetePublique from "@/components/entete-publique";
import FormulaireAnnulation from "./formulaire-annulation";

export const revalidate = 0;

export default async function PageAnnulerBillet({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServiceClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, prenom, nom, statut, event:events(titre, slug, date_debut)")
    .eq("id", params.id)
    .single();

  if (!ticket) notFound();

  const event = Array.isArray(ticket.event) ? ticket.event[0] : ticket.event;

  return (
    <main className="min-h-screen bg-fond">
      <EntetePublique
        retour={{ href: `/billet/${ticket.id}`, label: "Retour au billet" }}
      />
      <div className="flex items-center justify-center px-6 py-16">
        <FormulaireAnnulation
          ticketId={ticket.id}
          nomComplet={[ticket.prenom, ticket.nom].filter(Boolean).join(" ")}
          titreEvenement={event.titre}
          statutActuel={ticket.statut}
        />
      </div>
    </main>
  );
}
