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
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
        {retour ? (
          <Link
            href={retour.href}
            className="flex min-w-0 items-center gap-1.5 text-xs text-sourdine hover:text-encre sm:text-sm"
          >
            <ArrowLeft size={16} className="shrink-0" />
            <span className="truncate">{retour.label}</span>
          </Link>
        ) : (
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 font-sans text-base font-bold text-encre sm:gap-2 sm:text-lg"
          >
            <Logo size={22} />
            <span className="whitespace-nowrap">CheckIn Free</span>
          </Link>
        )}
        <Link
          href="/admin"
          className="shrink-0 whitespace-nowrap rounded-lg bg-indigo px-3 py-1.5 text-xs font-semibold text-white shadow-carte transition hover:bg-indigo/90 sm:px-4 sm:py-2 sm:text-sm"
        >
          <span className="sm:hidden">Admin</span>
          <span className="hidden sm:inline">Espace organisateur</span>
        </Link>
      </div>
    </header>
  );
}
