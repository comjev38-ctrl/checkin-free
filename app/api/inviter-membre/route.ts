import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function genererMotDePasseProvisoire() {
  // Lisible, prononçable, mais assez fort (ex: "trefle-hibou-4213")
  const mots = ["trefle", "hibou", "lac", "cedre", "brume", "corail", "silex", "iris"];
  const a = mots[Math.floor(Math.random() * mots.length)];
  const b = mots[Math.floor(Math.random() * mots.length)];
  const chiffres = Math.floor(1000 + Math.random() * 9000);
  return `${a}-${b}-${chiffres}`;
}

export async function POST(req: Request) {
  const { email: emailBrut } = await req.json();
  const email = (emailBrut ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ message: "Email requis." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const supabaseAdmin = createServiceClient();
  const motDePasseProvisoire = genererMotDePasseProvisoire();

  // Crée directement le compte avec un mot de passe connu — pas de
  // lien d'invitation à cliquer, donc pas de fragilité liée au
  // format du lien (code vs fragment) ni de risque réseau côté
  // envoi. Si le compte existe déjà (ex: ancien testeur), on lui
  // réinitialise simplement son mot de passe.
  const { data: creation, error: erreurCreation } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: motDePasseProvisoire,
      email_confirm: true,
    });

  let compteOk = !erreurCreation;
  let userId: string | null = creation?.user?.id ?? null;

  if (erreurCreation) {
    // Compte déjà existant : on retrouve son id et on force un
    // nouveau mot de passe provisoire dessus.
    const { data: liste } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 200,
    });
    const existant = liste?.users.find(
      (u: { email?: string }) => u.email?.toLowerCase() === email
    );

    if (existant) {
      const { error: erreurMaj } = await supabaseAdmin.auth.admin.updateUserById(
        existant.id,
        { password: motDePasseProvisoire }
      );
      compteOk = !erreurMaj;
      userId = existant.id;
    }
  }

  if (!compteOk) {
    return NextResponse.json(
      { message: "Impossible de créer ou mettre à jour ce compte." },
      { status: 500 }
    );
  }

  // Ajoute (ou met à jour) la fiche équipe avec l'obligation de
  // changer ce mot de passe à la première connexion. On lie
  // directement user_id ici : le compte existe déjà à ce stade
  // (créé juste au-dessus), donc le déclencheur automatique côté
  // base (prévu pour l'ancien flux where l'email arrivait AVANT le
  // compte) ne se déclencherait jamais dans ce nouvel ordre.
  const { error: erreurUpsert } = await supabase.from("admins").upsert(
    { email, mot_de_passe_provisoire: true, user_id: userId },
    { onConflict: "email" }
  );

  if (erreurUpsert) {
    return NextResponse.json({ message: erreurUpsert.message }, { status: 400 });
  }

  // Envoi de l'email avec le mot de passe provisoire, via Resend
  // (le même système que les billets) plutôt que le système d'email
  // interne de Supabase — plus fiable, déjà éprouvé sur ce projet.
  let emailEnvoye = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "CheckIn Free <admin@resend.dev>",
        to: email,
        subject: "Ton accès à l'espace organisateur CheckIn Free",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
            <p style="text-transform:uppercase; letter-spacing:0.1em; font-size:11px; color:#1B7A5B;">
              Espace organisateur
            </p>
            <h1 style="font-size:20px; margin:4px 0 16px;">Tu as été ajouté(e) à l'équipe</h1>
            <p>Voici tes identifiants de connexion :</p>
            <p>Email : <strong>${email}</strong></p>
            <p>Mot de passe provisoire : <strong style="font-family:monospace; font-size:16px;">${motDePasseProvisoire}</strong></p>
            <p>Connecte-toi puis change ce mot de passe — ce sera obligatoire dès la première connexion.</p>
            <p style="margin-top:24px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/connexion" style="display:inline-block; background:#16213E; color:#FAFAF8; text-decoration:none; font-size:14px; padding:12px 24px; border-radius:8px;">
                Se connecter
              </a>
            </p>
          </div>
        `,
      });
      emailEnvoye = !error;
      if (error) console.error("Envoi email invitation — Resend a refusé :", error);
    } catch (err) {
      console.error("Envoi email invitation — exception :", err);
    }
  } else {
    console.warn("RESEND_API_KEY absente : email d'invitation non envoyé.");
  }

  return NextResponse.json({
    ajoute: true,
    emailEnvoye,
    motDePasseProvisoire, // affiché en repli si l'email échoue (voir formulaire)
  });
}
