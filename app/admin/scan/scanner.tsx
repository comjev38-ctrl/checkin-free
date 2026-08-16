"use client";

import { useEffect, useRef, useState } from "react";

type Resultat = {
  statut: "ok" | "deja_utilise" | "invalide";
  nom?: string;
  message: string;
};

export default function Scanner({ eventId }: { eventId: string }) {
  const [modeManuel, setModeManuel] = useState(false);
  const [codeManuel, setCodeManuel] = useState("");
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [verificationEnCours, setVerificationEnCours] = useState(false);
  const scannerRef = useRef<any>(null);
  const dernierCodeScanne = useRef<string | null>(null);

  async function verifierBillet(code: string) {
    if (verificationEnCours || code === dernierCodeScanne.current) return;
    dernierCodeScanne.current = code;
    setVerificationEnCours(true);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, code }),
      });
      const data = await res.json();
      setResultat(data);
    } catch {
      setResultat({ statut: "invalide", message: "Erreur réseau, réessaie." });
    } finally {
      setVerificationEnCours(false);
      // Autorise un nouveau scan du même code après 3s (ex: erreur réseau)
      setTimeout(() => {
        dernierCodeScanne.current = null;
      }, 3000);
    }
  }

  useEffect(() => {
    if (modeManuel) return;
    let actif = true;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (!actif) return;
      const scanner = new Html5Qrcode("lecteur-qr");
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (texteDecode: string) => verifierBillet(texteDecode.trim()),
          () => {}
        )
        .catch(() => {
          setModeManuel(true);
        });
    });

    return () => {
      actif = false;
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeManuel]);

  const couleurResultat =
    resultat?.statut === "ok"
      ? "bg-emerald text-paper"
      : resultat?.statut === "deja_utilise"
      ? "bg-amber text-ink"
      : "bg-rose text-paper";

  return (
    <main className="flex min-h-screen flex-col bg-ink px-6 py-8 text-paper">
      <div className="mx-auto w-full max-w-sm flex-1">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald">
          Contrôle d&apos;accès
        </p>
        <h1 className="mt-1 font-display text-2xl italic">
          Scanner les billets
        </h1>

        {!modeManuel ? (
          <div className="mt-6 overflow-hidden rounded-lg" id="lecteur-qr" />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifierBillet(codeManuel.trim());
            }}
            className="mt-6 space-y-3"
          >
            <input
              autoFocus
              value={codeManuel}
              onChange={(e) => setCodeManuel(e.target.value)}
              placeholder="Code du billet"
              className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-3 font-mono text-paper outline-none placeholder:text-paper/40"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-emerald px-5 py-3 font-medium text-paper hover:bg-emerald/90"
            >
              Vérifier
            </button>
          </form>
        )}

        <button
          onClick={() => setModeManuel(!modeManuel)}
          className="mt-4 font-mono text-xs uppercase tracking-wide text-paper/50 hover:text-paper"
        >
          {modeManuel ? "← Revenir à la caméra" : "Saisir le code manuellement →"}
        </button>

        {resultat && (
          <div className={`mt-8 rounded-lg p-5 ${couleurResultat}`}>
            <p className="font-display text-2xl italic">
              {resultat.statut === "ok" && "Accès validé"}
              {resultat.statut === "deja_utilise" && "Déjà scanné"}
              {resultat.statut === "invalide" && "Billet invalide"}
            </p>
            {resultat.nom && <p className="mt-1">{resultat.nom}</p>}
            <p className="mt-1 text-sm opacity-90">{resultat.message}</p>
          </div>
        )}
      </div>
    </main>
  );
}
