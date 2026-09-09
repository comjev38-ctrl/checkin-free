"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";

export default function BoutonRenvoyerEchecs({ rappelId }: { rappelId: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);

  async function renvoyer() {
    setEnCours(true);
    setResultat(null);
    const res = await fetch("/api/rappels/renvoyer-echecs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rappelId }),
    });
    const data = await res.json();
    setEnCours(false);

    if (!res.ok) {
      setResultat(data.message ?? "Échec de l'opération.");
      return;
    }
    if (data.aRetenter === 0) {
      setResultat("Aucun échec à renvoyer.");
    } else {
      setResultat(`${data.emailsEnvoyes} renvoyé(s) sur ${data.aRetenter}${data.echecs > 0 ? ` · ${data.echecs} échec(s) à nouveau` : ""}`);
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={renvoyer}
        disabled={enCours}
        className="flex items-center gap-2 rounded-md border border-corail px-4 py-2 text-sm font-medium text-corail hover:bg-corail/5 disabled:opacity-50"
      >
        <RotateCw size={15} className={enCours ? "animate-spin" : ""} />
        {enCours ? "Renvoi en cours…" : "Renvoyer aux échecs uniquement"}
      </button>
      {resultat && <p className="mt-2 text-sm text-sourdine">{resultat}</p>}
    </div>
  );
}
