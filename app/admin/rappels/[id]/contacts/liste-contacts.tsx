"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Users, Ticket as TicketIcon, Search, ArrowDownAZ, Clock, Download } from "lucide-react";

type AncienParticipant = {
  id: string;
  prenom: string | null;
  nom: string | null;
  email: string;
  created_at: string;
  source: "import" | "historique";
  dejaInscrit: boolean;
};

type Inscrit = {
  id: string;
  prenom: string | null;
  nom: string;
  email: string | null;
  statut: string;
  created_at: string;
};

function nomComplet(p: string | null, n: string | null) {
  return [p, n].filter(Boolean).join(" ") || "—";
}

function exporterCSV(lignes: string[][], entetes: string[], nomFichier: string) {
  const echapper = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const contenu = [entetes, ...lignes]
    .map((ligne) => ligne.map(echapper).join(";"))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + contenu], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ListeContacts({
  anciensParticipants: anciensInitiaux,
  inscrits: inscritsInitiaux,
}: {
  anciensParticipants: AncienParticipant[];
  inscrits: Inscrit[];
}) {
  const [onglet, setOnglet] = useState<"anciens" | "nouveaux">("anciens");
  const [anciens, setAnciens] = useState(anciensInitiaux);
  const [inscrits, setInscrits] = useState(inscritsInitiaux);
  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<"recent" | "alpha">("recent");

  async function supprimerAncien(c: AncienParticipant) {
    if (c.source === "historique") {
      window.alert(
        "Cette personne vient de l'historique des billets d'une séance passée — elle ne peut pas être retirée d'ici. Supprime plutôt son billet depuis la page Inscrits de la séance concernée si besoin."
      );
      return;
    }
    if (!window.confirm(`Retirer ${nomComplet(c.prenom, c.nom)} des anciens participants ?`)) return;
    setSuppressionEnCours(c.id);
    const supabase = createClient();
    const { error } = await supabase.from("anciens_contacts").delete().eq("id", c.id);
    setSuppressionEnCours(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    setAnciens((prev) => prev.filter((x) => x.id !== c.id));
  }

  async function supprimerInscrit(t: Inscrit) {
    if (!window.confirm(`Supprimer le billet de ${t.prenom} ${t.nom} ?`)) return;
    setSuppressionEnCours(t.id);
    const supabase = createClient();
    const { error } = await supabase.from("tickets").delete().eq("id", t.id);
    setSuppressionEnCours(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    setInscrits((prev) => prev.filter((x) => x.id !== t.id));
  }

  const anciensFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    let liste = !q
      ? anciens
      : anciens.filter(
          (c) =>
            nomComplet(c.prenom, c.nom).toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        );
    liste = [...liste];
    if (tri === "alpha") {
      liste.sort((a, b) => nomComplet(a.prenom, a.nom).localeCompare(nomComplet(b.prenom, b.nom)));
    } else {
      liste.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return liste;
  }, [anciens, recherche, tri]);

  const inscritsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    let liste = !q
      ? inscrits
      : inscrits.filter(
          (t) =>
            nomComplet(t.prenom, t.nom).toLowerCase().includes(q) ||
            (t.email ?? "").toLowerCase().includes(q)
        );
    liste = [...liste];
    if (tri === "alpha") {
      liste.sort((a, b) => nomComplet(a.prenom, a.nom).localeCompare(nomComplet(b.prenom, b.nom)));
    } else {
      liste.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return liste;
  }, [inscrits, recherche, tri]);

  function exporter() {
    if (onglet === "anciens") {
      exporterCSV(
        anciensFiltres.map((c) => [
          c.prenom ?? "",
          c.nom ?? "",
          c.email,
          c.source === "import" ? "Importé" : "Historique billets",
          c.dejaInscrit ? "Oui" : "Non",
        ]),
        ["Prénom", "Nom", "Email", "Origine", "Déjà inscrit à la prochaine"],
        "anciens-participants.csv"
      );
    } else {
      exporterCSV(
        inscritsFiltres.map((t) => [
          t.prenom ?? "",
          t.nom,
          t.email ?? "",
          t.statut === "utilise" ? "Arrivé" : "Inscrit",
        ]),
        ["Prénom", "Nom", "Email", "Statut"],
        "inscrits-actuels.csv"
      );
    }
  }

  return (
    <div className="mt-6">
      <div className="flex gap-1 rounded-md bg-ligne/50 p-1 text-sm">
        <button
          onClick={() => setOnglet("anciens")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-2 ${
            onglet === "anciens" ? "bg-white text-encre shadow-sm" : "text-sourdine"
          }`}
        >
          <Users size={14} />
          Anciens participants ({anciens.length})
        </button>
        <button
          onClick={() => setOnglet("nouveaux")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-2 ${
            onglet === "nouveaux" ? "bg-white text-encre shadow-sm" : "text-sourdine"
          }`}
        >
          <TicketIcon size={14} />
          Inscrits actuels ({inscrits.length})
        </button>
      </div>

      {/* Barre de recherche, tri, export */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sourdine" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un nom ou un email…"
            className="w-full rounded-md border border-ligne bg-white py-2 pl-9 pr-3 text-sm text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
          />
        </div>
        <button
          onClick={() => setTri(tri === "alpha" ? "recent" : "alpha")}
          title={tri === "alpha" ? "Trié par ordre alphabétique" : "Trié par plus récent"}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm ${
            tri === "alpha"
              ? "border-indigo bg-indigo/5 text-indigo"
              : "border-ligne text-sourdine hover:bg-fond"
          }`}
        >
          {tri === "alpha" ? <ArrowDownAZ size={15} /> : <Clock size={15} />}
          {tri === "alpha" ? "A → Z" : "Récent"}
        </button>
        <button
          onClick={exporter}
          className="flex items-center gap-1.5 rounded-md border border-ligne px-3 py-2 text-sm text-encre hover:bg-fond"
        >
          <Download size={15} />
          Exporter CSV
        </button>
      </div>

      {onglet === "anciens" ? (
        <div className="mt-4 divide-y divide-ligne rounded-lg border border-ligne bg-white">
          {anciensFiltres.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-sourdine">
              {anciens.length === 0
                ? "Aucun ancien participant pour l'instant — ni dans l'historique des billets, ni importé manuellement."
                : "Aucun résultat pour cette recherche."}
            </p>
          ) : (
            anciensFiltres.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="flex flex-wrap items-center gap-1.5 text-sm text-encre">
                    {nomComplet(c.prenom, c.nom)}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        c.source === "historique"
                          ? "bg-indigo/10 text-indigo"
                          : "bg-ambre-clair text-ambre"
                      }`}
                    >
                      {c.source === "historique" ? "Historique billets" : "Importé"}
                    </span>
                    {c.dejaInscrit && (
                      <span className="rounded-full bg-vert/15 px-2 py-0.5 text-[10px] font-medium text-vert">
                        Déjà inscrit à la prochaine
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-sourdine">{c.email}</p>
                </div>
                <button
                  onClick={() => supprimerAncien(c)}
                  disabled={suppressionEnCours === c.id}
                  className="rounded-md p-2 text-sourdine hover:bg-corail/10 hover:text-corail disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mt-4 divide-y divide-ligne rounded-lg border border-ligne bg-white">
          {inscritsFiltres.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-sourdine">
              {inscrits.length === 0 ? "Aucun inscrit pour l'instant." : "Aucun résultat pour cette recherche."}
            </p>
          ) : (
            inscritsFiltres.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-encre">
                    {t.prenom} {t.nom}
                    {t.statut === "utilise" && (
                      <span className="ml-2 rounded-full bg-vert/15 px-2 py-0.5 text-[10px] font-medium text-vert">
                        Arrivé
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-sourdine">{t.email ?? "—"}</p>
                </div>
                <button
                  onClick={() => supprimerInscrit(t)}
                  disabled={suppressionEnCours === t.id}
                  className="rounded-md p-2 text-sourdine hover:bg-corail/10 hover:text-corail disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
