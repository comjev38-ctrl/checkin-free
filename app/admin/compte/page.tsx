"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PageCompte() {
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
    setEnCoursMdp(false);

    if (error) {
      setErreurMdp(error.message);
      return;
    }
    setSuccesMdp(true);
    setMotDePasse("");
    setConfirmation("");
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-sm space-y-12">
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

        <div>
          <h2 className="font-display text-2xl italic text-ink">
            Mot de passe
          </h2>
          <p className="mt-2 text-sm text-stone">
            Une fois défini, tu pourras te connecter avec ton email et ce mot
            de passe, sans passer par le lien magique reçu par email à chaque
            fois. Pratique sur téléphone, le jour de l&apos;événement.
          </p>

          <form onSubmit={definirMotDePasse} className="mt-6 space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase text-stone">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase text-stone">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              />
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
