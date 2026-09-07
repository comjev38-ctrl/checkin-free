"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function FormulaireAnnulation({
  ticketId,
  nomComplet,
  titreEvenement,
  statutActuel,
}: {
  ticketId: string;
  nomComplet: string;
  titreEvenement: string;
  statutActuel: "valide" | "utilise" | "annule";
}) {
  const [etat, setEtat] = useState<"attente" | "en_cours" | "fait" | "erreur">(
    statutActuel === "annule" ? "fait" : "attente"
  );
  const [erreur, setErreur] = useState<string | null>(null);

  async function confirmer() {
    setEtat("en_cours");
    const res = await fetch("/api/annuler-billet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErreur(data.message ?? "Une erreur est survenue.");
      setEtat("erreur");
      return;
    }
    setEtat("fait");
  }

  if (statutActuel === "utilise") {
    return (
      <div className="w-full max-w-sm text-center">
        <AlertTriangle size={32} className="mx-auto text-ambre" />
        <h1 className="mt-4 text-xl font-bold text-encre">
          Impossible d&apos;annuler
        </h1>
        <p className="mt-2 text-sm text-sourdine">
          Ce billet a déjà été scanné à l&apos;entrée de l&apos;événement.
        </p>
      </div>
    );
  }

  if (etat === "fait") {
    return (
      <div className="w-full max-w-sm text-center">
        <CheckCircle2 size={32} className="mx-auto text-vert" />
        <h1 className="mt-4 text-xl font-bold text-encre">Place annulée</h1>
        <p className="mt-2 text-sm text-sourdine">
          Ta place pour <strong>{titreEvenement}</strong> a bien été libérée.
          Merci de nous avoir prévenus.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-indigo hover:underline"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm text-center">
      <h1 className="text-xl font-bold text-encre">Annuler ta place ?</h1>
      <p className="mt-3 text-sm text-sourdine">
        {nomComplet}, tu es sur le point d&apos;annuler ta place pour{" "}
        <strong>{titreEvenement}</strong>. Cette action est définitive — si tu
        changes d&apos;avis, il faudra te réinscrire depuis la page de
        l&apos;événement.
      </p>

      {erreur && <p className="mt-3 text-sm text-corail">{erreur}</p>}

      <div className="mt-6 flex justify-center gap-3">
        <Link
          href={`/billet/${ticketId}`}
          className="rounded-md border border-ligne px-5 py-2.5 text-sm font-medium text-encre hover:bg-white"
        >
          Garder ma place
        </Link>
        <button
          onClick={confirmer}
          disabled={etat === "en_cours"}
          className="rounded-md bg-corail px-5 py-2.5 text-sm font-medium text-white hover:bg-corail/90 disabled:opacity-50"
        >
          {etat === "en_cours" ? "Annulation…" : "Confirmer l'annulation"}
        </button>
      </div>
    </div>
  );
}
