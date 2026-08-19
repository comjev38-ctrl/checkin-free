"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, UserCircle, Home, LogOut, Menu, X } from "lucide-react";
import BoutonDeconnexion from "./bouton-deconnexion";

const LIENS = [
  { href: "/admin", label: "Mes événements", icon: CalendarDays, exact: true },
  { href: "/admin/membres", label: "Membres", icon: Users },
  { href: "/admin/compte", label: "Mon compte", icon: UserCircle },
];

function estActif(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export default function NavAdmin({ nomAffiche }: { nomAffiche: string }) {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);

  // Ferme le menu automatiquement à chaque changement de page.
  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  return (
    <>
      {/* Barre du haut, toujours visible : bouton hamburger + logo */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3">
        <button
          onClick={() => setOuvert(true)}
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-line/30"
        >
          <Menu size={22} />
        </button>
        <Link href="/" className="font-display text-lg italic text-ink">
          CheckIn Free
        </Link>
        <div className="w-10" />
      </header>

      {/* Fond assombri quand le menu est ouvert */}
      {ouvert && (
        <div
          onClick={() => setOuvert(false)}
          className="fixed inset-0 z-30 bg-ink/40"
          aria-hidden="true"
        />
      )}

      {/* Panneau latéral déroulant */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col bg-ink text-paper transition-transform duration-200 ${
          ouvert ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/" className="font-display text-lg italic">
            CheckIn Free
          </Link>
          <button
            onClick={() => setOuvert(false)}
            aria-label="Fermer le menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-paper/70 hover:bg-paper/10 hover:text-paper"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-paper/60 hover:bg-paper/10 hover:text-paper"
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
                className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors ${
                  actif
                    ? "bg-paper/10 text-paper"
                    : "text-paper/60 hover:bg-paper/10 hover:text-paper"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-paper/10 px-3 py-4">
          <p className="truncate px-3 pb-2 text-xs text-paper/50">{nomAffiche}</p>
          <BoutonDeconnexion className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm text-paper/60 hover:bg-paper/10 hover:text-paper">
            <LogOut size={18} />
            Déconnexion
          </BoutonDeconnexion>
        </div>
      </aside>
    </>
  );
}
