"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Event = {
  id: string;
  titre: string;
  date_debut: string;
  capacite_max: number | null;
  statut: "brouillon" | "publie" | "clos";
};

type DernierScan = {
  nom: string;
  scanned_at: string;
} | null;

type PointSerie = {
  t: number;
  inscriptions: number;
  arrivees: number;
};

function decouperCompteARebours(cibleMs: number) {
  const diff = cibleMs - Date.now();
  if (diff <= 0) return null;
  const jours = Math.floor(diff / 86_400_000);
  const heures = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const secondes = Math.floor((diff % 60_000) / 1000);
  return { jours, heures, minutes, secondes };
}

function formaterHeure(t: number) {
  return new Date(t).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TableauStatsLive({ event }: { event: Event }) {
  const [nbBillets, setNbBillets] = useState<number | null>(null);
  const [nbCheckins, setNbCheckins] = useState<number | null>(null);
  const [dernierScan, setDernierScan] = useState<DernierScan>(null);
  const [serie, setSerie] = useState<PointSerie[]>([]);
  const [compteARebours, setCompteARebours] = useState(() =>
    decouperCompteARebours(new Date(event.date_debut).getTime())
  );
  const [connecteLive, setConnecteLive] = useState(false);

  const rafraichir = useCallback(async () => {
    const supabase = createClient();

    const [
      { count: totalBillets },
      { count: totalCheckins },
      { data: dernier },
      { data: billetsHoraires },
      { data: scansHoraires },
    ] = await Promise.all([
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)
        .neq("statut", "annule"),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("statut", "utilise"),
      supabase
        .from("checkins")
        .select("scanned_at, tickets!inner(prenom, nom, event_id)")
        .eq("tickets.event_id", event.id)
        .order("scanned_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("tickets")
        .select("created_at")
        .eq("event_id", event.id)
        .neq("statut", "annule")
        .order("created_at", { ascending: true }),
      supabase
        .from("checkins")
        .select("scanned_at, tickets!inner(event_id)")
        .eq("tickets.event_id", event.id)
        .order("scanned_at", { ascending: true }),
    ]);

    setNbBillets(totalBillets ?? 0);
    setNbCheckins(totalCheckins ?? 0);
    if (dernier) {
      const t = Array.isArray(dernier.tickets)
        ? dernier.tickets[0]
        : dernier.tickets;
      const nomComplet = [t?.prenom, t?.nom].filter(Boolean).join(" ");
      setDernierScan({ nom: nomComplet || "—", scanned_at: dernier.scanned_at });
    }

    // Construit une courbe cumulative unique à partir de deux flux
    // d'événements horodatés (inscriptions et arrivées scannées).
    const points: { t: number; type: "i" | "a" }[] = [
      ...(billetsHoraires ?? []).map((b) => ({
        t: new Date(b.created_at).getTime(),
        type: "i" as const,
      })),
      ...(scansHoraires ?? []).map((s) => ({
        t: new Date(s.scanned_at).getTime(),
        type: "a" as const,
      })),
    ].sort((a, b) => a.t - b.t);

    let cumulInscriptions = 0;
    let cumulArrivees = 0;
    const nouvelleSerie: PointSerie[] = points.map((p) => {
      if (p.type === "i") cumulInscriptions++;
      else cumulArrivees++;
      return { t: p.t, inscriptions: cumulInscriptions, arrivees: cumulArrivees };
    });
    setSerie(nouvelleSerie);
  }, [event.id]);

  // Chargement initial + abonnement temps réel (billets + check-ins)
  useEffect(() => {
    rafraichir();

    const supabase = createClient();
    const canal = supabase
      .channel(`stats-evenement-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `event_id=eq.${event.id}`,
        },
        () => rafraichir()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins" },
        () => rafraichir()
      )
      .subscribe((statut) => setConnecteLive(statut === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(canal);
    };
  }, [event.id, rafraichir]);

  // Compte à rebours, mis à jour chaque seconde
  useEffect(() => {
    const id = setInterval(() => {
      setCompteARebours(
        decouperCompteARebours(new Date(event.date_debut).getTime())
      );
    }, 1000);
    return () => clearInterval(id);
  }, [event.date_debut]);

  const tauxPresence =
    nbBillets && nbBillets > 0 ? Math.round(((nbCheckins ?? 0) / nbBillets) * 100) : 0;
  const tauxRemplissage =
    event.capacite_max && nbBillets != null
      ? Math.min(100, Math.round((nbBillets / event.capacite_max) * 100))
      : null;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-stone">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            connecteLive ? "bg-emerald" : "bg-amber"
          }`}
        />
        {connecteLive ? "Mis à jour en direct" : "Connexion en direct…"}
      </div>

      {compteARebours ? (
        <div className="rounded-xl border border-line bg-white p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">
            Avant le début
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              { valeur: compteARebours.jours, label: "jours" },
              { valeur: compteARebours.heures, label: "heures" },
              { valeur: compteARebours.minutes, label: "min" },
              { valeur: compteARebours.secondes, label: "sec" },
            ].map((bloc) => (
              <div key={bloc.label}>
                <p className="font-display text-3xl italic text-ink">
                  {String(bloc.valeur).padStart(2, "0")}
                </p>
                <p className="font-mono text-[10px] uppercase text-stone">
                  {bloc.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-4 text-center font-mono text-xs uppercase tracking-wide text-emerald">
          Événement en cours ou terminé
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">
            Billets émis
          </p>
          <p className="mt-2 font-display text-4xl italic text-ink">
            {nbBillets ?? "…"}
            {event.capacite_max && (
              <span className="text-lg text-stone"> / {event.capacite_max}</span>
            )}
          </p>
          {tauxRemplissage != null && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-ink transition-all duration-500"
                style={{ width: `${tauxRemplissage}%` }}
              />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">
            Présents (scannés)
          </p>
          <p className="mt-2 font-display text-4xl italic text-ink">
            {nbCheckins ?? "…"}
            <span className="text-lg text-stone"> ({tauxPresence}%)</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-emerald transition-all duration-500"
              style={{ width: `${tauxPresence}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-4 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">
          Évolution
        </p>
        {serie.length >= 2 ? (
          <div className="mt-4 -ml-2 h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DFD5" />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={formaterHeure}
                  stroke="#6B7280"
                  fontSize={11}
                />
                <YAxis allowDecimals={false} stroke="#6B7280" fontSize={11} width={28} />
                <Tooltip
                  labelFormatter={(t) => formaterHeure(t as number)}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    borderColor: "#E3DFD5",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) =>
                    value === "inscriptions" ? "Inscriptions" : "Arrivées"
                  }
                />
                <Line
                  type="stepAfter"
                  dataKey="inscriptions"
                  stroke="#16213E"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="stepAfter"
                  dataKey="arrivees"
                  stroke="#1B7A5B"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 py-8 text-center text-sm text-stone">
            Pas encore assez de données pour tracer une courbe.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-line bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">
          Dernier scan
        </p>
        {dernierScan ? (
          <p className="mt-2 text-ink">
            {dernierScan.nom} —{" "}
            <span className="text-stone">
              {new Date(dernierScan.scanned_at).toLocaleTimeString("fr-FR")}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-stone">Aucun scan pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
