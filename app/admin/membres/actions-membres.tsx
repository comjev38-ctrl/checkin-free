"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FormulaireInviter() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [avertissement, setAvertissement] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function inviter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setAvertissement(null);
    setSucces(null);
    setEnCours(true);

    const res = await fetch("/api/inviter-membre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setEnCours(false);

    if (!res.ok) {
      setErreur(data.message ?? "Une erreur est survenue.");
      return;
    }

    if (data.inviteEnvoyee) {
      setSucces(`Invitation envoyée à ${email}.`);
    } else {
      setAvertissement(data.avertissement);
    }
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={inviter} className="mt-6 flex flex-wrap gap-2">
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
      {erreur && <p className="w-full text-sm text-rose">{erreur}</p>}
      {avertissement && <p className="w-full text-sm text-amber">{avertissement}</p>}
      {succes && <p className="w-full text-sm text-emerald">{succes}</p>}
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
