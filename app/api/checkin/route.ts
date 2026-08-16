import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { eventId, code } = await req.json();
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { statut: "invalide", message: "Session admin expirée." },
      { status: 401 }
    );
  }

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, prenom, nom, statut, event_id")
    .eq("event_id", eventId)
    .eq("code", code)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({
      statut: "invalide",
      message: "Ce code ne correspond à aucun billet de cet événement.",
    });
  }

  const nomComplet = [ticket.prenom, ticket.nom].filter(Boolean).join(" ");

  if (ticket.statut === "annule") {
    return NextResponse.json({
      statut: "invalide",
      nom: nomComplet,
      message: "Ce billet a été annulé.",
    });
  }

  if (ticket.statut === "utilise") {
    return NextResponse.json({
      statut: "deja_utilise",
      nom: nomComplet,
      message: "Ce billet a déjà servi pour un contrôle d'accès.",
    });
  }

  await supabase.from("tickets").update({ statut: "utilise" }).eq("id", ticket.id);
  await supabase.from("checkins").insert({ ticket_id: ticket.id, scanned_by: user.id });

  return NextResponse.json({
    statut: "ok",
    nom: nomComplet,
    message: "Bienvenue !",
  });
}
