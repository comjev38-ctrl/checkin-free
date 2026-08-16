import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { genererQrDataUrl } from "@/lib/qrcode";

export const revalidate = 0;

export default async function PageBillet({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, nom, code, statut, event:events(titre, date_debut, lieu)")
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
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-emerald">
          Billet confirmé
        </p>

        <div className="ticket-stub flex overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          {/* Souche : informations */}
          <div className="ticket-notch-right relative flex-1 p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-stone">
              CheckIn Free
            </p>
            <h1 className="mt-2 font-display text-2xl italic leading-snug text-ink">
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
              <p className="text-ink">{ticket.nom}</p>
            </div>
          </div>

          {/* Perforation */}
          <div className="ticket-perforation my-4" />

          {/* Coupon : QR code */}
          <div className="flex w-40 shrink-0 flex-col items-center justify-center gap-3 p-4">
            <img src={qr} alt="QR code du billet" className="w-full" />
            <p className="font-mono text-[11px] tracking-widest text-ink">
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
    </main>
  );
}
