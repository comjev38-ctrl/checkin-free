import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RetourAdmin from "@/components/retour-admin";
import { CheckCircle2, XCircle } from "lucide-react";
import { BoutonRenvoyerEchecs, BoutonEnvoyerNouveaux } from "./bouton-renvoyer-echecs";

export const revalidate = 0;

const LIBELLE_DECLENCHEUR: Record<string, string> = {
  planifie: "Automatique",
  manuel: "Manuel",
};

export default async function PageHistoriqueRappel({
  params,
}: {
  params: { rappelId: string };
}) {
  const supabase = createClient();

  const { data: rappel } = await supabase
    .from("rappels_planifies")
    .select("id, sujet, event_id, event:events(titre)")
    .eq("id", params.rappelId)
    .single();

  if (!rappel) notFound();
  const event: any = Array.isArray(rappel.event) ? rappel.event[0] : rappel.event;

  const { data: envois } = await supabase
    .from("rappels_envois")
    .select("*")
    .eq("rappel_id", rappel.id)
    .order("envoye_at", { ascending: false });

  const reussis = (envois ?? []).filter((e) => e.statut === "envoye").length;
  const echecs = (envois ?? []).filter((e) => e.statut === "echec").length;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <RetourAdmin href={`/admin/rappels/${rappel.event_id}`} label="Rappels & invitations" />
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-indigo">
          Historique d&apos;envoi
        </p>
        <h1 className="mt-1 font-sans text-2xl font-bold text-encre">{rappel.sujet}</h1>
        <p className="mt-1 text-sm text-sourdine">{event?.titre}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-ligne bg-white px-4 py-3">
            <p className="text-2xl font-bold text-vert">{reussis}</p>
            <p className="text-xs text-sourdine">Envoyés</p>
          </div>
          {echecs > 0 && (
            <div className="rounded-lg border border-ligne bg-white px-4 py-3">
              <p className="text-2xl font-bold text-corail">{echecs}</p>
              <p className="text-xs text-sourdine">Échecs</p>
            </div>
          )}
          {echecs > 0 && <BoutonRenvoyerEchecs rappelId={rappel.id} />}
          <BoutonEnvoyerNouveaux rappelId={rappel.id} />
        </div>

        <div className="mt-6 divide-y divide-ligne rounded-lg border border-ligne bg-white">
          {!envois || envois.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-sourdine">
              Ce rappel n&apos;a encore jamais été envoyé.
            </p>
          ) : (
            envois.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {e.statut === "envoye" ? (
                    <CheckCircle2 size={16} className="shrink-0 text-vert" />
                  ) : (
                    <XCircle size={16} className="shrink-0 text-corail" />
                  )}
                  <div>
                    <p className="text-sm text-encre">
                      {e.destinataire_nom || e.destinataire_email}
                    </p>
                    {e.destinataire_nom && (
                      <p className="text-xs text-sourdine">{e.destinataire_email}</p>
                    )}
                    {e.erreur && <p className="text-xs text-corail">{e.erreur}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-sourdine">
                    {new Date(e.envoye_at).toLocaleString("fr-FR", {
                      timeZone: "Europe/Paris",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span className="text-[11px] text-sourdine">
                    {LIBELLE_DECLENCHEUR[e.declencheur] ?? e.declencheur}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
