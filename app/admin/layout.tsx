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

  return (
    <div className="min-h-screen bg-paper">
      <NavAdmin email={user.email ?? ""} />
      {children}
    </div>
  );
}
