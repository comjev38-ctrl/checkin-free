import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/logo";

export default function EntetePublique({
  retour,
}: {
  retour?: { href: string; label: string };
}) {
  return (
    <header className="border-b border-ligne bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-4">
        {retour ? (
          <Link
            href={retour.href}
            className="flex items-center gap-1.5 text-sm text-sourdine hover:text-encre"
          >
            <ArrowLeft size={16} />
            {retour.label}
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2 font-sans text-lg font-bold text-encre">
            <Logo size={26} />
            CheckIn Free
          </Link>
        )}
        <Link
          href="/admin"
          className="rounded-lg bg-indigo px-4 py-2 text-sm font-semibold text-white shadow-carte transition hover:bg-indigo/90"
        >
          Espace organisateur
        </Link>
      </div>
    </header>
  );
}
