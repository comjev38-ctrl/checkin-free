import { SupabaseClient } from "@supabase/supabase-js";

const TAILLE_MAX_OCTETS = 5 * 1024 * 1024; // 5 Mo

export async function uploaderImageEvenement(
  supabase: SupabaseClient,
  fichier: File,
  prefixe: "logo" | "banniere"
): Promise<string> {
  if (!fichier.type.startsWith("image/")) {
    throw new Error("Le fichier doit être une image.");
  }
  if (fichier.size > TAILLE_MAX_OCTETS) {
    throw new Error("L'image ne doit pas dépasser 5 Mo.");
  }

  const extension = fichier.name.split(".").pop() || "jpg";
  const chemin = `${prefixe}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage
    .from("evenements")
    .upload(chemin, fichier, { upsert: true, cacheControl: "3600" });

  if (error) throw error;

  const { data } = supabase.storage.from("evenements").getPublicUrl(chemin);
  return data.publicUrl;
}
