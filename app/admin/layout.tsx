import { createClient } from "@/lib/supabase/server";
import NavAdmin from "./nav-admin";

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Pas connecté (typiquement sur /admin/connexion) : pas de nav.
    return <>{children}</>;
  }

  const { data: monProfil } = await supabase
    .from("admins")
    .select("prenom, nom")
    .eq("email", user.email)
    .maybeSingle();

  const nomAffiche =
    [monProfil?.prenom, monProfil?.nom].filter(Boolean).join(" ") ||
    user.email ||
    "";

  return (
    <div className="min-h-screen bg-paper md:pl-60">
      <NavAdmin nomAffiche={nomAffiche} />
      {children}
    </div>
  );
}
