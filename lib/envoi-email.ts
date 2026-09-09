import "server-only";

/**
 * Envoie un email en essayant Resend d'abord (fournisseur principal),
 * puis Brevo automatiquement si Resend échoue (quota dépassé, panne,
 * clé absente...). Utilisé partout dans l'app pour ne jamais dépendre
 * d'un seul fournisseur.
 *
 * Configuration Brevo (facultative — sans elle, seul Resend est
 * utilisé, comme avant) :
 *   BREVO_API_KEY   — clé API Brevo
 *   BREVO_FROM_EMAIL — adresse expéditrice vérifiée dans Brevo
 */
export async function envoyerEmailAvecSecours({
  to,
  subject,
  html,
  fromNom = "CheckIn Free",
}: {
  to: string | string[];
  subject: string;
  html: string;
  fromNom?: string;
}): Promise<{ ok: boolean; erreur?: string; fournisseur?: "resend" | "brevo" }> {
  const destinataires = Array.isArray(to) ? to : [to];
  let erreurResend: string | undefined;

  // ---------- 1) Resend, fournisseur principal ----------
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "CheckIn Free <billets@resend.dev>",
        to: destinataires,
        subject,
        html,
      });
      if (!error) return { ok: true, fournisseur: "resend" };
      erreurResend = error.message ?? "Resend a refusé l'envoi.";
      console.error("Resend a échoué, tentative via Brevo si configuré :", error);
    } catch (err) {
      erreurResend = err instanceof Error ? err.message : "Exception Resend";
      console.error("Resend a levé une exception, tentative via Brevo si configuré :", err);
    }
  } else {
    erreurResend = "RESEND_API_KEY absente.";
  }

  // ---------- 2) Repli sur Brevo, si configuré ----------
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: {
            email:
              process.env.BREVO_FROM_EMAIL ??
              process.env.RESEND_FROM_EMAIL?.match(/<(.+)>/)?.[1] ??
              "contact@checkinfree.com",
            name: fromNom,
          },
          to: destinataires.map((email) => ({ email })),
          subject,
          htmlContent: html,
        }),
      });

      if (res.ok) return { ok: true, fournisseur: "brevo" };

      const detail = await res.text();
      console.error("Brevo a aussi refusé l'envoi :", detail);
      return { ok: false, erreur: `Resend: ${erreurResend} · Brevo: ${detail}` };
    } catch (err) {
      const msgBrevo = err instanceof Error ? err.message : "Exception Brevo";
      console.error("Brevo a levé une exception :", err);
      return { ok: false, erreur: `Resend: ${erreurResend} · Brevo: ${msgBrevo}` };
    }
  }

  return { ok: false, erreur: erreurResend ?? "Aucun fournisseur d'email configuré." };
}
