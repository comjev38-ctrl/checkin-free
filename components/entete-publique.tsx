import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EntetePublique({
  retour,
}: {
  retour?: { href: string; label: string };
}) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-4">
        {retour ? (
          <Link
            href={retour.href}
            className="flex items-center gap-1.5 text-sm text-stone hover:text-ink"
          >
            <ArrowLeft size={16} />
            {retour.label}
          </Link>
        ) : (
          <Link href="/" className="font-display text-lg italic text-ink">
            CheckIn Free
          </Link>
        )}
        <Link
          href="/admin"
          className="rounded-md px-3 py-1.5 text-sm text-stone hover:bg-line/30 hover:text-ink"
        >
          Espace organisateur
        </Link>
      </div>
    </header>
  );
}
