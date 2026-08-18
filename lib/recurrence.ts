/**
 * Fonctions de calcul pures, sans dépendance serveur — utilisables
 * aussi bien côté client (formulaires admin) que côté serveur.
 */

/**
 * Calcule la prochaine date (>= maintenant) correspondant au jour de
 * la semaine et à l'heure de début donnés.
 *
 * La séance de la semaine reste "active" (donc affichée) jusqu'à ce
 * que l'heure de FIN soit passée (ou l'heure de début, si aucune
 * heure de fin n'est définie) — c'est seulement à ce moment-là que
 * le calcul bascule sur la semaine suivante et qu'une nouvelle
 * séance (donc de nouveaux billets) sera créée à la prochaine visite.
 *
 * jourSemaineISO : 1 = lundi ... 7 = dimanche
 * heureDebut / heureFin : "HH:MM:SS" ou "HH:MM"
 */
export function calculerProchaineOccurrence(
  jourSemaineISO: number,
  heureDebut: string,
  heureFin: string | null = null,
  depuis: Date = new Date()
): Date {
  const [h, m] = heureDebut.split(":").map(Number);
  const cibleDebut = new Date(depuis);
  cibleDebut.setHours(h, m, 0, 0);

  let cibleBascule = cibleDebut;
  if (heureFin) {
    const [hf, mf] = heureFin.split(":").map(Number);
    cibleBascule = new Date(depuis);
    cibleBascule.setHours(hf, mf, 0, 0);
  }

  const jourActuelISO = depuis.getDay() === 0 ? 7 : depuis.getDay();
  let decalageJours = jourSemaineISO - jourActuelISO;

  if (decalageJours < 0 || (decalageJours === 0 && cibleBascule < depuis)) {
    decalageJours += 7;
  }

  cibleDebut.setDate(cibleDebut.getDate() + decalageJours);
  return cibleDebut;
}

export function formaterDateISOCourte(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
