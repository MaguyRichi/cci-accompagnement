import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AdminNavbarMobile from "@/components/layout/AdminNavbarMobile";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Sidebar desktop flottante */}
      <Sidebar />

      {/* Header mobile + drawer (mobile/tablette) */}
      <AdminNavbarMobile />

      {/* Contenu principal */}
      <div className="lg:pl-[17.5rem] pt-20 lg:pt-24">
        {/* Header desktop flottant */}
        <Header />

        <main className="relative bg-surface min-h-screen">
          {children}
        </main>
      </div>
    </>
  );
}