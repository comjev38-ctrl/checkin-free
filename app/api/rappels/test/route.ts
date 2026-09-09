import { createClient, createServiceClient } from "@/lib/supabase/server";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";
import { construireEmailRappel } from "@/lib/email-rappel";
import { envoyerEmailAvecSecours } from "@/lib/envoi-email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabaseSession = createClient();
  const {
    data: { user },
  } = await supabaseSession.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY && !process.env.BREVO_API_KEY) {
    return NextResponse.json(
      { message: "Aucun fournisseur d'email configuré (RESEND_API_KEY ou BREVO_API_KEY) sur Vercel." },
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

  const echecs: string[] = [];
  for (const email of emailsValides) {
    const { ok, erreur } = await envoyerEmailAvecSecours({
      to: email,
      subject: `[TEST] ${sujet}`,
      html,
    });
    if (!ok) {
      console.error(`Envoi test rappel refusé pour ${email} :`, erreur);
      echecs.push(email);
    }
  }

  if (echecs.length === emailsValides.length) {
    return NextResponse.json({ message: "L'envoi a été refusé par tous les fournisseurs configurés." }, { status: 502 });
  }
  if (echecs.length > 0) {
    return NextResponse.json({
      ok: true,
      envoyeA: emailsValides.filter((e) => !echecs.includes(e)).join(", "),
      avertissement: `Échec pour : ${echecs.join(", ")}`,
    });
  }

  return NextResponse.json({ ok: true, envoyeA: emailsValides.join(", ") });
}
