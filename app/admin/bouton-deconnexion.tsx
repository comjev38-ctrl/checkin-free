"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BoutonDeconnexion({
  className = "text-stone hover:text-ink hover:underline",
  children = "Déconnexion",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  async function deconnexion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/connexion");
    router.refresh();
  }

  return (
    <button onClick={deconnexion} className={className}>
      {children}
    </button>
  );
}
