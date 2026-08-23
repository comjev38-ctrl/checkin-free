import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { genererQrDataUrl } from "@/lib/qrcode";
import EntetePublique from "@/components/entete-publique";
import { CheckCircle2 } from "lucide-react";

export const revalidate = 0;

export default async function PageBillet({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServiceClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, prenom, nom, code, statut, event:events(titre, slug, date_debut, heure_fin, lieu)")
    .eq("id", params.id)
    .single();

  if (!ticket) notFound();

  const event = Array.isArray(ticket.event) ? ticket.event[0] : ticket.event;
  const qr = await genererQrDataUrl(ticket.code);
  const dateEvenement = new Date(event.date_debut).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const utilise = ticket.statut === "utilise";
  const heureFinAffichee = event.heure_fin
    ? event.heure_fin.slice(0, 5).replace(":", "h")
    : null;

  return (
    <main className="min-h-screen bg-fond">
      <EntetePublique
        retour={{ href: `/evenement/${event.slug}`, label: "Retour à l'événement" }}
      />
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-center gap-2 text-indigo">
            <CheckCircle2 size={18} />
            <p className="text-sm font-semibold uppercase tracking-wide">
              Billet confirmé
            </p>
          </div>

          <div
            className={`carte-liseree overflow-hidden rounded-2xl border border-ligne bg-white shadow-carte ${
              utilise ? "border-l-sourdine" : "border-l-indigo"
            }`}
          >
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-sourdine">
                CheckIn Free
              </p>
              <h1 className="mt-2 text-xl font-bold leading-snug text-encre sm:text-2xl">
                {event.titre}
              </h1>
              <div className="mt-4 space-y-1 text-sm text-encre/80">
                <p className="capitalize">
                  {dateEvenement}
                  {heureFinAffichee && <> – {heureFinAffichee}</>}
                </p>
                {event.lieu && <p>{event.lieu}</p>}
              </div>

              <div className="mt-6 flex items-center gap-5 rounded-xl bg-fond p-4">
                <img
                  src={qr}
                  alt="QR code du billet"
                  className="h-24 w-24 shrink-0 rounded-lg bg-white p-1.5"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sourdine">
                    Titulaire
                  </p>
                  <p className="truncate text-encre">
                    {[ticket.prenom, ticket.nom].filter(Boolean).join(" ")}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-sourdine">
                    Code
                  </p>
                  <p className="break-all font-mono text-xs text-encre">
                    {ticket.code}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-sourdine">
            Présente ce QR code — ou le code ci-dessus — à l&apos;entrée.
            {utilise && " Ce billet a déjà été utilisé pour un contrôle d'accès."}
          </p>
        </div>
      </div>
    </main>
  );
}
