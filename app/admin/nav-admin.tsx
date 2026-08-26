"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, Users, UserCircle, Home, LogOut, Menu, X } from "lucide-react";
import BoutonDeconnexion from "./bouton-deconnexion";
import Logo from "@/components/logo";

const LIENS = [
  { href: "/admin", label: "Mes événements", icon: CalendarDays, exact: true },
  { href: "/admin/membres", label: "Membres", icon: Users },
  { href: "/admin/compte", label: "Mon compte", icon: UserCircle },
];

function estActif(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

function NavAdminInterne({ nomAffiche }: { nomAffiche: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Ouvert automatiquement juste après une connexion (voir
  // /admin/connexion et /admin/compte, qui redirigent vers
  // /admin?menu=1). Le paramètre n'est lu qu'une fois, au montage.
  const [ouvert, setOuvert] = useState(() => searchParams.get("menu") === "1");
  const premierRendu = useRef(true);

  // Referme automatiquement à chaque navigation ultérieure — mais
  // pas au tout premier rendu, sinon ça annulerait l'ouverture
  // automatique ci-dessus.
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    setOuvert(false);
  }, [pathname]);

  return (
    <>
      {/* Barre du haut, toujours visible : bouton hamburger + logo */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ligne bg-white px-4 py-3">
        <button
          onClick={() => setOuvert(true)}
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-encre hover:bg-fond"
        >
          <Menu size={22} />
        </button>
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-encre">
          <Logo size={24} />
          CheckIn Free
        </Link>
        <div className="w-10" />
      </header>

      {/* Fond assombri quand le menu est ouvert */}
      {ouvert && (
        <div
          onClick={() => setOuvert(false)}
          className="fixed inset-0 z-30 bg-encre/30"
          aria-hidden="true"
        />
      )}

      {/* Panneau latéral déroulant — clair, façon le modèle de référence */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-ligne bg-white transition-transform duration-200 ${
          ouvert ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-encre">
            <Logo size={24} />
            CheckIn Free
          </Link>
          <button
            onClick={() => setOuvert(false)}
            aria-label="Fermer le menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sourdine hover:bg-fond hover:text-encre"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-sourdine hover:bg-fond hover:text-encre"
          >
            <Home size={18} />
            Site public
          </Link>
          {LIENS.map(({ href, label, icon: Icon, exact }) => {
            const actif = estActif(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  actif
                    ? "bg-indigo text-white shadow-carte"
                    : "text-sourdine hover:bg-fond hover:text-encre"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-ligne px-3 py-4">
          <p className="truncate px-3 pb-2 text-xs text-sourdine">{nomAffiche}</p>
          <BoutonDeconnexion className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-sourdine hover:bg-fond hover:text-encre">
            <LogOut size={18} />
            Déconnexion
          </BoutonDeconnexion>
        </div>
      </aside>
    </>
  );
}

export default function NavAdmin(props: { nomAffiche: string }) {
  return (
    <Suspense fallback={null}>
      <NavAdminInterne {...props} />
    </Suspense>
  );
}
