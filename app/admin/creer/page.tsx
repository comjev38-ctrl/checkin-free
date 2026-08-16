"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function creerSlug(titre: string) {
  return titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PageCreerEvenement() {
  const router = useRouter();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [capacite, setCapacite] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function creerEtPublier(e: React.FormEvent, statut: "brouillon" | "publie") {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("events")
      .insert({
        admin_id: user!.id,
        titre,
        slug: creerSlug(titre),
        description,
        lieu,
        date_debut: dateDebut,
        capacite_max: capacite ? Number(capacite) : null,
        statut,
      })
      .select("id")
      .single();

    if (error) {
      setErreur(
        error.message.includes("duplicate")
          ? "Un événement avec un titre similaire existe déjà."
          : error.message
      );
      setEnCours(false);
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
          Nouvel événement
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-ink">
          Créer une page événement
        </h1>

        <form className="mt-8 space-y-5">
          <div>
            <label className="block font-mono text-xs uppercase text-stone">Titre</label>
            <input
              required
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              placeholder="Soirée gospel de l'AEEG"
            />
            {titre && (
              <p className="mt-1 text-xs text-stone">
                URL : /evenement/{creerSlug(titre)}
              </p>
            )}
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
              placeholder="Grenoble"
            />
          </div>

          {erreur && <p className="text-sm text-rose">{erreur}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={(e) => creerEtPublier(e, "brouillon")}
              disabled={enCours}
              className="rounded-md border border-line px-5 py-3 font-medium text-ink hover:bg-white disabled:opacity-50"
            >
              Enregistrer en brouillon
            </button>
            <button
              onClick={(e) => creerEtPublier(e, "publie")}
              disabled={enCours}
              className="flex-1 rounded-md bg-ink px-5 py-3 font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
            >
              Publier la page
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
