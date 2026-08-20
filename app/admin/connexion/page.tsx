"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/logo";

function FormulaireConnexion() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const [modeOubli, setModeOubli] = useState(false);
  const [emailOubli, setEmailOubli] = useState("");
  const [lienEnvoye, setLienEnvoye] = useState(false);

  useEffect(() => {
    // Les invitations admin transmettent la session via un fragment
    // d'URL (#access_token=...), invisible côté serveur — on le
    // récupère nous-mêmes ici si présent.
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        const supabase = createClient();
        supabase.auth
          .setSession({ access_token, refresh_token })
          .then(({ error }) => {
            if (!error) {
              router.push("/admin");
              router.refresh();
            }
          });
        return;
      }
    }

    if (searchParams.get("erreur") === "lien_invalide") {
      setErreur(
        "Ce lien a expiré ou a déjà été utilisé. Connecte-toi avec ton mot de passe, ou utilise « mot de passe oublié »."
      );
    }
    if (searchParams.get("erreur") === "non_autorise") {
      setErreur(
        "Ton compte n'est pas autorisé à accéder à l'espace admin. Demande à un membre existant de t'ajouter depuis la page Membres."
      );
    }
  }, [searchParams, router]);

  async function connexionMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });
    setEnCours(false);
    if (error) {
      setErreur(
        error.message.includes("Invalid login credentials")
          ? "Email ou mot de passe incorrect."
          : error.message
      );
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function envoyerLienReinitialisation(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(emailOubli, {
      redirectTo: `${window.location.origin}/admin/connexion`,
    });
    setEnCours(false);
    if (error) setErreur(error.message);
    else setLienEnvoye(true);
  }

  if (modeOubli) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-display text-xl italic text-ink">CheckIn Free</span>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
          Espace organisateur
        </p>
        <h1 className="mt-2 font-display text-3xl italic text-ink">
          Mot de passe oublié
        </h1>

        {lienEnvoye ? (
          <p className="mt-6 rounded-md bg-emerald/10 px-4 py-3 text-emerald">
            Email envoyé à {emailOubli}. Ouvre ta boîte mail pour réinitialiser
            ton mot de passe.
          </p>
        ) : (
          <form onSubmit={envoyerLienReinitialisation} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={emailOubli}
              onChange={(e) => setEmailOubli(e.target.value)}
              placeholder="ton@email.fr"
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
            />
            {erreur && <p className="text-sm text-rose">{erreur}</p>}
            <button
              type="submit"
              disabled={enCours}
              className="w-full rounded-md bg-ink px-5 py-3 font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
            >
              {enCours ? "Envoi…" : "Recevoir un lien de réinitialisation"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setModeOubli(false);
            setErreur(null);
            setLienEnvoye(false);
          }}
          className="mt-4 text-sm text-stone hover:text-ink hover:underline"
        >
          ← Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex items-center gap-2.5">
        <Logo size={32} />
        <span className="font-display text-xl italic text-ink">CheckIn Free</span>
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
        Espace organisateur
      </p>
      <h1 className="mt-2 font-display text-3xl italic text-ink">
        Connexion
      </h1>

      <form onSubmit={connexionMotDePasse} className="mt-6 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.fr"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
        />
        <input
          type="password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder="Mot de passe"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
        />
        {erreur && <p className="text-sm text-rose">{erreur}</p>}
        <button
          type="submit"
          disabled={enCours}
          className="w-full rounded-md bg-ink px-5 py-3 font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
        >
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
        <button
          type="button"
          onClick={() => {
            setModeOubli(true);
            setErreur(null);
          }}
          className="w-full text-sm text-stone hover:text-ink hover:underline"
        >
          Mot de passe oublié ?
        </button>
      </form>
    </div>
  );
}

export default function PageConnexion() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <Suspense fallback={null}>
        <FormulaireConnexion />
      </Suspense>
    </main>
  );
}
