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
  urlDesinscription?: string | null;
};

function hexVersHsl(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslVersHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const f = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

/** Deuxième teinte du dégradé chaleureux, dérivée de la couleur choisie. */
function teinteComplementaireChaude(hex: string): string {
  const [h, s, l] = hexVersHsl(hex);
  const h2 = (h + 330) % 360; // rotation vers une teinte voisine, effet dégradé
  return hslVersHex(h2, Math.min(1, s + 0.05), Math.min(0.72, l + 0.06));
}

function eclaircir(hex: string, facteur = 0.88): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const f = (v: number) => Math.round(v + (255 - v) * facteur);
  return `#${f(r).toString(16).padStart(2, "0")}${f(g).toString(16).padStart(2, "0")}${f(b)
    .toString(16)
    .padStart(2, "0")}`;
}

function assombrirTexte(hex: string): string {
  const [h, s] = hexVersHsl(hex);
  return hslVersHex(h, Math.min(1, s + 0.15), 0.32);
}

export function construireEmailRappel(champs: ChampsEmailRappel): string {
  const couleur2 = teinteComplementaireChaude(champs.couleurAccent);
  const cartePale1 = eclaircir(champs.couleurAccent, 0.9);
  const cartePale2 = eclaircir(couleur2, 0.9);
  const texteCarte1 = assombrirTexte(champs.couleurAccent);
  const texteCarte2 = assombrirTexte(couleur2);
  const salutation = champs.prenom ? `Bonjour ${champs.prenom} 👋` : "Bonjour 👋";
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
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding:36px 16px; background:radial-gradient(circle at 15% 0%, ${eclaircir(champs.couleurAccent, 0.94)} 0%, transparent 45%), radial-gradient(circle at 100% 20%, ${eclaircir(couleur2, 0.94)} 0%, transparent 45%), #FBFAF8;">
    <table role="presentation" width="100%" style="max-width:560px; margin:0 auto; border-collapse:collapse;">
      <tr>
        <td style="background:#ffffff; border-radius:32px; overflow:hidden; box-shadow:0 20px 40px ${champs.couleurAccent}22, 0 4px 12px rgba(16,24,40,0.06);">

          <!-- En-tête dégradé chaleureux -->
          <table role="presentation" width="100%" style="border-collapse:collapse; background:linear-gradient(135deg, ${champs.couleurAccent} 0%, ${couleur2} 100%);">
            <tr>
              <td style="padding:38px 34px; text-align:center;">
                ${
                  champs.logoUrl
                    ? `<table role="presentation" style="margin:0 auto;"><tr><td style="width:64px; height:64px; background:#ffffff; border-radius:22px; box-shadow:0 8px 16px rgba(0,0,0,0.12); text-align:center; vertical-align:middle; line-height:0;">
                        <img src="${champs.logoUrl}" alt="" width="64" height="64" style="display:block; border-radius:22px; object-fit:cover;" />
                      </td></tr></table>`
                    : `<div style="width:64px; height:64px; margin:0 auto; background:#ffffff; border-radius:22px; text-align:center; line-height:64px; font-size:28px; box-shadow:0 8px 16px rgba(0,0,0,0.12);">🎉</div>`
                }
                ${
                  champs.nomExpediteur
                    ? `<div style="margin-top:14px; color:rgba(255,255,255,0.9); font-size:12px; letter-spacing:0.5px; text-transform:uppercase; font-weight:700;">${champs.nomExpediteur}</div>`
                    : ""
                }
                <h1 style="margin:6px 0 0; font-size:22px; font-weight:800; color:#ffffff; line-height:1.35;">
                  ${champs.titreEvenement}
                </h1>
              </td>
            </tr>
          </table>

          <!-- Corps -->
          <table role="presentation" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="padding:30px 32px 0; color:#3D2B1F; font-size:16px; line-height:1.6;">
                <strong>${salutation}</strong><br>
                ${champs.accroche}
              </td>
            </tr>

            <!-- Cartes date / lieu, deux teintes issues du dégradé -->
            <tr>
              <td style="padding:22px 32px 0;">
                <table role="presentation" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td width="50%" style="padding-right:5px; vertical-align:top;">
                      <table role="presentation" width="100%" style="border-collapse:collapse; background:${cartePale1}; border-radius:20px;">
                        <tr><td style="padding:16px; text-align:center;">
                          <div style="font-size:22px; line-height:1;">📅</div>
                          <div style="margin-top:8px; font-size:13px; font-weight:800; color:${texteCarte1}; text-transform:capitalize;">
                            ${champs.dateAffichee}
                          </div>
                        </td></tr>
                      </table>
                    </td>
                    ${
                      champs.lieu
                        ? `<td width="50%" style="padding-left:5px; vertical-align:top;">
                            <table role="presentation" width="100%" style="border-collapse:collapse; background:${cartePale2}; border-radius:20px;">
                              <tr><td style="padding:16px; text-align:center;">
                                <div style="font-size:22px; line-height:1;">📍</div>
                                <div style="margin-top:8px; font-size:13px; font-weight:800;">
                                  <a href="${urlMaps}" style="color:${texteCarte2}; text-decoration:none;">${champs.lieu}</a>
                                </div>
                              </td></tr>
                            </table>
                          </td>`
                        : ""
                    }
                  </tr>
                </table>
              </td>
            </tr>

            ${
              champs.description
                ? `<tr>
                    <td style="padding:24px 32px 0; color:#6B5C50; font-size:14.5px; line-height:1.7; text-align:center;">
                      ${champs.description}
                    </td>
                  </tr>`
                : ""
            }

            <!-- Bouton pilule dégradé -->
            <tr>
              <td style="padding:30px 32px 6px; text-align:center;">
                <table role="presentation" style="margin:0 auto; border-collapse:collapse;">
                  <tr>
                    <td style="background:linear-gradient(135deg, ${champs.couleurAccent}, ${couleur2}); border-radius:50px; box-shadow:0 10px 20px ${champs.couleurAccent}59;">
                      <a href="${champs.lienBouton}" style="display:inline-block; padding:16px 40px; color:#ffffff; text-decoration:none; font-size:15px; font-weight:800; border-radius:50px;">
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
                    <td style="padding:16px 32px 4px; text-align:center;">
                      <a href="${champs.urlAnnulation}" style="color:#C9BEB4; font-size:12px; text-decoration:underline;">
                        Un empêchement ? Annuler ma place
                      </a>
                    </td>
                  </tr>`
                : ""
            }

            ${
              champs.urlDesinscription
                ? `<tr>
                    <td style="padding:6px 32px 4px; text-align:center;">
                      <a href="${champs.urlDesinscription}" style="color:#C9BEB4; font-size:12px; text-decoration:underline;">
                        Ne plus recevoir ces invitations
                      </a>
                    </td>
                  </tr>`
                : ""
            }

            <tr>
              <td style="padding:22px 32px 30px;"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 8px; text-align:center;">
          <span style="color:#C9BEB4; font-size:11px;">
            Envoyé avec <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://checkinfree.com"}" style="color:#C9BEB4; text-decoration:underline;">CheckIn Free</a>
          </span>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
