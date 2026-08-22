"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploaderImageEvenement } from "@/lib/stockage";
import { datetimeLocalVersISO } from "@/lib/fuseau";
import LabelChamp from "@/components/label-champ";

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
  parent_event_id: string | null;
  recurrence: "hebdomadaire" | null;
  jour_semaine: number | null;
  heure_debut: string | null;
  heure_fin: string | null;
};

const JOURS_SEMAINE = [
  { valeur: 1, label: "Lundi" },
  { valeur: 2, label: "Mardi" },
  { valeur: 3, label: "Mercredi" },
  { valeur: 4, label: "Jeudi" },
  { valeur: 5, label: "Vendredi" },
  { valeur: 6, label: "Samedi" },
  { valeur: 7, label: "Dimanche" },
];

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
  const estUneSeance = !!event.parent_event_id;

  const [type, setType] = useState<"ponctuel" | "recurrent">(
    event.recurrence === "hebdomadaire" ? "recurrent" : "ponctuel"
  );
  const [titre, setTitre] = useState(event.titre);
  const [description, setDescription] = useState(event.description ?? "");
  const [lieu, setLieu] = useState(event.lieu ?? "");
  const [dateDebut, setDateDebut] = useState(versDatetimeLocal(event.date_debut));
  const [jourSemaine, setJourSemaine] = useState(event.jour_semaine ?? 4);
  const [heureDebut, setHeureDebut] = useState(
    event.heure_debut?.slice(0, 5) ?? "19:00"
  );
  const [heureFin, setHeureFin] = useState(event.heure_fin?.slice(0, 5) ?? "");
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

      const donneesCommunes = {
        titre,
        description,
        lieu,
        capacite_max: capacite ? Number(capacite) : null,
        statut,
        ...(logoUrl ? { logo_url: logoUrl } : {}),
        ...(banniereUrl ? { image_url: banniereUrl } : {}),
      };

      const donneesRythme = estUneSeance
        ? {} // une séance individuelle ne change pas de rythme
        : type === "recurrent"
        ? {
            recurrence: "hebdomadaire" as const,
            jour_semaine: jourSemaine,
            heure_debut: heureDebut,
            heure_fin: heureFin || null,
          }
        : {
            recurrence: null,
            jour_semaine: null,
            heure_debut: null,
            date_debut: datetimeLocalVersISO(dateDebut),
            heure_fin: heureFin || null,
          };

      const { error } = await supabase
        .from("events")
        .update({ ...donneesCommunes, ...donneesRythme })
        .eq("id", event.id);

      if (error) throw error;

      // Un événement récurrent : les séances déjà créées (semaine en
      // cours ou à venir) sont des copies figées au moment de leur
      // création. Sans ça, changer le lieu, l'heure ou la capacité
      // n'aurait aucun effet visible avant la semaine suivante — ce
      // qui ressemble à un bug ("mes modifications ne sont pas prises
      // en compte"). On répercute donc immédiatement sur les séances
      // pas encore passées. Les séances déjà passées ne sont jamais
      // touchées : elles restent un historique fidèle.
      if (!estUneSeance && type === "recurrent") {
        await supabase
          .from("events")
          .update(donneesCommunes)
          .eq("parent_event_id", event.id)
          .gte("date_debut", new Date().toISOString());
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setErreur(err.message ?? "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="mt-8 space-y-5">
      {estUneSeance && (
        <div className="rounded-md border border-line bg-white px-4 py-3 text-sm text-stone">
          Ceci est une séance individuelle d&apos;un événement récurrent. Le
          rythme (jour/heure) se modifie depuis l&apos;événement modèle.
        </div>
      )}

      <div>
        <LabelChamp>Titre</LabelChamp>
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
        <LabelChamp obligatoire={false}>Description</LabelChamp>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
        />
      </div>

      {estUneSeance ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <LabelChamp obligatoire={false}>Date de cette séance</LabelChamp>
            <p className="mt-1 rounded-md border border-line bg-line/20 px-3 py-2 text-ink">
              {new Date(event.date_debut).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          </div>
          <div>
            <LabelChamp obligatoire={false}>Capacité max</LabelChamp>
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
      ) : (
        <>
          <div>
            <label className="block font-mono text-xs uppercase text-stone">
              Type d&apos;événement
            </label>
            <div className="mt-1 flex gap-1 rounded-md bg-line/50 p-1 font-mono text-xs uppercase">
              <button
                type="button"
                onClick={() => setType("ponctuel")}
                className={`flex-1 rounded px-3 py-2 ${
                  type === "ponctuel" ? "bg-white text-ink shadow-sm" : "text-stone"
                }`}
              >
                Ponctuel
              </button>
              <button
                type="button"
                onClick={() => setType("recurrent")}
                className={`flex-1 rounded px-3 py-2 ${
                  type === "recurrent" ? "bg-white text-ink shadow-sm" : "text-stone"
                }`}
              >
                Récurrent (hebdomadaire)
              </button>
            </div>
          </div>

          {type === "ponctuel" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <LabelChamp>Date et heure</LabelChamp>
                <input
                  type="datetime-local"
                  required
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                />
              </div>
              <div>
                <LabelChamp obligatoire={false}>Heure de fin</LabelChamp>
                <input
                  type="time"
                  value={heureFin}
                  onChange={(e) => setHeureFin(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                />
              </div>
              <div>
                <LabelChamp obligatoire={false}>Capacité max</LabelChamp>
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
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <LabelChamp>Jour</LabelChamp>
                  <select
                    value={jourSemaine}
                    onChange={(e) => setJourSemaine(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                  >
                    {JOURS_SEMAINE.map((j) => (
                      <option key={j.valeur} value={j.valeur}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <LabelChamp>Début</LabelChamp>
                  <input
                    type="time"
                    required
                    value={heureDebut}
                    onChange={(e) => setHeureDebut(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                  />
                </div>
                <div>
                  <LabelChamp obligatoire={false}>Fin</LabelChamp>
                  <input
                    type="time"
                    value={heureFin}
                    onChange={(e) => setHeureFin(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                  />
                </div>
                <div>
                  <LabelChamp obligatoire={false}>Capacité / séance</LabelChamp>
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
              <p className="-mt-2 text-xs text-stone">
                La séance de la semaine reste affichée jusqu&apos;à
                l&apos;heure de fin — c&apos;est seulement après qu&apos;une
                nouvelle séance sera créée pour la semaine suivante.
              </p>
            </>
          )}
        </>
      )}

      <div>
        <LabelChamp obligatoire={false}>Lieu</LabelChamp>
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
          className="flex-1 rounded-md bg-violet px-5 py-3 font-medium text-paper hover:bg-violet/90 disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
