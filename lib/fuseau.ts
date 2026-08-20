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
 */

/** Date (année-mois-jour) telle qu'affichée à Paris pour un instant donné. */
export function dateISOCourteParis(instant: Date): string {
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
}

/** Heure (0-23) et minute d'un instant, telles qu'affichées à Paris. */
export function heureMinuteParis(instant: Date): { heures: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const heures = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minutes = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { heures, minutes };
}

/** Décalage Paris ↔ UTC, en minutes, pour un instant donné (gère l'heure d'été). */
function decalageParisMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "shortOffset",
  }).formatToParts(instant);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const match = tz.match(/GMT([+-]\d+)/);
  return match ? parseInt(match[1], 10) * 60 : 60;
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
  const decalage = decalageParisMinutes(approx);
  return new Date(approx.getTime() - decalage * 60000);
}

/** Convertit la valeur brute d'un <input type="datetime-local"> (heure de Paris implicite) en ISO UTC correct. */
export function datetimeLocalVersISO(valeur: string): string {
  const [datePart, heurePart] = valeur.split("T");
  const [annee, mois, jour] = datePart.split("-").map(Number);
  const [heure, minute] = heurePart.split(":").map(Number);
  return parisVersUTC(annee, mois, jour, heure, minute).toISOString();
}
