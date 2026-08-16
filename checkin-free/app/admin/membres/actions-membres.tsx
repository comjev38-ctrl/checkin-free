"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FormulaireInviter() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function inviter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("admins")
      .insert({ email: email.trim().toLowerCase() });
    setEnCours(false);

    if (error) {
      setErreur(
        error.message.includes("duplicate")
          ? "Cette personne est déjà membre."
          : error.message
      );
      return;
    }
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={inviter} className="mt-6 flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nouveau-membre@email.fr"
        className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
      />
      <button
        type="submit"
        disabled={enCours}
        className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
      >
        {enCours ? "…" : "Inviter"}
      </button>
      {erreur && <p className="text-sm text-rose">{erreur}</p>}
    </form>
  );
}

export function BoutonRetirer({ email }: { email: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function retirer() {
    if (!window.confirm(`Retirer ${email} de l'équipe admin ?`)) return;
    setEnCours(true);
    const supabase = createClient();
    const { error } = await supabase.from("admins").delete().eq("email", email);
    setEnCours(false);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={retirer}
      disabled={enCours}
      className="text-rose hover:underline disabled:opacity-50"
    >
      Retirer
    </button>
  );
}
