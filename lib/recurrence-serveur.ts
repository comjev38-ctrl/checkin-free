import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { calculerProchaineOccurrence, formaterDateISOCourte } from "@/lib/recurrence";

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
      slug: `${modele.slug}-${formaterDateISOCourte(cible)}-${String(
        cible.getHours()
      ).padStart(2, "0")}h${String(cible.getMinutes()).padStart(2, "0")}`,
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

  // Cas rare : deux requêtes concurrentes ont tenté de créer la même
  // séance en même temps (l'index unique a rejeté la deuxième).
  // On relit simplement la ligne qui a gagné la course.
  if (error) {
    const { data: apresConflit } = await supabase
      .from("events")
      .select("*")
      .eq("parent_event_id", modele.id)
      .eq("date_debut", cibleISO)
      .maybeSingle();
    if (apresConflit) return apresConflit;
    throw error;
  }

  return creee;
}
