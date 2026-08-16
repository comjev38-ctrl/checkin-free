"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Event = {
  id: string;
  titre: string;
  slug: string;
  description: string | null;
  lieu: string | null;
  date_debut: string;
  capacite_max: number | null;
  statut: "brouillon" | "publie" | "clos";
};

function versDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function FormulaireModifierEvenement({ event }: { event: Event }) {
  const router = useRouter();
  const [titre, setTitre] = useState(event.titre);
  const [description, setDescription] = useState(event.description ?? "");
  const [lieu, setLieu] = useState(event.lieu ?? "");
  const [dateDebut, setDateDebut] = useState(versDatetimeLocal(event.date_debut));
  const [capacite, setCapacite] = useState(
    event.capacite_max != null ? String(event.capacite_max) : ""
  );
  const [statut, setStatut] = useState(event.statut);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({
        titre,
        description,
        lieu,
        date_debut: dateDebut,
        capacite_max: capacite ? Number(capacite) : null,
        statut,
      })
      .eq("id", event.id);

    setEnCours(false);
    if (error) {
      setErreur(error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={enregistrer} className="mt-8 space-y-5">
      <div>
        <label className="block font-mono text-xs uppercase text-stone">Titre</label>
        <input
          required
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
        />
        <p className="mt-1 text-xs text-stone">
          URL (inchangée) : /evenement/{event.slug}
        </p>
      </div>

      <div>
        <label className="block font-mono text-xs uppercase text-stone">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-xs uppercase text-stone">Date et heure</label>
          <input
            type="datetime-local"
            required
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase text-stone">Capacité max</label>
          <input
            type="number"
            min={1}
            value={capacite}
            onChange={(e) => setCapacite(e.target.value)}
            placeholder="Illimitée"
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
        </div>
      </div>

      <div>
        <label className="block font-mono text-xs uppercase text-stone">Lieu</label>
        <input
          value={lieu}
          onChange={(e) => setLieu(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
        />
      </div>

      <div>
        <label className="block font-mono text-xs uppercase text-stone">Statut</label>
        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value as typeof statut)}
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
        >
          <option value="brouillon">Brouillon (page non visible)</option>
          <option value="publie">Publié (inscriptions ouvertes)</option>
          <option value="clos">Clos (page visible, inscriptions fermées)</option>
        </select>
      </div>

      {erreur && <p className="text-sm text-rose">{erreur}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-md border border-line px-5 py-3 font-medium text-ink hover:bg-white"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={enCours}
          className="flex-1 rounded-md bg-ink px-5 py-3 font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
