import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { ticketId } = await req.json();
  if (!ticketId) {
    return NextResponse.json({ message: "Billet requis." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, statut")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return NextResponse.json({ message: "Billet introuvable." }, { status: 404 });
  }

  if (ticket.statut === "utilise") {
    return NextResponse.json(
      { message: "Ce billet a déjà été scanné à l'entrée, il ne peut plus être annulé." },
      { status: 409 }
    );
  }

  if (ticket.statut === "annule") {
    return NextResponse.json({ ok: true, dejaAnnule: true });
  }

  const { error } = await supabase
    .from("tickets")
    .update({ statut: "annule" })
    .eq("id", ticketId);

  if (error) {
    return NextResponse.json({ message: "Impossible d'annuler ce billet." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
