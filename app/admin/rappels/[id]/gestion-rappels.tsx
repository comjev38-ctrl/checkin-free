"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LabelChamp from "@/components/label-champ";
import { Plus, Trash2, Pencil, Send, Mail } from "lucide-react";

type Rappel = {
  id: string;
  event_id: string;
  jours_avant: number;
  heure: string;
  cible: "inscrits" | "anciens_participants";
  sujet: string;
  accroche: string;
  description: string | null;
  texte_bouton: string;
  lien_bouton: string | null;
  couleur_accent: string;
  nom_expediteur: string | null;
  actif: boolean;
};

const LIBELLE_CIBLE: Record<string, string> = {
  inscrits: "Inscrits actuels (rappel de leur billet)",
  anciens_participants: "Anciens participants (invitation à revenir)",
};

function libelleJours(j: number) {
  if (j === 0) return "Le jour même";
  if (j === 1) return "La veille (1 jour avant)";
  return `${j} jours avant`;
}

export default function GestionRappels({
  eventId,
  rappelsInitiaux,
  autoriserAnciensParticipants,
}: {
  eventId: string;
  rappelsInitiaux: Rappel[];
  autoriserAnciensParticipants: boolean;
}) {
  const router = useRouter();
  const [rappels, setRappels] = useState(rappelsInitiaux);
  const [enEdition, setEnEdition] = useState<Rappel | "nouveau" | null>(null);

  async function basculerActif(rappel: Rappel) {
    const supabase = createClient();
    await supabase
      .from("rappels_planifies")
      .update({ actif: !rappel.actif })
      .eq("id", rappel.id);
    setRappels((prev) =>
      prev.map((r) => (r.id === rappel.id ? { ...r, actif: !r.actif } : r))
    );
  }

  async function supprimer(id: string) {
    if (!window.confirm("Supprimer ce rappel ?")) return;
    const supabase = createClient();
    await supabase.from("rappels_planifies").delete().eq("id", id);
    setRappels((prev) => prev.filter((r) => r.id !== id));
  }

  if (enEdition) {
    return (
      <FormulaireRappel
        eventId={eventId}
        rappel={enEdition === "nouveau" ? null : enEdition}
        autoriserAnciensParticipants={autoriserAnciensParticipants}
        onAnnuler={() => setEnEdition(null)}
        onEnregistre={(r, estNouveau) => {
          setRappels((prev) =>
            estNouveau ? [...prev, r] : prev.map((x) => (x.id === r.id ? r : x))
          );
          setEnEdition(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setEnEdition("nouveau")}
        className="flex items-center gap-2 rounded-md bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo/90"
      >
        <Plus size={16} />
        Ajouter un rappel
      </button>

      <div className="mt-6 space-y-3">
        {rappels.length === 0 && (
          <p className="text-sm text-sourdine">
            Aucun rappel configuré pour cet événement.
          </p>
        )}
        {rappels.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border bg-white p-4 ${
              r.actif ? "border-ligne" : "border-ligne opacity-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-indigo" />
                  <p className="font-medium text-encre">{r.sujet}</p>
                </div>
                <p className="mt-1 text-sm text-sourdine">
                  {libelleJours(r.jours_avant)} à {r.heure.slice(0, 5)} ·{" "}
                  {LIBELLE_CIBLE[r.cible]}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => basculerActif(r)}
                  title={r.actif ? "Désactiver" : "Activer"}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    r.actif ? "bg-vert/15 text-vert" : "bg-ligne text-sourdine"
                  }`}
                >
                  {r.actif ? "Actif" : "Coupé"}
                </button>
                <button
                  onClick={() => setEnEdition(r)}
                  className="rounded-md p-2 text-sourdine hover:bg-fond hover:text-encre"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => supprimer(r.id)}
                  className="rounded-md p-2 text-sourdine hover:bg-corail/10 hover:text-corail"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormulaireRappel({
  eventId,
  rappel,
  autoriserAnciensParticipants,
  onAnnuler,
  onEnregistre,
}: {
  eventId: string;
  rappel: Rappel | null;
  autoriserAnciensParticipants: boolean;
  onAnnuler: () => void;
  onEnregistre: (r: Rappel, estNouveau: boolean) => void;
}) {
  const [joursAvant, setJoursAvant] = useState(rappel?.jours_avant ?? 1);
  const [heure, setHeure] = useState(rappel?.heure?.slice(0, 5) ?? "09:00");
  const [cible, setCible] = useState<"inscrits" | "anciens_participants">(
    rappel?.cible ?? "inscrits"
  );
  const [sujet, setSujet] = useState(rappel?.sujet ?? "");
  const [accroche, setAccroche] = useState(rappel?.accroche ?? "");
  const [description, setDescription] = useState(rappel?.description ?? "");
  const [texteBouton, setTexteBouton] = useState(rappel?.texte_bouton ?? "Réserver ma place");
  const [lienBouton, setLienBouton] = useState(rappel?.lien_bouton ?? "");
  const [couleurAccent, setCouleurAccent] = useState(rappel?.couleur_accent ?? "#5B5FEF");
  const [nomExpediteur, setNomExpediteur] = useState(rappel?.nom_expediteur ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);

    const supabase = createClient();
    const donnees = {
      event_id: eventId,
      jours_avant: joursAvant,
      heure,
      cible,
      sujet,
      accroche,
      description: description || null,
      texte_bouton: texteBouton,
      lien_bouton: lienBouton || null,
      couleur_accent: couleurAccent,
      nom_expediteur: nomExpediteur || null,
    };

    const { data, error } = rappel
      ? await supabase
          .from("rappels_planifies")
          .update(donnees)
          .eq("id", rappel.id)
          .select("*")
          .single()
      : await supabase.from("rappels_planifies").insert(donnees).select("*").single();

    setEnCours(false);
    if (error || !data) {
      setErreur(error?.message ?? "Erreur lors de l'enregistrement.");
      return;
    }
    onEnregistre(data, !rappel);
  }

  return (
    <form onSubmit={enregistrer} className="mt-6 space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <LabelChamp>Jours avant</LabelChamp>
          <input
            type="number"
            min={0}
            required
            value={joursAvant}
            onChange={(e) => setJoursAvant(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
          />
        </div>
        <div>
          <LabelChamp>Heure souhaitée</LabelChamp>
          <input
            type="time"
            required
            value={heure}
            onChange={(e) => setHeure(e.target.value)}
            className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <LabelChamp>Cible</LabelChamp>
          <select
            value={cible}
            onChange={(e) => setCible(e.target.value as typeof cible)}
            className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-sm text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
          >
            <option value="inscrits">Inscrits actuels</option>
            <option value="anciens_participants" disabled={!autoriserAnciensParticipants}>
              Anciens participants{!autoriserAnciensParticipants ? " (récurrent seulement)" : ""}
            </option>
          </select>
        </div>
      </div>

      <div>
        <LabelChamp>Nom de l&apos;expéditeur (optionnel)</LabelChamp>
        <input
          value={nomExpediteur}
          onChange={(e) => setNomExpediteur(e.target.value)}
          placeholder="Ex: Jeunesse & Vie Grenoble"
          className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
        />
      </div>

      <div>
        <LabelChamp>Sujet de l&apos;email</LabelChamp>
        <input
          required
          value={sujet}
          onChange={(e) => setSujet(e.target.value)}
          placeholder="On se retrouve bientôt !"
          className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
        />
      </div>

      <div>
        <LabelChamp>Message mis en avant</LabelChamp>
        <textarea
          required
          rows={2}
          value={accroche}
          onChange={(e) => setAccroche(e.target.value)}
          placeholder="Nous serions ravis de te retrouver pour ce nouveau rendez-vous."
          className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
        />
      </div>

      <div>
        <LabelChamp obligatoire={false}>Description (optionnelle)</LabelChamp>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Quelques lignes en plus pour donner envie de venir."
          className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <LabelChamp>Texte du bouton</LabelChamp>
          <input
            required
            value={texteBouton}
            onChange={(e) => setTexteBouton(e.target.value)}
            className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
          />
        </div>
        <div>
          <LabelChamp>Couleur</LabelChamp>
          <input
            type="color"
            value={couleurAccent}
            onChange={(e) => setCouleurAccent(e.target.value)}
            className="mt-1 h-[42px] w-full rounded-md border border-ligne bg-white px-2"
          />
        </div>
      </div>

      <div>
        <LabelChamp obligatoire={false}>
          Lien du bouton (optionnel — sinon la page de l&apos;événement ou le
          billet)
        </LabelChamp>
        <input
          value={lienBouton}
          onChange={(e) => setLienBouton(e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
        />
      </div>

      {erreur && <p className="text-sm text-corail">{erreur}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onAnnuler}
          className="rounded-md border border-ligne px-5 py-2.5 text-sm font-medium text-encre hover:bg-fond"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={enCours}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-indigo px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo/90 disabled:opacity-50"
        >
          <Send size={15} />
          {enCours ? "Enregistrement…" : "Enregistrer le rappel"}
        </button>
      </div>
    </form>
  );
}
