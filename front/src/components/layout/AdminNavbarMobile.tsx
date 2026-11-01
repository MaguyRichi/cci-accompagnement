"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Icon from "@/components/ui/Icon";

const menuItems = [
  { href: "/admin/dashboard", icon: "dashboard", label: "Tableau de bord" },
  {
    href: "/admin/inscriptions",
    icon: "folder",
    label: "Demandes & Utilisateurs",
  },
  { href: "/admin/cotisations", icon: "payment", label: "Cotisations" },
  { href: "/admin/diagnostics", icon: "chart", label: "Diagnostics" },
  { href: "/admin/documents", icon: "folder_open", label: "Documents" },
];

export default function AdminNavbarMobile() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const initials = user
    ? `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase()
    : "?";

  /* Fermer au changement de route */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Escape ferme */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* Bloquer scroll body quand drawer ouvert */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* ============================================
          HEADER MOBILE FLOTTANT
          ============================================ */}
      <header
        className="
          lg:hidden
          fixed top-3 left-1/2 -translate-x-1/2 z-50
          w-[calc(100%-1.5rem)]
          h-14
          rounded-2xl
          bg-surface-container-lowest/85 backdrop-blur-xl
          border border-black/5
          shadow-[0_6px_24px_-6px_rgba(15,23,42,0.16)]
        "
      >
        <div className="h-full px-3 flex items-center justify-between gap-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 min-w-0"
            aria-label="Accueil administration"
          >
            <div className="relative w-9 h-9 flex-shrink-0 rounded-xl bg-white ring-1 ring-black/5 overflow-hidden">
              <Image
                src="/logo.jpg"
                alt="CCI Matsiatra"
                fill
                sizes="36px"
                className="object-contain p-0.5"
              />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-title-sm text-primary truncate">
                CCI Matsiatra
              </span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">
                Admin
              </span>
            </div>
          </Link>

          <button
            onClick={() => setOpen(true)}
            className="
              w-10 h-10 rounded-xl flex items-center justify-center
              text-on-surface hover:bg-surface-container/70
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
            "
            type="button"
            aria-label="Ouvrir le menu"
            aria-controls="admin-mobile-drawer"
            aria-expanded={open}
          >
            <span className="relative w-5 h-5 flex flex-col justify-center items-center gap-[5px]">
              <span className="block h-[2px] w-5 rounded-full bg-current" />
              <span className="block h-[2px] w-5 rounded-full bg-current" />
              <span className="block h-[2px] w-5 rounded-full bg-current" />
            </span>
          </button>
        </div>
      </header>

      

      {/* ============================================
          OVERLAY
          ============================================ */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`
          fixed inset-0 z-[60] bg-primary/40 backdrop-blur-sm lg:hidden
          transition-opacity duration-300 ease-out
          ${
            open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
      />

      {/* ============================================
          DRAWER MOBILE
          ============================================ */}
      <aside
        id="admin-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu d'administration"
        className={`
          fixed top-0 right-0 bottom-0 w-80 max-w-[88vw]
          bg-surface-container-lowest z-[70] lg:hidden
          shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header drawer */}
        <div className="p-4 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {user?.photoProfil ? (
              <img
                src={user.photoProfil}
                alt=""
                className="w-11 h-11 rounded-xl object-cover ring-1 ring-black/5"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold">
                {initials}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-label-md font-semibold text-on-surface truncate">
                {user?.prenom} {user?.nom}
              </span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                {user?.role || "ADMIN"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl text-outline hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
            type="button"
            aria-label="Fermer le menu"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Items */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`
                  flex items-center gap-3 px-3.5 py-3 rounded-xl
                  text-label-md transition-colors duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
                  ${
                    active
                      ? "bg-primary-container/10 text-primary font-semibold"
                      : "text-on-surface hover:bg-surface-container/70"
                  }
                `}
              >
                <Icon name={item.icon as any} size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-black/5">
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-surface-container-low text-error rounded-xl text-label-md font-medium hover:bg-error-container/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
            type="button"
          >
            <Icon name="logout" size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}