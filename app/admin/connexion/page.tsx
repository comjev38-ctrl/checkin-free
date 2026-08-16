"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function FormulaireConnexion() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [lienEnvoye, setLienEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("erreur") === "lien_invalide") {
      setErreur(
        "Ce lien a expiré ou a déjà été utilisé. Redemande un nouveau lien ci-dessous."
      );
    }
  }, [searchParams]);

  async function envoyerLien(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });
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

      {lienEnvoye ? (
        <p className="mt-6 rounded-md bg-emerald/10 px-4 py-3 text-emerald">
          Lien de connexion envoyé à {email}. Ouvre ta boîte mail.
        </p>
      ) : (
        <form onSubmit={envoyerLien} className="mt-6 space-y-4">
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
            className="w-full rounded-md bg-ink px-5 py-3 font-medium text-paper hover:bg-ink/90"
          >
            Recevoir le lien de connexion
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
