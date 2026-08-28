import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import EcranOuverture from "@/components/ecran-ouverture";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CheckIn Free",
  description: "Émargement et billetterie événementielle gratuite",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CheckIn Free",
  },
};

export const viewport: Viewport = {
  themeColor: "#5B5FEF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <EcranOuverture />
        {children}
      </body>
    </html>
  );
}
