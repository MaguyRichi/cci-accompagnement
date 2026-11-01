import NavbarPME from "@/components/layout/NavbarPME";

export default function PmeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <NavbarPME />
      {/* Padding pour compenser la navbar flottante */}
      <main className="flex-1 pt-20 sm:pt-24">{children}</main>
    </div>
  );
}