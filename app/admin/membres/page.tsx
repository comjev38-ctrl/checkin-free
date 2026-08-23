import { createClient } from "@/lib/supabase/server";
import { FormulaireInviter, BoutonRetirer } from "./actions-membres";

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

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo">
          Équipe
        </p>
        <h1 className="mt-1 font-sans text-3xl font-bold text-encre">
          Membres admin
        </h1>
        <p className="mt-2 text-sm text-sourdine">
          Toute personne ajoutée ici peut créer, publier, modifier et
          supprimer n&apos;importe quel événement, et scanner les billets à
          l&apos;entrée.
        </p>

        <FormulaireInviter />

        <div className="mt-8 divide-y divide-ligne border-t border-ligne">
          {membres?.length ? (
            membres.map((m) => (
              <div
                key={m.email}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3"
              >
                <span className="text-encre">
                  {[m.prenom, m.nom].filter(Boolean).join(" ") || m.email}
                  {[m.prenom, m.nom].filter(Boolean).length > 0 && (
                    <span className="ml-2 text-sm text-sourdine">{m.email}</span>
                  )}
                  {m.email === user?.email && (
                    <span className="ml-2 text-xs text-sourdine">
                      (toi)
                    </span>
                  )}
                  {!m.user_id && (
                    <span className="ml-2 rounded-full bg-ambre-clair px-2 py-0.5 text-xs font-medium text-ambre">
                      en attente de première connexion
                    </span>
                  )}
                </span>
                {m.email !== user?.email && (
                  <BoutonRetirer email={m.email} />
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
