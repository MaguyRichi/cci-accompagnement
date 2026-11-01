import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plateforme Accompagnement PME — CCI Haute Matsiatra",
  description: "Plateforme web d'accompagnement, de diagnostic et de mentorat des PMEs de la CCI Haute Matsiatra",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-surface text-on-surface antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}