import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase envoie le lien magique vers cette route avec un paramètre
// "code" dans l'URL. On doit l'échanger contre une session AVANT de
// rediriger, sinon aucun cookie de session n'est jamais posé et
// l'utilisateur atterrit sur /admin sans être authentifié.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Le code est absent ou invalide (lien expiré, déjà utilisé, etc.)
  return NextResponse.redirect(
    `${origin}/admin/connexion?erreur=lien_invalide`
  );
}
