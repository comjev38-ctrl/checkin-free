import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email: emailBrut } = await req.json();
  const email = (emailBrut ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ message: "Email requis." }, { status: 400 });
  }

  // Vérifie que la personne qui invite est elle-même un membre admin
  // (RLS protège déjà la table, mais on veut un message clair ici).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const { error: erreurInsert } = await supabase.from("admins").insert({ email });

  if (erreurInsert) {
    return NextResponse.json(
      {
        message: erreurInsert.message.includes("duplicate")
          ? "Cette personne est déjà membre."
          : erreurInsert.message,
      },
      { status: 400 }
    );
  }

  // Envoie le lien d'invitation par email — nécessite la clé
  // service_role (API Admin de Supabase Auth), donc côté serveur
  // uniquement.
  const supabaseAdmin = createServiceClient();
  const { error: erreurInvite } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/admin/compte` }
  );

  if (erreurInvite) {
    // La personne est déjà ajoutée à l'équipe (donc pas bloquant),
    // mais elle devra utiliser le lien magique manuellement plutôt
    // que de recevoir une invitation automatique.
    return NextResponse.json({
      ajoute: true,
      inviteEnvoyee: false,
      avertissement:
        "Membre ajouté, mais l'email d'invitation n'a pas pu être envoyé (compte déjà existant ?). Il peut se connecter via lien magique.",
    });
  }

  return NextResponse.json({ ajoute: true, inviteEnvoyee: true });
}
