import "server-only";

export type ChampsEmailRappel = {
  nomExpediteur: string | null;
  logoUrl: string | null;
  titreEvenement: string;
  accroche: string;
  description: string | null;
  texteBouton: string;
  lienBouton: string;
  couleurAccent: string;
  dateAffichee: string;
  lieu: string | null;
  prenom: string | null;
  urlAnnulation: string | null;
};

/** Assombrit une couleur hex de manière approximative, pour le dégradé d'en-tête. */
function assombrir(hex: string, facteur = 0.35): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const f = (v: number) => Math.max(0, Math.round(v * (1 - facteur)));
  return `#${f(r).toString(16).padStart(2, "0")}${f(g).toString(16).padStart(2, "0")}${f(b)
    .toString(16)
    .padStart(2, "0")}`;
}

export function construireEmailRappel(champs: ChampsEmailRappel): string {
  const couleurFoncee = assombrir(champs.couleurAccent);
  const salutation = champs.prenom ? `Bonjour ${champs.prenom},` : "Bonjour,";

  return `
  <div style="font-family: -apple-system,'Segoe UI',Arial,Helvetica,sans-serif; background:#F4F7F9; padding:24px 16px;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 14px rgba(16,24,40,0.08);">
      <div style="background:linear-gradient(135deg, ${champs.couleurAccent} 0%, ${couleurFoncee} 100%); padding:22px;">
        <table role="presentation" width="100%">
          <tr>
            ${
              champs.logoUrl
                ? `<td width="54" style="vertical-align:middle;">
                    <img src="${champs.logoUrl}" alt="" width="46" height="46" style="border-radius:10px; background:#fff; padding:4px; display:block;" />
                  </td>`
                : ""
            }
            <td style="vertical-align:middle; padding-left:${champs.logoUrl ? "12" : "0"}px;">
              ${
                champs.nomExpediteur
                  ? `<div style="color:rgba(255,255,255,0.85); font-size:12px; letter-spacing:0.4px;">${champs.nomExpediteur}</div>`
                  : ""
              }
              <div style="color:#ffffff; font-size:19px; font-weight:800; margin-top:2px;">
                ${champs.titreEvenement}
              </div>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:22px; color:#1F2A37; line-height:1.7; font-size:15px;">
        <p style="margin:0 0 14px; font-weight:700;">${salutation}</p>

        <div style="border-left:4px solid ${champs.couleurAccent}; background:#F7FBFC; padding:12px 14px; border-radius:10px; margin:0 0 16px;">
          <p style="margin:0;">${champs.accroche}</p>
        </div>

        <div style="display:grid; gap:8px; margin:0 0 16px;">
          <div style="background:#F7FBFC; border:1px solid #E6EEF2; border-radius:10px; padding:10px 14px;">
            <span style="font-weight:700; color:${couleurFoncee};">🗓️ Quand</span><br>
            <span style="text-transform:capitalize;">${champs.dateAffichee}</span>
          </div>
          ${
            champs.lieu
              ? `<div style="background:#F7FBFC; border:1px solid #E6EEF2; border-radius:10px; padding:10px 14px;">
                  <span style="font-weight:700; color:${couleurFoncee};">📍 Lieu</span><br>${champs.lieu}
                </div>`
              : ""
          }
        </div>

        ${champs.description ? `<p style="margin:0 0 18px;">${champs.description}</p>` : ""}

        <div style="text-align:center; margin:22px 0 6px;">
          <a href="${champs.lienBouton}" style="background:${champs.couleurAccent}; color:#ffffff; text-decoration:none; padding:13px 22px; border-radius:10px; font-weight:700; display:inline-block;">
            ${champs.texteBouton}
          </a>
        </div>

        ${
          champs.urlAnnulation
            ? `<p style="text-align:center; margin:16px 0 0; font-size:12px;">
                <a href="${champs.urlAnnulation}" style="color:#9CA3AF; text-decoration:underline;">Un empêchement ? Annuler ma place</a>
              </p>`
            : ""
        }
      </div>

      <div style="background:${couleurFoncee}; color:rgba(255,255,255,0.85); padding:12px 22px; font-size:11px;">
        Envoyé via CheckIn Free.
      </div>
    </div>
  </div>
  `;
}
