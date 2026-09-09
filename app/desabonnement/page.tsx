"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import EntetePublique from "@/components/entete-publique";

function ContenuDesabonnement() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const serieId = searchParams.get("serie") ?? "";

  const [etat, setEtat] = useState<"attente" | "en_cours" | "fait" | "erreur">("attente");
  const [titreSerie, setTitreSerie] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function confirmer() {
    setEtat("en_cours");
    const res = await fetch("/api/desabonnement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, serieId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErreur(data.message ?? "Une erreur est survenue.");
      setEtat("erreur");
      return;
    }
    setTitreSerie(data.titreSerie);
    setEtat("fait");
  }

  if (!email || !serieId) {
    return (
      <p className="text-center text-sourdine">Lien de désabonnement invalide.</p>
    );
  }

  if (etat === "fait") {
    return (
      <div className="text-center">
        <CheckCircle2 size={32} className="mx-auto text-vert" />
        <h1 className="mt-4 text-xl font-bold text-encre">Désabonnement confirmé</h1>
        <p className="mt-2 text-sm text-sourdine">
          <strong>{email}</strong> ne recevra plus d&apos;invitations pour{" "}
          <strong>{titreSerie}</strong>.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-indigo hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-xl font-bold text-encre">Se désabonner de ces invitations</h1>
      <p className="mt-3 text-sm text-sourdine">
        <strong>{email}</strong> ne recevra plus d&apos;emails d&apos;invitation pour cet
        événement. Tu pourras toujours t&apos;y inscrire toi-même si tu changes d&apos;avis.
      </p>
      {erreur && <p className="mt-3 text-sm text-corail">{erreur}</p>}
      <button
        onClick={confirmer}
        disabled={etat === "en_cours"}
        className="mt-6 rounded-md bg-indigo px-6 py-3 text-sm font-medium text-white hover:bg-indigo/90 disabled:opacity-50"
      >
        {etat === "en_cours" ? "Traitement…" : "Confirmer le désabonnement"}
      </button>
    </div>
  );
}

export default function PageDesabonnement() {
  return (
    <main className="min-h-screen bg-fond">
      <EntetePublique />
      <div className="flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-sm">
          <Suspense fallback={null}>
            <ContenuDesabonnement />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
