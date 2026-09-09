import { createServiceClient } from "@/lib/supabase/server";
import { dateISOCourteParis } from "@/lib/fuseau";
import { obtenirOuCreerOccurrence } from "@/lib/recurrence-serveur";
import { envoyerRappelMaintenant } from "@/lib/envoi-rappel";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function decalerJours(dateISO: string, jours: number): string {
  const [a, m, j] = dateISO.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  d.setUTCDate(d.getUTCDate() + jours);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  // Vercel envoie automatiquement ce header pour ses propres appels
  // planifiés si CRON_SECRET est configuré côté Vercel — ça évite
  // que n'importe qui puisse déclencher l'envoi en devinant l'URL.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ envoyes: 0, message: "RESEND_API_KEY absente." });
  }

  const supabase = createServiceClient();
  const todayParis = dateISOCourteParis(new Date());

  // La séance de la semaine d'un événement récurrent n'existe en base
  // que si quelqu'un a visité sa page entre-temps (création à la
  // volée). On la résout nous-mêmes ici pour ne jamais rater un envoi
  // faute de visite.
  const { data: modeles } = await supabase
    .from("events")
    .select("*")
    .eq("recurrence", "hebdomadaire")
    .is("parent_event_id", null)
    .eq("statut", "publie");

  for (const modele of modeles ?? []) {
    try {
      await obtenirOuCreerOccurrence(modele);
    } catch (err) {
      console.error(`Résolution de séance échouée pour ${modele.titre} :`, err);
    }
  }

  // Seuls les rappels en mode "planifié" sont concernés ici — les
  // rappels en mode "manuel" ne partent jamais tout seuls, uniquement
  // via le bouton "Envoyer maintenant".
  const { data: rappels } = await supabase
    .from("rappels_planifies")
    .select("*, event:events(*)")
    .eq("actif", true)
    .eq("mode_envoi", "planifie");

  if (!rappels || rappels.length === 0) {
    return NextResponse.json({ envoyes: 0, rappelsDeclenches: 0 });
  }

  let totalEmails = 0;
  let rappelsDeclenches = 0;

  for (const rappel of rappels) {
    const eventBrut: any = Array.isArray(rappel.event) ? rappel.event[0] : rappel.event;
    if (!eventBrut) continue;

    // Pour savoir si "aujourd'hui" est le bon jour, il faut déjà
    // connaître la vraie date de la séance concernée (pas celle,
    // possiblement obsolète, du modèle récurrent) — donc un premier
    // aperçu léger avant l'envoi effectif.
    let dateReelle: string;
    if (eventBrut.recurrence === "hebdomadaire" && !eventBrut.parent_event_id) {
      if (eventBrut.statut !== "publie") continue;
      try {
        const seance = await obtenirOuCreerOccurrence(eventBrut);
        dateReelle = seance.date_debut;
      } catch (err) {
        console.error(`Résolution de séance échouée pour le rappel ${rappel.id} :`, err);
        continue;
      }
    } else {
      if (eventBrut.statut !== "publie") continue;
      dateReelle = eventBrut.date_debut;
    }

    const dateEvenementParis = dateISOCourteParis(new Date(dateReelle));
    const dateCible = decalerJours(dateEvenementParis, -rappel.jours_avant);

    if (dateCible !== todayParis) continue;
    if (rappel.derniere_execution_paris === todayParis) continue; // déjà envoyé aujourd'hui

    const { emailsEnvoyes } = await envoyerRappelMaintenant(
      supabase,
      rappel,
      eventBrut,
      todayParis
    );
    totalEmails += emailsEnvoyes;
    rappelsDeclenches++;
  }

  return NextResponse.json({ envoyes: totalEmails, rappelsDeclenches });
}
