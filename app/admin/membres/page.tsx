import { createClient } from "@/lib/supabase/server";
import {
  FormulaireInviter,
  BoutonRetirer,
  SelecteurRole,
  GestionEvenementsScan,
} from "./actions-membres";

export const revalidate = 0;

export default async function PageMembres() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membres } = await supabase
    .from("admins")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: evenements } = await supabase
    .from("events")
    .select("id, titre")
    .is("parent_event_id", null)
    .order("date_debut", { ascending: false });

  const { data: autorisationsToutes } = await supabase
    .from("admin_evenements_autorises")
    .select("admin_email, event_id");

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo">
          Équipe
        </p>
        <h1 className="mt-1 font-sans text-3xl font-bold text-encre">
          Membres admin
        </h1>
        <p className="mt-2 text-sm text-sourdine">
          <strong>Propriétaire</strong> : tout, y compris gérer l&apos;équipe.{" "}
          <strong>Organisateur</strong> : crée et gère les événements, scanne
          partout, mais ne touche pas à l&apos;équipe.{" "}
          <strong>Scanneur</strong> : ne peut scanner que les événements qui
          lui sont explicitement attribués ci-dessous.
        </p>

        <FormulaireInviter />

        <div className="mt-8 divide-y divide-ligne border-t border-ligne">
          {membres?.length ? (
            membres.map((m) => (
              <div key={m.email} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="text-encre">
                    {[m.prenom, m.nom].filter(Boolean).join(" ") || m.email}
                    {[m.prenom, m.nom].filter(Boolean).length > 0 && (
                      <span className="ml-2 text-sm text-sourdine">{m.email}</span>
                    )}
                    {m.email === user?.email && (
                      <span className="ml-2 text-xs text-sourdine">(toi)</span>
                    )}
                    {!m.user_id && (
                      <span className="ml-2 rounded-full bg-ambre-clair px-2 py-0.5 text-xs font-medium text-ambre">
                        en attente de première connexion
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <SelecteurRole
                      email={m.email}
                      roleActuel={m.role ?? "organisateur"}
                      desactive={m.email === user?.email}
                    />
                    {m.email !== user?.email && <BoutonRetirer email={m.email} />}
                  </div>
                </div>

                {(m.role ?? "organisateur") === "scanneur" && (
                  <GestionEvenementsScan
                    email={m.email}
                    evenements={evenements ?? []}
                    autorises={(autorisationsToutes ?? [])
                      .filter((a) => a.admin_email === m.email)
                      .map((a) => a.event_id)}
                  />
                )}
              </div>
            ))
          ) : (
            <p className="py-6 text-sourdine">Aucun membre pour l&apos;instant.</p>
          )}
        </div>
      </div>
    </main>
  );
}
