import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { eventId, prenom, nom, email } = await req.json();

  if (!eventId || !prenom || !nom || !email) {
    return NextResponse.json(
      { message: "Prénom, nom, email et événement sont requis." },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, statut, capacite_max, titre")
    .eq("id", eventId)
    .single();

  if (eventError || !event || event.statut !== "publie") {
    return NextResponse.json(
      { message: "Cet événement n'accepte plus d'inscriptions." },
      { status: 404 }
    );
  }

  if (event.capacite_max != null) {
    const { count } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .neq("statut", "annule");

    if ((count ?? 0) >= event.capacite_max) {
      return NextResponse.json(
        { message: "Cet événement est complet." },
        { status: 409 }
      );
    }
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({ event_id: eventId, prenom, nom, email })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json(
      { message: "Impossible de générer le billet, réessaie." },
      { status: 500 }
    );
  }

  // L'envoi d'email ne doit jamais faire échouer l'inscription : la
  // page de confirmation avec le QR à l'écran reste le canal fiable.
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/envoyer-billet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId: ticket.id }),
  }).catch(() => {});

  return NextResponse.json({ ticketId: ticket.id });
}
