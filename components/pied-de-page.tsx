import Link from "next/link";

export default function PiedDePage() {
  return (
    <footer className="border-t border-ligne bg-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-sourdine">
        <span>CheckIn Free — billetterie associative gratuite</span>
        <div className="flex flex-wrap gap-4">
          <Link href="/mentions-legales" className="hover:text-encre hover:underline">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="hover:text-encre hover:underline">
            Confidentialité
          </Link>
          <Link href="/cgu" className="hover:text-encre hover:underline">
            CGU
          </Link>
        </div>
      </div>
    </footer>
  );
}
