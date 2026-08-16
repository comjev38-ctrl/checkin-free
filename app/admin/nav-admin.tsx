import Link from "next/link";
import BoutonDeconnexion from "./bouton-deconnexion";

export default function NavAdmin({ nomAffiche }: { nomAffiche: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-wide">
          <Link href="/admin" className="text-ink hover:underline">
            Mes événements
          </Link>
          <Link href="/admin/membres" className="text-stone hover:text-ink hover:underline">
            Membres
          </Link>
          <Link href="/admin/compte" className="text-stone hover:text-ink hover:underline">
            Mon compte
          </Link>
        </nav>
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="hidden text-stone md:inline">{nomAffiche}</span>
          <BoutonDeconnexion />
        </div>
      </div>
    </header>
  );
}
