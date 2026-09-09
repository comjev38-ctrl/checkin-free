"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LabelChamp from "@/components/label-champ";
import EditeurRiche from "@/components/editeur-riche";
import { Plus, Trash2, Pencil, Send, Mail, TestTube2, Users, History } from "lucide-react";

type Rappel = {
  id: string;
  event_id: string;
  jours_avant: number;
  heure: string;
  cible: "inscrits" | "anciens_participants";
  mode_envoi: "planifie" | "manuel";
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
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEnEdition("nouveau")}
          className="flex items-center gap-2 rounded-md bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo/90"
        >
          <Plus size={16} />
          Ajouter un rappel
        </button>
        <Link
          href={`/admin/rappels/${eventId}/contacts`}
          className="flex items-center gap-2 rounded-md border border-ligne px-4 py-2.5 text-sm font-medium text-encre hover:bg-fond"
        >
          <Users size={16} />
          Voir contacts importés
        </Link>
      </div>

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
                <div className="flex items-center gap-2 flex-wrap">
                  <Mail size={14} className="text-indigo" />
                  <p className="font-medium text-encre">{r.sujet}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      r.mode_envoi === "manuel"
                        ? "bg-ambre-clair text-ambre"
                        : "bg-indigo/10 text-indigo"
                    }`}
                  >
                    {r.mode_envoi === "manuel" ? "Manuel" : "Planifié"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-sourdine">
                  {r.mode_envoi === "planifie"
                    ? `${libelleJours(r.jours_avant)} à ${r.heure.slice(0, 5)}`
                    : "Envoi uniquement à la demande"}{" "}
                  · {LIBELLE_CIBLE[r.cible]}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <BoutonEnvoyerMaintenant rappelId={r.id} />
                <Link
                  href={`/admin/rappels/historique/${r.id}`}
                  title="Historique d'envoi"
                  className="rounded-md p-2 text-sourdine hover:bg-fond hover:text-encre"
                >
                  <History size={15} />
                </Link>
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

function BoutonEnvoyerMaintenant({ rappelId }: { rappelId: string }) {
  const [enCours, setEnCours] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);

  async function envoyer() {
    setConfirmation(false);
    setEnCours(true);
    setResultat(null);
    const res = await fetch("/api/rappels/envoyer-maintenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rappelId }),
    });
    const data = await res.json();
    setEnCours(false);

    if (!res.ok) {
      setResultat(data.message ?? "Échec de l'envoi");
    } else {
      const morceaux = [`${data.emailsEnvoyes} envoyé(s)`];
      if (data.echecs > 0) morceaux.push(`${data.echecs} échec(s)`);
      if (data.dejaInscritsExclus > 0)
        morceaux.push(`${data.dejaInscritsExclus} déjà inscrit(s) exclu(s)`);
      setResultat(morceaux.join(" · "));
    }
    setTimeout(() => setResultat(null), 6000);
  }

  if (confirmation) {
    return (
      <div className="flex items-center gap-1 rounded-md border border-indigo bg-indigo/5 px-2 py-1">
        <span className="text-xs text-encre">Envoyer maintenant ?</span>
        <button
          onClick={envoyer}
          className="rounded px-2 py-1 text-xs font-medium text-indigo hover:bg-indigo/10"
        >
          Oui
        </button>
        <button
          onClick={() => setConfirmation(false)}
          className="rounded px-2 py-1 text-xs text-sourdine hover:bg-fond"
        >
          Non
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setConfirmation(true)}
        disabled={enCours}
        title="Envoyer maintenant"
        className="rounded-md p-2 text-sourdine hover:bg-indigo/10 hover:text-indigo disabled:opacity-50"
      >
        <Send size={15} />
      </button>
      {resultat && (
        <span className="absolute right-0 top-9 z-10 whitespace-nowrap rounded-md bg-encre px-2.5 py-1.5 text-xs text-white shadow-lg">
          {resultat}
        </span>
      )}
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
  const [modeEnvoi, setModeEnvoi] = useState<"planifie" | "manuel">(
    rappel?.mode_envoi ?? "planifie"
  );
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
  const [testEnCours, setTestEnCours] = useState(false);
  const [testResultat, setTestResultat] = useState<string | null>(null);
  const [emailsTest, setEmailsTest] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmailsTest(data.user.email);
    });
  }, []);

  async function envoyerTest() {
    setTestEnCours(true);
    setTestResultat(null);
    const destinataires = emailsTest
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    const res = await fetch("/api/rappels/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        sujet,
        accroche,
        description,
        texteBouton,
        lienBouton,
        couleurAccent,
        nomExpediteur,
        destinataires,
      }),
    });
    const data = await res.json();
    setTestEnCours(false);
    setTestResultat(
      res.ok
        ? `Email de test envoyé à ${data.envoyeA}.${data.avertissement ? ` (${data.avertissement})` : ""}`
        : data.message ?? "Échec de l'envoi."
    );
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    // L'éditeur enrichi (contentEditable) ne supporte pas l'attribut
    // HTML natif "required" — on vérifie donc à la main.
    if (!accroche || accroche.replace(/<[^>]*>/g, "").trim() === "") {
      setErreur("Le message mis en avant est obligatoire.");
      return;
    }

    setEnCours(true);

    const supabase = createClient();
    const donnees = {
      event_id: eventId,
      jours_avant: joursAvant,
      heure,
      cible,
      mode_envoi: modeEnvoi,
      sujet: sujet.replace(/^\s*\[TEST\]\s*/i, ""),
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
      <div>
        <LabelChamp>Mode d&apos;envoi</LabelChamp>
        <div className="mt-1 flex gap-1 rounded-md bg-ligne/50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setModeEnvoi("planifie")}
            className={`flex-1 rounded px-3 py-2 ${
              modeEnvoi === "planifie" ? "bg-white text-encre shadow-sm" : "text-sourdine"
            }`}
          >
            Planifié (automatique)
          </button>
          <button
            type="button"
            onClick={() => setModeEnvoi("manuel")}
            className={`flex-1 rounded px-3 py-2 ${
              modeEnvoi === "manuel" ? "bg-white text-encre shadow-sm" : "text-sourdine"
            }`}
          >
            Manuel (à la demande)
          </button>
        </div>
        <p className="mt-1.5 text-xs text-sourdine">
          {modeEnvoi === "planifie"
            ? "Envoyé automatiquement par la tâche planifiée, au jour/heure ci-dessous."
            : "N'est jamais envoyé automatiquement — seulement quand tu cliques sur \u00abEnvoyer maintenant\u00bb."}
        </p>
      </div>

      <div className={`grid grid-cols-2 gap-4 ${modeEnvoi === "planifie" ? "sm:grid-cols-3" : ""}`}>
        {modeEnvoi === "planifie" && (
          <>
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
          </>
        )}
        <div className={modeEnvoi === "planifie" ? "col-span-2 sm:col-span-1" : "col-span-2"}>
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
        <div className="mt-1">
          <EditeurRiche
            value={accroche}
            onChange={setAccroche}
            placeholder="Nous serions ravis de te retrouver pour ce nouveau rendez-vous."
            minHeight="130px"
          />
        </div>
      </div>

      <div>
        <LabelChamp obligatoire={false}>Description (optionnelle)</LabelChamp>
        <div className="mt-1">
          <EditeurRiche
            value={description}
            onChange={setDescription}
            placeholder="Quelques lignes en plus pour donner envie de venir."
            minHeight="170px"
          />
        </div>
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

      <div className="border-t border-ligne pt-4">
        <LabelChamp obligatoire={false}>
          Envoyer un test à (une ou plusieurs adresses, séparées par une virgule)
        </LabelChamp>
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            value={emailsTest}
            onChange={(e) => setEmailsTest(e.target.value)}
            placeholder="toi@email.fr, collegue@email.fr"
            className="min-w-[220px] flex-1 rounded-md border border-ligne bg-white px-3 py-2 text-sm text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
          />
          <button
            type="button"
            onClick={envoyerTest}
            disabled={testEnCours || !sujet || !accroche || !emailsTest.trim()}
            className="flex items-center gap-2 rounded-md border border-indigo px-4 py-2 text-sm font-medium text-indigo hover:bg-indigo/5 disabled:opacity-50"
          >
            <TestTube2 size={15} />
            {testEnCours ? "Envoi…" : "Envoyer le test"}
          </button>
        </div>
        {testResultat && (
          <p className={`mt-2 text-sm ${testResultat.includes("envoyé") ? "text-vert" : "text-corail"}`}>
            {testResultat}
          </p>
        )}
      </div>

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
