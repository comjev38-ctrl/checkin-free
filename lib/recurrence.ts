import { parisVersUTC } from "@/lib/fuseau";

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
 * heureDebut / heureFin : "HH:MM:SS" ou "HH:MM", en heure de Paris
 */
export function calculerProchaineOccurrence(
  jourSemaineISO: number,
  heureDebut: string,
  heureFin: string | null = null,
  depuis: Date = new Date()
): Date {
  const [h, m] = heureDebut.split(":").map(Number);

  // On construit la cible en heure de Paris, quel que soit le fuseau
  // du runtime qui exécute ce code (navigateur ou serveur Vercel).
  const cibleDebut = parisVersUTC(
    depuis.getFullYear(),
    depuis.getMonth() + 1,
    depuis.getDate(),
    h,
    m
  );

  let cibleBascule = cibleDebut;
  if (heureFin) {
    const [hf, mf] = heureFin.split(":").map(Number);
    cibleBascule = parisVersUTC(
      depuis.getFullYear(),
      depuis.getMonth() + 1,
      depuis.getDate(),
      hf,
      mf
    );
  }

  const jourActuelISO = depuis.getDay() === 0 ? 7 : depuis.getDay();
  let decalageJours = jourSemaineISO - jourActuelISO;

  if (decalageJours < 0 || (decalageJours === 0 && cibleBascule < depuis)) {
    decalageJours += 7;
  }

  if (decalageJours === 0) return cibleDebut;

  // Redécoupe avec le bon jour, toujours en heure de Paris (important
  // aux changements d'heure d'été/hiver qui pourraient tomber entre
  // aujourd'hui et le jour cible).
  const jourCible = new Date(depuis);
  jourCible.setDate(jourCible.getDate() + decalageJours);
  return parisVersUTC(
    jourCible.getFullYear(),
    jourCible.getMonth() + 1,
    jourCible.getDate(),
    h,
    m
  );
}

export function formaterDateISOCourte(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
