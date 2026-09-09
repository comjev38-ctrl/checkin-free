import QRCode from "qrcode";

// Le QR code encode le code court du billet (pas l'UUID complet) pour
// rester lisible même en saisie manuelle si la caméra ne peut pas
// être utilisée à l'entrée.
export async function genererQrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(code, {
    width: 480,
    margin: 1,
    color: { dark: "#1E1B39", light: "#FFFFFF" },
  });
}

/**
 * Génère le QR en PNG brut (Buffer), pour le servir comme une vraie
 * image hébergée via une URL — plus fiable dans les emails qu'une
 * image encodée en base64 directement dans le HTML (mal supportée
 * par certains clients, notamment Outlook).
 */
export async function genererQrBuffer(code: string): Promise<Buffer> {
  return QRCode.toBuffer(code, {
    width: 480,
    margin: 1,
    color: { dark: "#1E1B39", light: "#FFFFFF" },
  });
}
