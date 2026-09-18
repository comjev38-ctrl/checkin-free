import EntetePublique from "@/components/entete-publique";
import PiedDePage from "@/components/pied-de-page";

export default function LayoutLegal({
  titre,
  majLe,
  children,
}: {
  titre: string;
  majLe: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-fond">
      <EntetePublique />
      <div className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="font-sans text-3xl font-bold text-encre">{titre}</h1>
        <p className="mt-1 text-xs text-sourdine">Dernière mise à jour : {majLe}</p>
        <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-encre">
          {children}
        </div>
      </div>
      <PiedDePage />
    </main>
  );
}
