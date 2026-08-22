export const TUILES = [
  { fond: "bg-violet", texte: "text-violet" },
  { fond: "bg-orange", texte: "text-orange" },
  { fond: "bg-bleu", texte: "text-bleu" },
  { fond: "bg-fuchsia", texte: "text-fuchsia" },
] as const;

/** Choisit une couleur de tuile de façon stable pour un identifiant donné (même événement = toujours la même couleur). */
export function couleurTuile(id: string) {
  let somme = 0;
  for (let i = 0; i < id.length; i++) somme += id.charCodeAt(i);
  return TUILES[somme % TUILES.length];
}
