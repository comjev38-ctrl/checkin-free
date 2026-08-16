import QRCode from "qrcode";

// Le QR code encode le code court du billet (pas l'UUID complet) pour
// rester lisible même en saisie manuelle si la caméra ne peut pas
// être utilisée à l'entrée.
export async function genererQrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(code, {
    width: 480,
    margin: 1,
    color: { dark: "#16213E", light: "#FAFAF8" },
  });
}
