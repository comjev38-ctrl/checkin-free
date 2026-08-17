/**
 * Fonctions de calcul pures, sans dépendance serveur — utilisables
 * aussi bien côté client (formulaires admin) que côté serveur.
 */

/**
 * Calcule la prochaine date (>= maintenant) correspondant au jour de
 * la semaine et à l'heure donnés. Si "aujourd'hui" correspond déjà et
 * que l'heure n'est pas encore passée, retourne aujourd'hui.
 *
 * jourSemaineISO : 1 = lundi ... 7 = dimanche
 * heureDebut : "HH:MM:SS" ou "HH:MM"
 */
export function calculerProchaineOccurrence(
  jourSemaineISO: number,
  heureDebut: string,
  depuis: Date = new Date()
): Date {
  const [h, m] = heureDebut.split(":").map(Number);

  const cible = new Date(depuis);
  cible.setHours(h, m, 0, 0);

  const jourActuelISO = depuis.getDay() === 0 ? 7 : depuis.getDay();
  let decalageJours = jourSemaineISO - jourActuelISO;

  // Si c'est le bon jour mais que l'heure est déjà passée, ou si le
  // jour est déjà passé cette semaine, on saute à la semaine prochaine.
  if (decalageJours < 0 || (decalageJours === 0 && cible < depuis)) {
    decalageJours += 7;
  }

  cible.setDate(cible.getDate() + decalageJours);
  return cible;
}

export function formaterDateISOCourte(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
