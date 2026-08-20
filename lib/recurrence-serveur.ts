import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { calculerProchaineOccurrence } from "@/lib/recurrence";
import { heureMinuteParis, dateISOCourteParis } from "@/lib/fuseau";

type EvenementModele = {
  id: string;
  titre: string;
  slug: string;
  description: string | null;
  lieu: string | null;
  capacite_max: number | null;
  logo_url: string | null;
  image_url: string | null;
  admin_id: string | null;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string | null;
};

/**
 * Retrouve la séance de la semaine courante pour un événement modèle
 * récurrent, ou la crée si elle n'existe pas encore. Utilise la clé
 * service_role car un visiteur anonyme doit pouvoir déclencher la
 * création (RLS bloquerait un insert public direct sur "events").
 *
 * Fichier strictement serveur : ne jamais importer depuis un
 * composant client (voir le marqueur "server-only" ci-dessus, qui
 * fait échouer le build s'il finit dans le bundle navigateur).
 */
export async function obtenirOuCreerOccurrence(modele: EvenementModele) {
  const supabase = createServiceClient();
  const cible = calculerProchaineOccurrence(
    modele.jour_semaine,
    modele.heure_debut,
    modele.heure_fin
  );
  const cibleISO = cible.toISOString();

  const { data: existante } = await supabase
    .from("events")
    .select("*")
    .eq("parent_event_id", modele.id)
    .eq("date_debut", cibleISO)
    .maybeSingle();

  if (existante) return existante;

  const { data: creee, error } = await supabase
    .from("events")
    .insert({
      parent_event_id: modele.id,
      admin_id: modele.admin_id,
      titre: modele.titre,
      slug: `${modele.slug}-${dateISOCourteParis(cible)}-${(() => {
        const { heures, minutes } = heureMinuteParis(cible);
        return `${String(heures).padStart(2, "0")}h${String(minutes).padStart(2, "0")}`;
      })()}`,
      description: modele.description,
      lieu: modele.lieu,
      capacite_max: modele.capacite_max,
      logo_url: modele.logo_url,
      image_url: modele.image_url,
      statut: "publie",
      date_debut: cibleISO,
      heure_fin: modele.heure_fin,
    })
    .select("*")
    .single();

  if (!error) return creee;

  // Deux cas possibles ici, tous les deux gérés sans jamais faire
  // planter la page publique :
  //
  // 1) Course concurrente : une autre requête a créé la même séance
  //    (même parent + même date_debut exacte) entre-temps.
  const { data: parDate } = await supabase
    .from("events")
    .select("*")
    .eq("parent_event_id", modele.id)
    .eq("date_debut", cibleISO)
    .maybeSingle();
  if (parDate) return parDate;

  // 2) Collision de slug : une séance existante (créée par ex. avant
  //    un correctif de calcul d'heure) porte déjà exactement ce nom
  //    d'URL, même si sa date_debut exacte diffère. On la réutilise
  //    plutôt que d'échouer — un admin pourra toujours corriger les
  //    horaires depuis "Modifier" si besoin.
  const slugCible = `${modele.slug}-${dateISOCourteParis(cible)}-${(() => {
    const { heures, minutes } = heureMinuteParis(cible);
    return `${String(heures).padStart(2, "0")}h${String(minutes).padStart(2, "0")}`;
  })()}`;
  const { data: parSlug } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slugCible)
    .maybeSingle();
  if (parSlug) return parSlug;

  // 3) Autre cause inattendue : on retente une seule fois avec un
  //    suffixe garanti unique plutôt que de laisser planter la page.
  const { data: repli, error: erreurRepli } = await supabase
    .from("events")
    .insert({
      parent_event_id: modele.id,
      admin_id: modele.admin_id,
      titre: modele.titre,
      slug: `${slugCible}-${Math.random().toString(36).slice(2, 6)}`,
      description: modele.description,
      lieu: modele.lieu,
      capacite_max: modele.capacite_max,
      logo_url: modele.logo_url,
      image_url: modele.image_url,
      statut: "publie",
      date_debut: cibleISO,
      heure_fin: modele.heure_fin,
    })
    .select("*")
    .single();

  if (erreurRepli) {
    console.error("Création de séance impossible même après repli :", error, erreurRepli);
    throw erreurRepli;
  }

  return repli;
}
