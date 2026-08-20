/**
 * L'association est basée en France ; toutes les heures saisies dans
 * l'admin (heure de début, de fin, date d'un événement ponctuel)
 * doivent être comprises comme des heures locales françaises —
 * qu'elles soient traitées côté navigateur ou côté serveur.
 *
 * Problème que ce fichier résout : le serveur (fonctions Vercel)
 * tourne en UTC, pas en heure de Paris. Utiliser Date.setHours() ou
 * new Date("2026-08-20T19:00") sans fuseau explicite donne un résultat
 * différent selon qu'on est côté navigateur (heure de Paris) ou côté
 * serveur (UTC) — décalage de 1h (hiver) ou 2h (été, heure d'été).
 *
 * Méthode utilisée : uniquement des options Intl très standard
 * (year/month/day/hour/minute/second), pas "shortOffset"/"longOffset"
 * qui ne sont pas garanties sur tous les runtimes — pour rester
 * fiable y compris sur l'environnement serverless de Vercel.
 */

function valeur(parts: Intl.DateTimeFormatPart[], type: string): number {
  return Number(parts.find((p) => p.type === type)?.value ?? "0");
}

/** Décalage (en minutes) d'un fuseau par rapport à UTC, pour un instant donné. */
function decalageMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const commeUTC = Date.UTC(
    valeur(parts, "year"),
    valeur(parts, "month") - 1,
    valeur(parts, "day"),
    valeur(parts, "hour"),
    valeur(parts, "minute"),
    valeur(parts, "second")
  );

  return Math.round((commeUTC - instant.getTime()) / 60000);
}

/**
 * Construit l'instant UTC correspondant à une date + heure exprimées
 * en heure locale de Paris (peu importe le fuseau du runtime).
 */
export function parisVersUTC(
  annee: number,
  mois: number, // 1-12
  jour: number,
  heure: number,
  minute: number
): Date {
  const approx = new Date(Date.UTC(annee, mois - 1, jour, heure, minute));
  try {
    const decalage = decalageMinutes(approx, "Europe/Paris");
    return new Date(approx.getTime() - decalage * 60000);
  } catch {
    // Filet de sécurité si Intl échoue pour une raison quelconque sur
    // le runtime : règle française approximative (heure d'été du
    // dernier dimanche de mars au dernier dimanche d'octobre) plutôt
    // que de faire planter la page.
    const mm = mois;
    const decalageApprox = mm >= 4 && mm <= 9 ? 120 : 60;
    return new Date(approx.getTime() - decalageApprox * 60000);
  }
}

/** Convertit la valeur brute d'un <input type="datetime-local"> (heure de Paris implicite) en ISO UTC correct. */
export function datetimeLocalVersISO(valeurBrute: string): string {
  const [datePart, heurePart] = valeurBrute.split("T");
  const [annee, mois, jour] = datePart.split("-").map(Number);
  const [heure, minute] = heurePart.split(":").map(Number);
  return parisVersUTC(annee, mois, jour, heure, minute).toISOString();
}

/** Date (année-mois-jour) telle qu'affichée à Paris pour un instant donné. */
export function dateISOCourteParis(instant: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(instant);
    const annee = parts.find((p) => p.type === "year")?.value;
    const mois = parts.find((p) => p.type === "month")?.value;
    const jour = parts.find((p) => p.type === "day")?.value;
    return `${annee}-${mois}-${jour}`;
  } catch {
    return instant.toISOString().slice(0, 10);
  }
}

/** Heure (0-23) et minute d'un instant, telles qu'affichées à Paris. */
export function heureMinuteParis(instant: Date): { heures: number; minutes: number } {
  try {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(instant);
    return {
      heures: valeur(parts, "hour"),
      minutes: valeur(parts, "minute"),
    };
  } catch {
    return { heures: instant.getUTCHours(), minutes: instant.getUTCMinutes() };
  }
}
