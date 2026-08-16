import Link from "next/link";
import BoutonDeconnexion from "./bouton-deconnexion";

export default function NavAdmin({ email }: { email: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <nav className="flex items-center gap-5 font-mono text-xs uppercase tracking-wide">
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
          <span className="hidden text-stone sm:inline">{email}</span>
          <BoutonDeconnexion />
        </div>
      </div>
    </header>
  );
}
