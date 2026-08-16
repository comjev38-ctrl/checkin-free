"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PageCompte() {
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function definirMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setSucces(false);

    if (motDePasse.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setEnCours(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setEnCours(false);

    if (error) {
      setErreur(error.message);
      return;
    }
    setSucces(true);
    setMotDePasse("");
    setConfirmation("");
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-sm">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
          Mon compte
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-ink">
          Définir un mot de passe
        </h1>
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

          {erreur && <p className="text-sm text-rose">{erreur}</p>}
          {succes && (
            <p className="text-sm text-emerald">
              Mot de passe enregistré. Tu peux l&apos;utiliser dès la
              prochaine connexion.
            </p>
          )}

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-md bg-ink px-5 py-3 font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
          >
            {enCours ? "Enregistrement…" : "Enregistrer le mot de passe"}
          </button>
        </form>
      </div>
    </main>
  );
}
