import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { genererQrDataUrl } from "@/lib/qrcode";
import EntetePublique from "@/components/entete-publique";

export const revalidate = 0;

export default async function PageBillet({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServiceClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, prenom, nom, code, statut, event:events(titre, slug, date_debut, lieu)")
    .eq("id", params.id)
    .single();

  if (!ticket) notFound();

  const event = Array.isArray(ticket.event) ? ticket.event[0] : ticket.event;
  const qr = await genererQrDataUrl(ticket.code);
  const dateEvenement = new Date(event.date_debut).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-paper">
      <EntetePublique
        retour={{ href: `/evenement/${event.slug}`, label: "Retour à l'événement" }}
      />
      <div className="flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-violet">
          Billet confirmé
        </p>

        <div className="ticket-stub flex overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          {/* Souche : informations */}
          <div className="ticket-notch-right relative flex-1 p-4 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-stone">
              CheckIn Free
            </p>
            <h1 className="mt-2 font-display text-xl italic leading-snug text-ink sm:text-2xl">
              {event.titre}
            </h1>
            <div className="mt-4 space-y-1 text-sm text-ink/80">
              <p className="capitalize">{dateEvenement}</p>
              {event.lieu && <p>{event.lieu}</p>}
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <p className="font-mono text-[10px] uppercase text-stone">
                Titulaire
              </p>
              <p className="text-ink">
                {[ticket.prenom, ticket.nom].filter(Boolean).join(" ")}
              </p>
            </div>
          </div>

          {/* Perforation */}
          <div className="ticket-perforation my-4" />

          {/* Coupon : QR code */}
          <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-3 p-3 sm:w-40 sm:p-4">
            <img src={qr} alt="QR code du billet" className="w-full" />
            <p className="break-all text-center font-mono text-[10px] tracking-widest text-ink sm:text-[11px]">
              {ticket.code}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-stone">
          Présente ce QR code — ou le code ci-dessus — à l&apos;entrée.
          {ticket.statut === "utilise" &&
            " Ce billet a déjà été utilisé pour un contrôle d'accès."}
        </p>
      </div>
      </div>
    </main>
  );
}
