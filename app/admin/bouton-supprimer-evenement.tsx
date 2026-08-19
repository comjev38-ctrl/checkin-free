"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BoutonSupprimerEvenement({
  eventId,
  titre,
  nbBillets,
  className = "text-rose hover:underline disabled:opacity-50",
}: {
  eventId: string;
  titre: string;
  nbBillets: number;
  className?: string;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function supprimer() {
    const message =
      nbBillets > 0
        ? `Supprimer "${titre}" ? Cela supprimera aussi les ${nbBillets} billet(s) déjà émis. Cette action est irréversible.`
        : `Supprimer "${titre}" ? Cette action est irréversible.`;

    if (!window.confirm(message)) return;

    setEnCours(true);
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    setEnCours(false);

    if (error) {
      window.alert(`Erreur lors de la suppression : ${error.message}`);
      return;
    }
    router.refresh();
  }

  return (
    <button onClick={supprimer} disabled={enCours} className={className}>
      {enCours ? "Suppression…" : "Supprimer"}
    </button>
  );
}
