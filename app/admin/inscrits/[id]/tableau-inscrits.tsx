"use client";

import { useMemo, useState } from "react";

type Ticket = {
  id: string;
  prenom: string | null;
  nom: string;
  email: string | null;
  statut: "valide" | "utilise" | "annule";
  created_at: string;
  checkins: { scanned_at: string }[] | null;
};

export default function TableauInscrits({
  eventTitre,
  tickets,
}: {
  eventTitre: string;
  tickets: Ticket[];
}) {
  const [filtre, setFiltre] = useState<"tous" | "arrives" | "pas_arrives">("tous");
  const [copieFaite, setCopieFaite] = useState(false);

  const billetsActifs = useMemo(
    () => tickets.filter((t) => t.statut !== "annule"),
    [tickets]
  );

  const listeFiltree = useMemo(() => {
    if (filtre === "arrives") return billetsActifs.filter((t) => t.statut === "utilise");
    if (filtre === "pas_arrives")
      return billetsActifs.filter((t) => t.statut !== "utilise");
    return billetsActifs;
  }, [billetsActifs, filtre]);

  const nbArrives = billetsActifs.filter((t) => t.statut === "utilise").length;

  function nomComplet(t: Ticket) {
    return [t.prenom, t.nom].filter(Boolean).join(" ");
  }

  function formaterDateCSV(d: Date) {
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }

  function heureScan(t: Ticket) {
    const scan = t.checkins?.[0]?.scanned_at;
    return scan
      ? new Date(scan).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
      : null;
  }

  // ---------- Export CSV ----------
  function exporterCSV() {
    const echapper = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const entetes = ["Prénom", "Nom", "Email", "Statut", "Inscrit le", "Arrivé le"];
    const lignes = billetsActifs.map((t) => [
      t.prenom ?? "",
      t.nom,
      t.email ?? "",
      t.statut === "utilise" ? "Arrivé" : "Inscrit",
      t.created_at ? formaterDateCSV(new Date(t.created_at)) : "",
      t.checkins?.[0]?.scanned_at
        ? formaterDateCSV(new Date(t.checkins[0].scanned_at))
        : "",
    ]);

    // Point-virgule : compatible Excel en français (sinon tout finit
    // dans une seule colonne à l'ouverture).
    const csv =
      "\uFEFF" +
      [entetes, ...lignes]
        .map((ligne) => ligne.map(echapper).join(";"))
        .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscrits-${eventTitre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Texte formaté (copie / WhatsApp) ----------
  function construireTexte() {
    const lignes = billetsActifs.map((t, i) => {
      const puce = t.statut === "utilise" ? "✅" : "⬜";
      return `${i + 1}. ${nomComplet(t)} ${puce}`;
    });
    return [
      `📋 ${eventTitre} — ${billetsActifs.length} inscrit(s), ${nbArrives} arrivé(s)`,
      "",
      ...lignes,
      "",
      "✅ = présent  ⬜ = pas encore arrivé",
    ].join("\n");
  }

  async function copierTexte() {
    await navigator.clipboard.writeText(construireTexte());
    setCopieFaite(true);
    setTimeout(() => setCopieFaite(false), 2000);
  }

  function partagerWhatsApp() {
    const texte = construireTexte();
    window.open(`https://wa.me/?text=${encodeURIComponent(texte)}`, "_blank");
  }

  const texteLong = construireTexte().length > 1500;

  return (
    <div className="mt-8">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="font-mono text-[10px] uppercase text-stone">Inscrits</p>
          <p className="mt-1 font-display text-2xl italic text-ink">
            {billetsActifs.length}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="font-mono text-[10px] uppercase text-stone">Arrivés</p>
          <p className="mt-1 font-display text-2xl italic text-emerald">{nbArrives}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="font-mono text-[10px] uppercase text-stone">En attente</p>
          <p className="mt-1 font-display text-2xl italic text-ink">
            {billetsActifs.length - nbArrives}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md bg-line/50 p-1 font-mono text-[11px] uppercase">
          {[
            { valeur: "tous", label: "Tous" },
            { valeur: "arrives", label: "Arrivés" },
            { valeur: "pas_arrives", label: "En attente" },
          ].map((opt) => (
            <button
              key={opt.valeur}
              onClick={() => setFiltre(opt.valeur as typeof filtre)}
              className={`rounded px-3 py-1.5 ${
                filtre === opt.valeur ? "bg-white text-ink shadow-sm" : "text-stone"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exporterCSV}
            disabled={billetsActifs.length === 0}
            className="rounded-md border border-line bg-white px-3 py-2 font-mono text-xs uppercase text-ink hover:bg-line/30 disabled:opacity-40"
          >
            Exporter CSV
          </button>
          <button
            onClick={copierTexte}
            disabled={billetsActifs.length === 0}
            className="rounded-md border border-line bg-white px-3 py-2 font-mono text-xs uppercase text-ink hover:bg-line/30 disabled:opacity-40"
          >
            {copieFaite ? "Copié ✓" : "Copier en texte"}
          </button>
          <button
            onClick={partagerWhatsApp}
            disabled={billetsActifs.length === 0}
            title={
              texteLong
                ? "Liste longue : si WhatsApp n'ouvre pas le texte complet, utilise plutôt « Copier en texte »"
                : undefined
            }
            className="rounded-md bg-emerald px-3 py-2 font-mono text-xs uppercase text-paper hover:bg-emerald/90 disabled:opacity-40"
          >
            Partager sur WhatsApp
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[11px] uppercase text-stone">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {listeFiltree.length ? (
              listeFiltree.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-ink">{nomComplet(t)}</td>
                  <td className="px-4 py-3 text-stone">{t.email ?? "—"}</td>
                  <td className="px-4 py-3 text-stone">
                    {new Date(t.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {t.statut === "utilise" ? (
                      <span className="text-emerald">
                        Arrivé{heureScan(t) ? ` · ${heureScan(t)}` : ""}
                      </span>
                    ) : (
                      <span className="text-stone">En attente</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-stone">
                  Aucun inscrit dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
