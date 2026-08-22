"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LabelChamp from "@/components/label-champ";

export default function FormulaireInscription({
  eventId,
}: {
  eventId: string;
  slug: string;
}) {
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function reserverLaPlace(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);

    try {
      const res = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, prenom, nom, email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Une erreur est survenue.");
      }

      const { ticketId } = await res.json();
      router.push(`/billet/${ticketId}`);
    } catch (err: any) {
      setErreur(err.message);
      setEnvoiEnCours(false);
    }
  }

  return (
    <form onSubmit={reserverLaPlace} className="space-y-5">
      <h2 className="font-display text-xl text-ink">Réserver ma place</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <LabelChamp htmlFor="prenom">Prénom</LabelChamp>
          <input
            id="prenom"
            required
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
            placeholder="Jeanne"
          />
        </div>
        <div>
          <LabelChamp htmlFor="nom">Nom</LabelChamp>
          <input
            id="nom"
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
            placeholder="Dupont"
          />
        </div>
      </div>

      <div>
        <LabelChamp htmlFor="email">Email (pour recevoir le billet)</LabelChamp>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
          placeholder="jeanne@exemple.fr"
        />
      </div>

      {erreur && <p className="text-sm text-rose">{erreur}</p>}

      <button
        type="submit"
        disabled={envoiEnCours}
        className="w-full rounded-md bg-violet px-5 py-3 font-medium text-paper transition hover:bg-violet/90 disabled:opacity-50"
      >
        {envoiEnCours ? "Génération du billet…" : "Obtenir mon billet"}
      </button>
      <p className="text-center text-xs text-stone">
        Gratuit · Aucune donnée de paiement demandée
      </p>
    </form>
  );
}
