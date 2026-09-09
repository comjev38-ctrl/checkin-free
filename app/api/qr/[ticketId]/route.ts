import { createServiceClient } from "@/lib/supabase/server";
import QRCode from "qrcode";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { ticketId: string } }
) {
  const supabase = createServiceClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("code")
    .eq("id", params.ticketId)
    .single();

  if (!ticket) {
    return new NextResponse("Billet introuvable", { status: 404 });
  }

  const buffer = await QRCode.toBuffer(ticket.code, {
    width: 480,
    margin: 1,
    color: { dark: "#1E1B39", light: "#FFFFFF" },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      // Le contenu ne change jamais pour un billet donné (le code est
      // fixé à la création) — mise en cache longue sans risque.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
