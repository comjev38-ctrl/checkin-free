"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function FormulaireConnexion() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<"motdepasse" | "lienmagique">("motdepasse");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [lienEnvoye, setLienEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (searchParams.get("erreur") === "lien_invalide") {
      setErreur(
        "Ce lien a expiré ou a déjà été utilisé. Redemande un nouveau lien ci-dessous."
      );
    }
  }, [searchParams]);

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
          ? "Email ou mot de passe incorrect. Si tu n'as pas encore défini de mot de passe, utilise le lien magique ci-dessous."
          : error.message
      );
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function envoyerLienMagique(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });
    setEnCours(false);
    if (error) setErreur(error.message);
    else setLienEnvoye(true);
  }

  return (
    <div className="w-full max-w-sm">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
        Espace organisateur
      </p>
      <h1 className="mt-2 font-display text-3xl italic text-ink">
        Connexion
      </h1>

      <div className="mt-6 flex gap-1 rounded-md bg-line/50 p-1 font-mono text-xs uppercase">
        <button
          type="button"
          onClick={() => {
            setMode("motdepasse");
            setErreur(null);
            setLienEnvoye(false);
          }}
          className={`flex-1 rounded px-3 py-2 ${
            mode === "motdepasse" ? "bg-white text-ink shadow-sm" : "text-stone"
          }`}
        >
          Mot de passe
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("lienmagique");
            setErreur(null);
          }}
          className={`flex-1 rounded px-3 py-2 ${
            mode === "lienmagique" ? "bg-white text-ink shadow-sm" : "text-stone"
          }`}
        >
          Lien magique
        </button>
      </div>

      {mode === "motdepasse" ? (
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
          <p className="text-xs text-stone">
            Pas encore de mot de passe ? Connecte-toi via lien magique une
            première fois, puis définis-en un depuis « Mon compte ».
          </p>
        </form>
      ) : lienEnvoye ? (
        <p className="mt-6 rounded-md bg-emerald/10 px-4 py-3 text-emerald">
          Lien de connexion envoyé à {email}. Ouvre ta boîte mail.
        </p>
      ) : (
        <form onSubmit={envoyerLienMagique} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.fr"
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
          {erreur && <p className="text-sm text-rose">{erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-md bg-ink px-5 py-3 font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
          >
            {enCours ? "Envoi…" : "Recevoir le lien de connexion"}
          </button>
        </form>
      )}
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
