"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LIBELLES_ROLE: Record<string, string> = {
  proprietaire: "Propriétaire",
  organisateur: "Organisateur",
  scanneur: "Scanneur",
};

export function FormulaireInviter() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("organisateur");
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
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setEnCours(false);

    if (!res.ok) {
      setErreur(data.message ?? "Une erreur est survenue.");
      return;
    }

    if (!data.emailEnvoye) {
      setAvertissement(
        `Compte créé, mais l'email n'a pas pu être envoyé. Mot de passe provisoire à transmettre toi-même : ${data.motDePasseProvisoire}`
      );
    } else {
      setSucces(`Invitation envoyée à ${email} avec un mot de passe provisoire.`);
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
        className="min-w-[200px] flex-1 rounded-md border border-ligne bg-white px-3 py-2 text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="rounded-md border border-ligne bg-white px-3 py-2 text-sm text-encre outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/10"
      >
        <option value="organisateur">Organisateur</option>
        <option value="scanneur">Scanneur</option>
        <option value="proprietaire">Propriétaire</option>
      </select>
      <button
        type="submit"
        disabled={enCours}
        className="rounded-md bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo/90 disabled:opacity-50"
      >
        {enCours ? "…" : "Inviter"}
      </button>
      {erreur && <p className="w-full text-sm text-corail">{erreur}</p>}
      {avertissement && <p className="w-full text-sm text-ambre">{avertissement}</p>}
      {succes && <p className="w-full text-sm text-vert">{succes}</p>}
    </form>
  );
}

export function SelecteurRole({
  email,
  roleActuel,
  desactive,
}: {
  email: string;
  roleActuel: string;
  desactive?: boolean;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function changerRole(nouveauRole: string) {
    setEnCours(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("admins")
      .update({ role: nouveauRole })
      .eq("email", email);
    setEnCours(false);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={roleActuel}
      disabled={desactive || enCours}
      onChange={(e) => changerRole(e.target.value)}
      className="rounded-md border border-ligne bg-white px-2 py-1 text-xs text-encre outline-none focus:border-indigo disabled:opacity-50"
    >
      <option value="organisateur">Organisateur</option>
      <option value="scanneur">Scanneur</option>
      <option value="proprietaire">Propriétaire</option>
    </select>
  );
}

export function GestionEvenementsScan({
  email,
  evenements,
  autorises,
}: {
  email: string;
  evenements: { id: string; titre: string }[];
  autorises: string[];
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);

  async function basculer(eventId: string, actif: boolean) {
    setEnCours(eventId);
    const supabase = createClient();
    if (actif) {
      await supabase
        .from("admin_evenements_autorises")
        .delete()
        .eq("admin_email", email)
        .eq("event_id", eventId);
    } else {
      await supabase
        .from("admin_evenements_autorises")
        .insert({ admin_email: email, event_id: eventId });
    }
    setEnCours(null);
    router.refresh();
  }

  if (!evenements.length) {
    return (
      <p className="mt-2 text-xs text-sourdine">
        Aucun événement à autoriser pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {evenements.map((ev) => {
        const actif = autorises.includes(ev.id);
        return (
          <button
            key={ev.id}
            onClick={() => basculer(ev.id, actif)}
            disabled={enCours === ev.id}
            className={`rounded-full border px-2.5 py-1 text-xs disabled:opacity-50 ${
              actif
                ? "border-indigo bg-indigo/10 text-indigo"
                : "border-ligne text-sourdine hover:border-indigo/40"
            }`}
          >
            {ev.titre}
          </button>
        );
      })}
    </div>
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
      className="text-corail hover:underline disabled:opacity-50"
    >
      Retirer
    </button>
  );
}
