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
function assombrir(hex: string, facteur = 0.4): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const f = (v: number) => Math.max(0, Math.round(v * (1 - facteur)));
  return `#${f(r).toString(16).padStart(2, "0")}${f(g).toString(16).padStart(2, "0")}${f(b)
    .toString(16)
    .padStart(2, "0")}`;
}

/** Éclaircit une couleur hex, pour un fond très pâle assorti (encart, cartes). */
function eclaircir(hex: string, facteur = 0.93): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const f = (v: number) => Math.round(v + (255 - v) * facteur);
  return `#${f(r).toString(16).padStart(2, "0")}${f(g).toString(16).padStart(2, "0")}${f(b)
    .toString(16)
    .padStart(2, "0")}`;
}

export function construireEmailRappel(champs: ChampsEmailRappel): string {
  const couleurFoncee = assombrir(champs.couleurAccent);
  const couleurPale = eclaircir(champs.couleurAccent);
  const salutation = champs.prenom ? `Bonjour ${champs.prenom},` : "Bonjour,";
  const urlMaps = champs.lieu
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(champs.lieu)}`
    : null;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0; padding:0;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#EEF1F5; padding:32px 16px;">
    <table role="presentation" width="100%" style="max-width:560px; margin:0 auto; border-collapse:collapse;">
      <tr>
        <td style="background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 2px 8px rgba(16,24,40,0.06), 0 12px 28px rgba(16,24,40,0.08);">

          <!-- En-tête -->
          <table role="presentation" width="100%" style="border-collapse:collapse; background:linear-gradient(135deg, ${champs.couleurAccent} 0%, ${couleurFoncee} 100%);">
            <tr>
              <td style="padding:30px 28px;">
                <table role="presentation" width="100%">
                  <tr>
                    ${
                      champs.logoUrl
                        ? `<td width="56" style="vertical-align:middle;">
                            <table role="presentation"><tr><td style="background:#ffffff; border-radius:16px; padding:5px; line-height:0;">
                              <img src="${champs.logoUrl}" alt="" width="44" height="44" style="display:block; border-radius:12px; object-fit:cover;" />
                            </td></tr></table>
                          </td>
                          <td width="14"></td>`
                        : ""
                    }
                    <td style="vertical-align:middle;">
                      ${
                        champs.nomExpediteur
                          ? `<div style="color:rgba(255,255,255,0.75); font-size:11px; letter-spacing:0.6px; text-transform:uppercase; font-weight:600;">${champs.nomExpediteur}</div>`
                          : ""
                      }
                      <div style="color:#ffffff; font-size:21px; font-weight:800; margin-top:3px; line-height:1.3;">
                        ${champs.titreEvenement}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Corps -->
          <table role="presentation" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="padding:30px 28px 10px; color:#1F2A37; font-size:15px; line-height:1.5;">
                <p style="margin:0; font-weight:700; font-size:17px;">${salutation}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 28px 0;">
                <table role="presentation" width="100%" style="border-collapse:collapse; background:${couleurPale}; border-radius:18px;">
                  <tr>
                    <td style="padding:18px 20px; color:#1F2A37; font-size:15px; line-height:1.65; border-radius:18px;">
                      ${champs.accroche}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Bloc date -->
            <tr>
              <td style="padding:20px 28px 0;">
                <table role="presentation" width="100%" style="border-collapse:collapse; background:#FAFBFC; border:1px solid #ECEFF3; border-radius:18px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:${couleurFoncee};">
                        🗓️&nbsp;&nbsp;Date et heure
                      </div>
                      <div style="margin-top:7px; font-size:15.5px; color:#1F2A37; text-transform:capitalize;">
                        ${champs.dateAffichee}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Bloc lieu (bien espacé du bloc date, cliquable vers Maps) -->
            ${
              champs.lieu
                ? `<tr>
                    <td style="padding:14px 28px 0;">
                      <table role="presentation" width="100%" style="border-collapse:collapse; background:#FAFBFC; border:1px solid #ECEFF3; border-radius:18px;">
                        <tr>
                          <td style="padding:16px 18px;">
                            <div style="font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:${couleurFoncee};">
                              📍&nbsp;&nbsp;Lieu
                            </div>
                            <div style="margin-top:7px; font-size:15.5px;">
                              <a href="${urlMaps}" style="color:${champs.couleurAccent}; text-decoration:underline;">
                                ${champs.lieu}
                              </a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>`
                : ""
            }

            ${
              champs.description
                ? `<tr>
                    <td style="padding:22px 28px 0; color:#1F2A37; font-size:15px; line-height:1.7;">
                      ${champs.description}
                    </td>
                  </tr>`
                : ""
            }

            <!-- Bouton d'action -->
            <tr>
              <td style="padding:30px 28px 6px; text-align:center;">
                <table role="presentation" style="margin:0 auto; border-collapse:collapse;">
                  <tr>
                    <td style="background:${champs.couleurAccent}; border-radius:16px; box-shadow:0 6px 14px ${champs.couleurAccent}4D;">
                      <a href="${champs.lienBouton}" style="display:inline-block; padding:15px 32px; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; border-radius:16px;">
                        ${champs.texteBouton}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${
              champs.urlAnnulation
                ? `<tr>
                    <td style="padding:18px 28px 4px; text-align:center;">
                      <a href="${champs.urlAnnulation}" style="color:#9CA3AF; font-size:12px; text-decoration:underline;">
                        Un empêchement ? Annuler ma place
                      </a>
                    </td>
                  </tr>`
                : ""
            }

            <tr>
              <td style="padding:24px 28px 28px;">
                <div style="height:1px; background:#EEF1F5; border-radius:1px;"></div>
              </td>
            </tr>
          </table>

          <!-- Pied de page -->
          <table role="presentation" width="100%" style="border-collapse:collapse; background:${couleurFoncee};">
            <tr>
              <td style="padding:18px 28px; text-align:center;">
                <div style="color:rgba(255,255,255,0.65); font-size:11px; letter-spacing:0.3px;">
                  Envoyé via CheckIn Free — billetterie associative gratuite
                </div>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
