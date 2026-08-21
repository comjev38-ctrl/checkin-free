"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploaderImageEvenement } from "@/lib/stockage";
import { calculerProchaineOccurrence } from "@/lib/recurrence";
import { datetimeLocalVersISO } from "@/lib/fuseau";

function creerSlug(titre: string) {
  return titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const JOURS_SEMAINE = [
  { valeur: 1, label: "Lundi" },
  { valeur: 2, label: "Mardi" },
  { valeur: 3, label: "Mercredi" },
  { valeur: 4, label: "Jeudi" },
  { valeur: 5, label: "Vendredi" },
  { valeur: 6, label: "Samedi" },
  { valeur: 7, label: "Dimanche" },
];

export default function PageCreerEvenement() {
  const router = useRouter();
  const [type, setType] = useState<"ponctuel" | "recurrent">("ponctuel");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [heureFinPonctuel, setHeureFinPonctuel] = useState("");
  const [jourSemaine, setJourSemaine] = useState(4); // jeudi par défaut
  const [heureDebut, setHeureDebut] = useState("17:00");
  const [heureFin, setHeureFin] = useState("19:00");
  const [capacite, setCapacite] = useState("");
  const [logoFichier, setLogoFichier] = useState<File | null>(null);
  const [logoApercu, setLogoApercu] = useState<string | null>(null);
  const [banniereFichier, setBanniereFichier] = useState<File | null>(null);
  const [banniereApercu, setBanniereApercu] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function choisirFichier(
    e: React.ChangeEvent<HTMLInputElement>,
    setFichier: (f: File | null) => void,
    setApercu: (u: string | null) => void
  ) {
    const f = e.target.files?.[0] ?? null;
    setFichier(f);
    setApercu(f ? URL.createObjectURL(f) : null);
  }

  async function creerEtPublier(e: React.FormEvent, statut: "brouillon" | "publie") {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    try {
      const [logoUrl, banniereUrl] = await Promise.all([
        logoFichier ? uploaderImageEvenement(supabase, logoFichier, "logo") : null,
        banniereFichier
          ? uploaderImageEvenement(supabase, banniereFichier, "banniere")
          : null,
      ]);

      const donneesCommunes = {
        admin_id: user!.id,
        titre,
        slug: creerSlug(titre),
        description,
        lieu,
        capacite_max: capacite ? Number(capacite) : null,
        statut,
        logo_url: logoUrl,
        image_url: banniereUrl,
      };

      const { error } =
        type === "recurrent"
          ? await supabase.from("events").insert({
              ...donneesCommunes,
              recurrence: "hebdomadaire",
              jour_semaine: jourSemaine,
              heure_debut: heureDebut,
              heure_fin: heureFin || null,
              // Valeur informative seulement : la vraie date affichée
              // est recalculée à chaque visite via jour_semaine/heure_debut.
              date_debut: calculerProchaineOccurrence(
                jourSemaine,
                heureDebut,
                heureFin || null
              ).toISOString(),
            })
          : await supabase.from("events").insert({
              ...donneesCommunes,
              date_debut: datetimeLocalVersISO(dateDebut),
              heure_fin: heureFinPonctuel || null,
            });

      if (error) throw error;
      router.push("/admin");
    } catch (err: any) {
      setErreur(
        err.message?.includes("duplicate")
          ? "Un événement avec un titre similaire existe déjà."
          : err.message ?? "Une erreur est survenue."
      );
      setEnCours(false);
    }
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
            {type === "recurrent" && (
              <p className="mt-2 text-xs text-stone">
                Une nouvelle séance (et donc de nouveaux billets) sera créée
                automatiquement chaque semaine, à date fixe. L&apos;historique
                des séances passées reste consultable dans l&apos;admin.
              </p>
            )}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase text-stone">Titre</label>
            <input
              required
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              placeholder="Soirée gospel"
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

          {type === "ponctuel" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="block font-mono text-xs uppercase text-stone">
                  Date et heure
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase text-stone">
                  Heure de fin
                </label>
                <input
                  type="time"
                  value={heureFinPonctuel}
                  onChange={(e) => setHeureFinPonctuel(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase text-stone">
                  Capacité max
                </label>
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
                  <label className="block font-mono text-xs uppercase text-stone">
                    Jour
                  </label>
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
                  <label className="block font-mono text-xs uppercase text-stone">
                    Début
                  </label>
                  <input
                    type="time"
                    required
                    value={heureDebut}
                    onChange={(e) => setHeureDebut(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase text-stone">
                    Fin
                  </label>
                  <input
                    type="time"
                    value={heureFin}
                    onChange={(e) => setHeureFin(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase text-stone">
                    Capacité
                  </label>
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
                La séance de la semaine reste affichée jusqu&apos;à l&apos;heure
                de fin (ex: 19h) — c&apos;est seulement après qu&apos;une
                nouvelle séance sera créée pour la semaine suivante.
              </p>
            </>
          )}

          <div>
            <label className="block font-mono text-xs uppercase text-stone">Lieu</label>
            <input
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              placeholder="Grenoble"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs uppercase text-stone">
                Logo (carré)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => choisirFichier(e, setLogoFichier, setLogoApercu)}
                className="mt-1 w-full text-xs text-stone file:mr-3 file:rounded-md file:border-0 file:bg-line file:px-3 file:py-2 file:text-xs file:font-mono file:uppercase file:text-ink"
              />
              {logoApercu && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoApercu}
                  alt=""
                  className="mt-2 h-16 w-16 rounded-full border border-line object-cover"
                />
              )}
            </div>
            <div>
              <label className="block font-mono text-xs uppercase text-stone">
                Bannière (large)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  choisirFichier(e, setBanniereFichier, setBanniereApercu)
                }
                className="mt-1 w-full text-xs text-stone file:mr-3 file:rounded-md file:border-0 file:bg-line file:px-3 file:py-2 file:text-xs file:font-mono file:uppercase file:text-ink"
              />
              {banniereApercu && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banniereApercu}
                  alt=""
                  className="mt-2 h-16 w-full rounded-md border border-line object-cover"
                />
              )}
            </div>
          </div>
          <p className="-mt-2 text-xs text-stone">
            Optionnel, 5 Mo max chacun. Logo : carré, min. 500×500 px. Bannière :
            large, environ 1600×500 px.
          </p>

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
              {enCours ? "Envoi…" : "Publier la page"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
