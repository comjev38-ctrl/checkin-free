"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Users, Ticket as TicketIcon } from "lucide-react";

type AncienContact = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  created_at: string;
};

type Inscrit = {
  id: string;
  prenom: string | null;
  nom: string;
  email: string | null;
  statut: string;
  created_at: string;
};

export default function ListeContacts({
  anciensContacts: anciensInitiaux,
  inscrits: inscritsInitiaux,
}: {
  anciensContacts: AncienContact[];
  inscrits: Inscrit[];
}) {
  const [onglet, setOnglet] = useState<"anciens" | "nouveaux">("anciens");
  const [anciens, setAnciens] = useState(anciensInitiaux);
  const [inscrits, setInscrits] = useState(inscritsInitiaux);
  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null);

  async function supprimerAncien(c: AncienContact) {
    if (!window.confirm(`Retirer ${c.prenom} ${c.nom} des anciens participants ?`)) return;
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

      {onglet === "anciens" ? (
        <div className="mt-4 divide-y divide-ligne rounded-lg border border-ligne bg-white">
          {anciens.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-sourdine">
              Aucun ancien participant pour l&apos;instant. Importe un fichier
              en choisissant &laquo;&nbsp;Ajouter aux anciens
              participants&nbsp;&raquo; pour en ajouter.
            </p>
          ) : (
            anciens.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-encre">
                    {c.prenom} {c.nom}
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
          {inscrits.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-sourdine">
              Aucun inscrit pour l&apos;instant.
            </p>
          ) : (
            inscrits.map((t) => (
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
