"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChampMotDePasse from "@/components/champ-mot-de-passe";
import { CheckCircle2, Loader2 } from "lucide-react";

function PageCompteInterne() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const changementObligatoire = searchParams.get("mdp_provisoire") === "1";

  const [email, setEmail] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreurProfil, setErreurProfil] = useState<string | null>(null);
  const [succesProfil, setSuccesProfil] = useState(false);
  const [enCoursProfil, setEnCoursProfil] = useState(false);

  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreurMdp, setErreurMdp] = useState<string | null>(null);
  const [succesMdp, setSuccesMdp] = useState(false);
  const [enCoursMdp, setEnCoursMdp] = useState(false);
  const [redirectionEnCours, setRedirectionEnCours] = useState(false);

  useEffect(() => {
    async function charger() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) return;
      setEmail(user.email);

      const { data: admin } = await supabase
        .from("admins")
        .select("prenom, nom")
        .eq("email", user.email)
        .maybeSingle();

      setPrenom(admin?.prenom ?? "");
      setNom(admin?.nom ?? "");
      setChargement(false);
    }
    charger();
  }, []);

  async function enregistrerProfil(e: React.FormEvent) {
    e.preventDefault();
    setErreurProfil(null);
    setSuccesProfil(false);
    setEnCoursProfil(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("admins")
      .update({ prenom, nom })
      .eq("email", email);

    setEnCoursProfil(false);
    if (error) {
      setErreurProfil(error.message);
      return;
    }
    setSuccesProfil(true);
  }

  async function definirMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    setErreurMdp(null);
    setSuccesMdp(false);

    if (motDePasse.length < 8) {
      setErreurMdp("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreurMdp("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setEnCoursMdp(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: motDePasse });

    if (error) {
      setEnCoursMdp(false);
      setErreurMdp(error.message);
      return;
    }

    // Lève l'obligation de changement, s'il y en avait une.
    await supabase
      .from("admins")
      .update({ mot_de_passe_provisoire: false })
      .eq("email", email);

    setEnCoursMdp(false);
    setMotDePasse("");
    setConfirmation("");

    if (changementObligatoire) {
      setRedirectionEnCours(true);
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 1400);
    } else {
      setSuccesMdp(true);
    }
  }

  if (redirectionEnCours) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 size={40} className="text-emerald" />
          <p className="mt-4 font-display text-xl italic text-ink">
            Mot de passe enregistré
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-stone">
            <Loader2 size={16} className="animate-spin" />
            Redirection vers l&apos;espace organisateur…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-sm space-y-12">
        {changementObligatoire && (
          <div className="rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-ink">
            Tu utilises un mot de passe provisoire. Définis ton propre mot de
            passe ci-dessous pour continuer.
          </div>
        )}

        {!changementObligatoire && (
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
              Mon compte
            </p>
            <h1 className="mt-1 font-display text-3xl italic text-ink">
              Mon profil
            </h1>
            <p className="mt-2 text-sm text-stone">{email}</p>

            {!chargement && (
              <form onSubmit={enregistrerProfil} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-xs uppercase text-stone">
                      Prénom
                    </label>
                    <input
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase text-stone">
                      Nom
                    </label>
                    <input
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                    />
                  </div>
                </div>

                {erreurProfil && <p className="text-sm text-rose">{erreurProfil}</p>}
                {succesProfil && (
                  <p className="text-sm text-emerald">Profil enregistré.</p>
                )}

                <button
                  type="submit"
                  disabled={enCoursProfil}
                  className="w-full rounded-md bg-ink px-5 py-3 font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
                >
                  {enCoursProfil ? "Enregistrement…" : "Enregistrer mon profil"}
                </button>
              </form>
            )}
          </div>
        )}

        <div>
          <h2 className="font-display text-2xl italic text-ink">
            {changementObligatoire ? "Nouveau mot de passe" : "Mot de passe"}
          </h2>
          {!changementObligatoire && (
            <p className="mt-2 text-sm text-stone">
              Change ton mot de passe de connexion à l&apos;espace organisateur.
            </p>
          )}

          <form onSubmit={definirMotDePasse} className="mt-6 space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase text-stone">
                Nouveau mot de passe
              </label>
              <div className="mt-1">
                <ChampMotDePasse
                  required
                  minLength={8}
                  value={motDePasse}
                  onChange={setMotDePasse}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div>
              <label className="block font-mono text-xs uppercase text-stone">
                Confirmer le mot de passe
              </label>
              <div className="mt-1">
                <ChampMotDePasse
                  required
                  minLength={8}
                  value={confirmation}
                  onChange={setConfirmation}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {erreurMdp && <p className="text-sm text-rose">{erreurMdp}</p>}
            {succesMdp && (
              <p className="text-sm text-emerald">
                Mot de passe enregistré. Tu peux l&apos;utiliser dès la
                prochaine connexion.
              </p>
            )}

            <button
              type="submit"
              disabled={enCoursMdp}
              className="w-full rounded-md bg-ink px-5 py-3 font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
            >
              {enCoursMdp ? "Enregistrement…" : "Enregistrer le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function PageCompte() {
  return (
    <Suspense fallback={null}>
      <PageCompteInterne />
    </Suspense>
  );
}
