"use client";

import { useAuth } from "@/hooks/useAuth";
import NavbarPME from "@/components/layout/NavbarPME";
import NavbarPublic from "@/components/layout/NavbarPublic";

export default function FpdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <>
      {user ? <NavbarPME /> : <NavbarPublic />}
      <div className="min-h-screen bg-surface pt-4">{children}</div>
    </>
  );
}