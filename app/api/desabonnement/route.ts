import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, serieId } = await req.json();

  if (!email || !serieId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: serie } = await supabase
    .from("events")
    .select("id, titre")
    .eq("id", serieId)
    .single();

  if (!serie) {
    return NextResponse.json({ message: "Événement introuvable." }, { status: 404 });
  }

  const { error } = await supabase
    .from("desabonnements_rappels")
    .upsert(
      { email: email.trim().toLowerCase(), event_id: serieId },
      { onConflict: "email,event_id" }
    );

  if (error) {
    return NextResponse.json({ message: "Impossible de traiter la demande." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, titreSerie: serie.titre });
}
