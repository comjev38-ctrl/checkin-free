import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname === "/admin/connexion";

  if (isAdminRoute && !isLoginRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/connexion";
      return NextResponse.redirect(url);
    }

    // Authentifié ne suffit pas : il faut aussi être dans l'équipe.
    const { data: membre } = await supabase
      .from("admins")
      .select("email, mot_de_passe_provisoire, user_id")
      .eq("email", user.email)
      .maybeSingle();

    if (!membre) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/connexion";
      url.searchParams.set("erreur", "non_autorise");
      return NextResponse.redirect(url);
    }

    // Rattrapage : une fiche invitée avant le correctif de liaison
    // automatique peut être restée orpheline (user_id jamais rempli)
    // malgré une connexion réussie. On la répare silencieusement ici.
    if (!membre.user_id) {
      await supabase.from("admins").update({ user_id: user.id }).eq("email", user.email);
    }

    // Mot de passe provisoire jamais changé : on bloque tout accès
    // sauf à la page où le changer.
    const pageChangementMdp = request.nextUrl.pathname === "/admin/compte";
    if (membre.mot_de_passe_provisoire && !pageChangementMdp) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/compte";
      url.searchParams.set("mdp_provisoire", "1");
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
