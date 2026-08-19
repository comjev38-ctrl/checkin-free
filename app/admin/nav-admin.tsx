"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, UserCircle, Home, LogOut } from "lucide-react";
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

  return (
    <>
      {/* --- Sidebar (écrans moyens et grands) --- */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-ink text-paper md:flex">
        <div className="px-5 py-6">
          <Link href="/" className="font-display text-lg italic">
            CheckIn Free
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-paper/60 hover:bg-paper/10 hover:text-paper"
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
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
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
          <BoutonDeconnexion className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-paper/60 hover:bg-paper/10 hover:text-paper">
            <LogOut size={18} />
            Déconnexion
          </BoutonDeconnexion>
        </div>
      </aside>

      {/* --- Barre compacte (mobile) --- */}
      <header className="sticky top-0 z-20 border-b border-line bg-white md:hidden">
        <div className="flex items-center justify-between gap-2 overflow-x-auto px-4 py-3">
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="rounded-md px-2.5 py-2 text-sm text-stone hover:bg-line/30"
            >
              Accueil
            </Link>
            {LIENS.map(({ href, label, exact }) => {
              const actif = estActif(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`whitespace-nowrap rounded-md px-2.5 py-2 text-sm ${
                    actif ? "bg-ink text-paper" : "text-stone hover:bg-line/30"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <BoutonDeconnexion className="whitespace-nowrap rounded-md px-2.5 py-2 text-sm text-stone hover:bg-line/30" />
        </div>
      </header>
    </>
  );
}
