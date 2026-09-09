import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Contact = { prenom: string; nom: string; email: string };

export async function POST(req: Request) {
  const { eventId, serieId, contacts, mode, envoyerEmail } = (await req.json()) as {
    eventId: string;
    serieId?: string | null;
    contacts: Contact[];
    mode: "inscrire" | "anciens_participants";
    envoyerEmail: boolean;
  };

  if (!eventId || !Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ message: "Données invalides." }, { status: 400 });
  }
  if (contacts.length > 500) {
    return NextResponse.json(
      { message: "500 contacts maximum par import." },
      { status: 400 }
    );
  }
  if (mode === "anciens_participants" && !serieId) {
    return NextResponse.json(
      { message: "Cet événement ne fait pas partie d'une série récurrente." },
      { status: 400 }
    );
  }

  // Seuls les admins autorisés à gérer les événements peuvent
  // importer des contacts (RLS le vérifiera de toute façon à
  // l'insertion, mais on veut un message clair ici).
  const supabaseSession = createClient();
  const {
    data: { user },
  } = await supabaseSession.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const supabase = createServiceClient();

  const resultat = {
    importes: 0,
    ignoresDoublons: 0,
    ignoresInvalides: 0,
    ignoresCapacite: 0,
    emailsEnvoyes: 0,
  };

  // ---------- Mode "anciens participants" : pas de billet ----------
  if (mode === "anciens_participants") {
    for (const c of contacts) {
      const email = (c.email ?? "").trim();
      const prenom = (c.prenom ?? "").trim();
      const nom = (c.nom ?? "").trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        resultat.ignoresInvalides++;
        continue;
      }

      const { data: existant } = await supabase
        .from("anciens_contacts")
        .select("id")
        .eq("event_id", serieId)
        .ilike("email", email)
        .maybeSingle();

      if (existant) {
        resultat.ignoresDoublons++;
        continue;
      }

      const { error } = await supabase
        .from("anciens_contacts")
        .insert({ event_id: serieId, prenom, nom, email });

      if (error) {
        resultat.ignoresInvalides++;
        continue;
      }
      resultat.importes++;
    }
    return NextResponse.json(resultat);
  }

  // ---------- Mode "inscrire" : crée un vrai billet ----------
  const { data: event } = await supabase
    .from("events")
    .select("id, titre, capacite_max")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ message: "Événement introuvable." }, { status: 404 });
  }

  const idsCrees: string[] = [];

  for (const c of contacts) {
    const email = (c.email ?? "").trim();
    const prenom = (c.prenom ?? "").trim();
    const nom = (c.nom ?? "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      resultat.ignoresInvalides++;
      continue;
    }

    if (event.capacite_max != null) {
      const { count } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .neq("statut", "annule");
      if ((count ?? 0) >= event.capacite_max) {
        resultat.ignoresCapacite++;
        continue;
      }
    }

    const { data: existant } = await supabase
      .from("tickets")
      .select("id")
      .eq("event_id", eventId)
      .ilike("email", email)
      .neq("statut", "annule")
      .maybeSingle();

    if (existant) {
      resultat.ignoresDoublons++;
      continue;
    }

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({ event_id: eventId, prenom, nom, email })
      .select("id")
      .single();

    if (error || !ticket) {
      resultat.ignoresInvalides++;
      continue;
    }

    resultat.importes++;
    idsCrees.push(ticket.id);
  }

  if (envoyerEmail && idsCrees.length > 0 && process.env.NEXT_PUBLIC_SITE_URL) {
    for (const ticketId of idsCrees) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/envoyer-billet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId }),
        });
        if (res.ok) resultat.emailsEnvoyes++;
      } catch (err) {
        console.error(`Envoi billet importé ${ticketId} échoué :`, err);
      }
    }
  }

  return NextResponse.json(resultat);
}
