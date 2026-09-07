import { createClient, createServiceClient } from "@/lib/supabase/server";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";
import { construireEmailRappel } from "@/lib/email-rappel";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabaseSession = createClient();
  const {
    data: { user },
  } = await supabaseSession.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { message: "RESEND_API_KEY absente sur Vercel : impossible d'envoyer un test." },
      { status: 400 }
    );
  }

  const {
    eventId,
    sujet,
    accroche,
    description,
    texteBouton,
    lienBouton,
    couleurAccent,
    nomExpediteur,
    destinataires,
  } = await req.json();

  const emailsBruts: string[] = Array.isArray(destinataires) && destinataires.length > 0
    ? destinataires
    : [user.email];

  const emailsValides = Array.from(
    new Set(
      emailsBruts
        .map((e: string) => e.trim().toLowerCase())
        .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );

  if (emailsValides.length === 0) {
    return NextResponse.json(
      { message: "Aucune adresse email valide." },
      { status: 400 }
    );
  }
  if (emailsValides.length > 10) {
    return NextResponse.json(
      { message: "10 adresses maximum pour un test." },
      { status: 400 }
    );
  }

  if (!eventId || !sujet || !accroche) {
    return NextResponse.json(
      { message: "Sujet et message mis en avant sont requis pour tester." },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: eventBrut } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!eventBrut) {
    return NextResponse.json({ message: "Événement introuvable." }, { status: 404 });
  }

  let event = eventBrut;
  if (event.recurrence === "hebdomadaire" && !event.parent_event_id) {
    try {
      event = await obtenirOuCreerOccurrence(event);
    } catch {
      // Pas grave pour un simple test : on garde les infos du modèle.
    }
  }

  const dateAffichee = new Date(event.date_debut).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = construireEmailRappel({
    nomExpediteur: nomExpediteur || null,
    logoUrl: event.logo_url,
    titreEvenement: event.titre,
    accroche,
    description: description || null,
    texteBouton: texteBouton || "Voir l'événement",
    lienBouton: lienBouton || `${process.env.NEXT_PUBLIC_SITE_URL}/evenement/${event.slug}`,
    couleurAccent: couleurAccent || "#5B5FEF",
    dateAffichee,
    lieu: event.lieu,
    prenom: "Prénom",
    urlAnnulation: null,
  });

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "CheckIn Free <billets@resend.dev>",
      to: emailsValides,
      subject: `[TEST] ${sujet}`,
      html,
    });
    if (error) {
      console.error("Envoi test rappel — Resend a refusé :", error);
      return NextResponse.json({ message: "Resend a refusé l'envoi." }, { status: 502 });
    }
  } catch (err) {
    console.error("Envoi test rappel — exception :", err);
    return NextResponse.json({ message: "Erreur lors de l'envoi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, envoyeA: emailsValides.join(", ") });
}
