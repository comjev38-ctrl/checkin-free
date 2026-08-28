"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/logo";

const CLE_SESSION = "checkin-free-ecran-ouverture-vu";

export default function EcranOuverture() {
  // Par défaut on n'affiche rien tant qu'on n'a pas vérifié la
  // session (évite un flash sur les navigations internes) — seul le
  // tout premier chargement de l'app dans cet onglet déclenche
  // l'animation.
  const [etape, setEtape] = useState<"attente" | "logo" | "texte" | "sortie" | "fini">(
    "attente"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dejaVu = window.sessionStorage.getItem(CLE_SESSION);
    if (dejaVu) {
      setEtape("fini");
      return;
    }
    window.sessionStorage.setItem(CLE_SESSION, "1");

    setEtape("logo");
    const t1 = setTimeout(() => setEtape("texte"), 450);
    const t2 = setTimeout(() => setEtape("sortie"), 1500);
    const t3 = setTimeout(() => setEtape("fini"), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (etape === "fini" || etape === "attente") return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center bg-encre transition-opacity duration-[400ms] ${
        etape === "sortie" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={`transition-all duration-500 ease-out ${
            etape === "logo"
              ? "scale-50 opacity-0"
              : "scale-100 opacity-100"
          }`}
        >
          <Logo size={72} />
        </div>
        <span
          className={`font-sans text-xl font-bold text-white transition-all duration-500 ease-out ${
            etape === "logo" ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          CheckIn Free
        </span>
      </div>
    </div>
  );
}
