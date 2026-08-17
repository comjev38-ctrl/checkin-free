"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploaderImageEvenement } from "@/lib/stockage";

type Event = {
  id: string;
  titre: string;
  slug: string;
  description: string | null;
  lieu: string | null;
  date_debut: string;
  capacite_max: number | null;
  statut: "brouillon" | "publie" | "clos";
  logo_url: string | null;
  image_url: string | null;
};

function versDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function ChampImage({
  label,
  formeRonde,
  urlActuelle,
  onFichierChoisi,
}: {
  label: string;
  formeRonde?: boolean;
  urlActuelle: string | null;
  onFichierChoisi: (f: File | null, apercu: string | null) => void;
}) {
  const [apercu, setApercu] = useState<string | null>(null);

  return (
    <div>
      <label className="block font-mono text-xs uppercase text-stone">{label}</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          const url = f ? URL.createObjectURL(f) : null;
          setApercu(url);
          onFichierChoisi(f, url);
        }}
        className="mt-1 w-full text-xs text-stone file:mr-3 file:rounded-md file:border-0 file:bg-line file:px-3 file:py-2 file:text-xs file:font-mono file:uppercase file:text-ink"
      />
      {(apercu || urlActuelle) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={apercu ?? urlActuelle ?? ""}
          alt=""
          className={
            formeRonde
              ? "mt-2 h-16 w-16 rounded-full border border-line object-cover"
              : "mt-2 h-16 w-full rounded-md border border-line object-cover"
          }
        />
      )}
    </div>
  );
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
  const [logoFichier, setLogoFichier] = useState<File | null>(null);
  const [banniereFichier, setBanniereFichier] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);

    const supabase = createClient();

    try {
      const [logoUrl, banniereUrl] = await Promise.all([
        logoFichier ? uploaderImageEvenement(supabase, logoFichier, "logo") : null,
        banniereFichier
          ? uploaderImageEvenement(supabase, banniereFichier, "banniere")
          : null,
      ]);

      const { error } = await supabase
        .from("events")
        .update({
          titre,
          description,
          lieu,
          date_debut: dateDebut,
          capacite_max: capacite ? Number(capacite) : null,
          statut,
          ...(logoUrl ? { logo_url: logoUrl } : {}),
          ...(banniereUrl ? { image_url: banniereUrl } : {}),
        })
        .eq("id", event.id);

      if (error) throw error;
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setErreur(err.message ?? "Une erreur est survenue.");
      setEnCours(false);
    }
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

      <div className="grid grid-cols-2 gap-4">
        <ChampImage
          label="Logo (carré)"
          formeRonde
          urlActuelle={event.logo_url}
          onFichierChoisi={(f) => setLogoFichier(f)}
        />
        <ChampImage
          label="Bannière (large)"
          urlActuelle={event.image_url}
          onFichierChoisi={(f) => setBanniereFichier(f)}
        />
      </div>
      <p className="-mt-2 text-xs text-stone">
        Laisse vide pour garder l&apos;image actuelle. 5 Mo max chacune. Logo :
        carré, min. 500×500 px. Bannière : large, environ 1600×500 px.
      </p>

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
