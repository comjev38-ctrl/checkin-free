"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";

type Contact = { prenom: string; nom: string; email: string };
type Resultat = {
  importes: number;
  ignoresDoublons: number;
  ignoresInvalides: number;
  ignoresCapacite: number;
  emailsEnvoyes: number;
  mode: "inscrire" | "anciens_participants";
};

function normaliser(texte: string) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const CLES_PRENOM = ["prenom", "prenoms", "firstname", "first name"];
const CLES_NOM = ["nom", "lastname", "last name", "surname"];
const CLES_EMAIL = ["email", "mail", "adresse email", "e-mail", "courriel"];

function detecterColonne(entetes: string[], cles: string[]) {
  const normalisees = entetes.map(normaliser);
  for (const cle of cles) {
    const i = normalisees.indexOf(cle);
    if (i !== -1) return entetes[i];
  }
  return null;
}

export default function FormulaireImport({
  eventId,
  serieId,
}: {
  eventId: string;
  serieId: string | null;
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [erreurLecture, setErreurLecture] = useState<string | null>(null);
  const [nomFichier, setNomFichier] = useState<string | null>(null);
  const [mode, setMode] = useState<"inscrire" | "anciens_participants">("inscrire");
  const [envoyerEmail, setEnvoyerEmail] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);

  async function lireFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setErreurLecture(null);
    setResultat(null);
    setNomFichier(fichier.name);

    try {
      const buffer = await fichier.arrayBuffer();
      const classeur = XLSX.read(buffer, { type: "array" });
      const feuille = classeur.Sheets[classeur.SheetNames[0]];
      const lignes: Record<string, any>[] = XLSX.utils.sheet_to_json(feuille, {
        defval: "",
      });

      if (lignes.length === 0) {
        setErreurLecture("Ce fichier ne contient aucune ligne de données.");
        return;
      }

      const entetes = Object.keys(lignes[0]);
      const colPrenom = detecterColonne(entetes, CLES_PRENOM);
      const colNom = detecterColonne(entetes, CLES_NOM);
      const colEmail = detecterColonne(entetes, CLES_EMAIL);

      if (!colEmail) {
        setErreurLecture(
          `Colonne Email non reconnue. Colonnes trouvées : ${entetes.join(", ")}.`
        );
        return;
      }

      const extraits: Contact[] = lignes
        .map((ligne) => ({
          prenom: colPrenom ? String(ligne[colPrenom] ?? "").trim() : "",
          nom: colNom ? String(ligne[colNom] ?? "").trim() : "",
          email: String(ligne[colEmail] ?? "").trim(),
        }))
        .filter((c) => c.email);

      setContacts(extraits);
    } catch (err) {
      setErreurLecture(
        "Impossible de lire ce fichier. Vérifie que c'est bien un .xlsx, .xls ou .csv."
      );
    }
  }

  async function lancerImport() {
    setEnCours(true);
    const res = await fetch("/api/importer-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        serieId,
        contacts,
        mode,
        envoyerEmail: mode === "inscrire" ? envoyerEmail : false,
      }),
    });
    const data = await res.json();
    setEnCours(false);
    if (!res.ok) {
      setErreurLecture(data.message ?? "Erreur lors de l'import.");
      return;
    }
    setResultat({ ...data, mode });
    setContacts([]);
    router.refresh();
  }

  if (resultat) {
    return (
      <div className="mt-8 rounded-xl border border-ligne bg-white p-6">
        <div className="flex items-center gap-2 text-vert">
          <CheckCircle2 size={20} />
          <p className="font-semibold">Import terminé</p>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-encre">
          <li>
            ✅ {resultat.importes}{" "}
            {resultat.mode === "inscrire"
              ? "billet(s) créé(s)"
              : "contact(s) ajouté(s) aux anciens participants"}
          </li>
          {resultat.mode === "inscrire" && envoyerEmail && (
            <li>✉️ {resultat.emailsEnvoyes} email(s) envoyé(s)</li>
          )}
          {resultat.ignoresDoublons > 0 && (
            <li className="text-sourdine">
              ⏭️ {resultat.ignoresDoublons} ignoré(s) — déjà présent(s)
            </li>
          )}
          {resultat.ignoresInvalides > 0 && (
            <li className="text-sourdine">
              ⚠️ {resultat.ignoresInvalides} ignoré(s) — ligne invalide (email
              manquant ou mal formé)
            </li>
          )}
          {resultat.ignoresCapacite > 0 && (
            <li className="text-corail">
              🚫 {resultat.ignoresCapacite} ignoré(s) — capacité atteinte
            </li>
          )}
        </ul>
        <button
          onClick={() => {
            setResultat(null);
            setNomFichier(null);
          }}
          className="mt-5 rounded-md border border-ligne px-4 py-2 text-sm text-encre hover:bg-fond"
        >
          Importer un autre fichier
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex gap-1 rounded-md bg-ligne/50 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("inscrire")}
          className={`flex-1 rounded px-3 py-2 ${
            mode === "inscrire" ? "bg-white text-encre shadow-sm" : "text-sourdine"
          }`}
        >
          Inscrire à cet événement
        </button>
        <button
          type="button"
          onClick={() => setMode("anciens_participants")}
          disabled={!serieId}
          className={`flex-1 rounded px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40 ${
            mode === "anciens_participants" ? "bg-white text-encre shadow-sm" : "text-sourdine"
          }`}
        >
          Ajouter aux anciens participants
        </button>
      </div>
      <p className="mb-4 text-xs text-sourdine">
        {mode === "inscrire"
          ? "Un vrai billet est créé pour chaque contact, comme s'il s'était inscrit lui-même."
          : serieId
          ? "Aucun billet créé — ces contacts pourront simplement recevoir les rappels ciblant les anciens participants, pour être relancés sur une future séance."
          : "Disponible uniquement pour un événement récurrent."}
      </p>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ligne bg-white px-6 py-10 text-center hover:border-indigo">
        <Upload size={24} className="text-sourdine" />
        <span className="text-sm font-medium text-encre">
          {nomFichier ?? "Choisir un fichier .xlsx, .xls ou .csv"}
        </span>
        <span className="text-xs text-sourdine">Clique ou dépose le fichier ici</span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={lireFichier}
          className="hidden"
        />
      </label>

      {erreurLecture && (
        <p className="mt-3 flex items-center gap-2 text-sm text-corail">
          <AlertTriangle size={15} />
          {erreurLecture}
        </p>
      )}

      {contacts.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-encre">
            {contacts.length} contact(s) détecté(s) — aperçu des 5 premiers :
          </p>
          <div className="mt-2 overflow-hidden rounded-lg border border-ligne">
            <table className="w-full text-sm">
              <thead className="bg-fond text-xs uppercase text-sourdine">
                <tr>
                  <th className="px-3 py-2 text-left">Prénom</th>
                  <th className="px-3 py-2 text-left">Nom</th>
                  <th className="px-3 py-2 text-left">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ligne bg-white">
                {contacts.slice(0, 5).map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{c.prenom || "—"}</td>
                    <td className="px-3 py-2">{c.nom || "—"}</td>
                    <td className="px-3 py-2">{c.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mode === "inscrire" && (
            <label className="mt-4 flex items-center gap-2 text-sm text-encre">
              <input
                type="checkbox"
                checked={envoyerEmail}
                onChange={(e) => setEnvoyerEmail(e.target.checked)}
                className="h-4 w-4 rounded border-ligne text-indigo focus:ring-indigo"
              />
              Envoyer le billet par email à chaque personne importée
            </label>
          )}

          <button
            onClick={lancerImport}
            disabled={enCours}
            className="mt-5 rounded-md bg-indigo px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo/90 disabled:opacity-50"
          >
            {enCours
              ? "Import en cours…"
              : `Importer ${contacts.length} contact(s)`}
          </button>
        </div>
      )}
    </div>
  );
}
