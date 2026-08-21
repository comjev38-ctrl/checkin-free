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

  // Important : on ATTEND ces deux envois avant de répondre. En
  // "fire-and-forget" (sans await), l'environnement d'exécution
  // Vercel peut être gelé juste après l'envoi de la réponse HTTP,
  // coupant ces requêtes en cours de route — ce qui donnait
  // l'impression que l'email n'arrivait "qu'à la deuxième inscription"
  // (le conteneur gelé n'ayant une chance de finir le premier envoi
  // que lorsqu'il est réutilisé pour l'appel suivant). Le compromis
  // est une réponse un peu plus lente (souvent <1s), largement
  // acceptable pour une inscription.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || !/^https?:\/\//.test(siteUrl)) {
    console.error(
      `NEXT_PUBLIC_SITE_URL invalide ou absente sur Vercel : "${siteUrl}". ` +
        `Elle doit commencer par https:// (ex: https://checkinfree.com). ` +
        `Email de billet non envoyé.`
    );
  } else {
    try {
      const res = await fetch(`${siteUrl}/api/envoyer-billet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id }),
      });
      if (!res.ok) {
        console.error("Envoi billet — réponse non OK :", res.status, await res.text());
      }
    } catch (err) {
      console.error("Envoi billet — fetch échoué :", err);
    }
  }

  try {
    await notifierAdmins(supabase, event.titre, prenom, nom);
  } catch (err) {
    console.error("Notification admins échouée :", err);
  }

  return NextResponse.json({ ticketId: ticket.id });
}

async function notifierAdmins(
  supabase: ReturnType<typeof createServiceClient>,
  titreEvenement: string,
  prenom: string,
  nom: string
) {
  if (!process.env.RESEND_API_KEY) return;

  const { data: admins } = await supabase.from("admins").select("email");
  const destinataires = (admins ?? []).map((a: { email: string }) => a.email);
  if (destinataires.length === 0) return;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "CheckIn Free <billets@resend.dev>",
    to: destinataires,
    subject: `Nouvelle inscription — ${titreEvenement}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <p style="text-transform:uppercase; letter-spacing:0.1em; font-size:11px; color:#1B7A5B;">
          Nouvelle inscription
        </p>
        <h1 style="font-size:20px; margin:4px 0 16px;">${titreEvenement}</h1>
        <p><strong>${prenom} ${nom}</strong> vient de réserver sa place.</p>
      </div>
    `,
  });
}
