"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getImageUrl } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";
import ProfileModal from "./ProfileModal";

interface MenuItem {
  href: string;
  icon: any;
  label: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    href: "/admin/dashboard",
    icon: "dashboard",
    label: "Tableau de bord",
    roles: ["ADMIN"],
  },
  {
    href: "/admin/inscriptions",
    icon: "folder",
    label: "Demandes & Utilisateurs",
    roles: ["ADMIN"],
  },
  {
    href: "/admin/diagnostics",
    icon: "chart",
    label: "Diagnostics",
    roles: ["ADMIN"],
  },
  {
    href: "/admin/documents",
    icon: "folder_open",
    label: "Documents",
    roles: ["ADMIN"],
  },
  {
    href: "/admin/fpd",
    icon: "school",
    label: "Formation FPD",
    roles: ["ADMIN"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const visibleItems = user
    ? menuItems.filter((item) => item.roles.includes(user.role))
    : [];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const initials = user
    ? `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase()
    : "?";

  const avatarUrl = getImageUrl(user?.photoProfil);

  return (
    <>
      <aside
        aria-label="Navigation administration"
        className="
          hidden lg:flex
          fixed left-3 top-3 bottom-3 z-40 w-64
          flex-col justify-between
          rounded-2xl
          bg-surface-container-lowest/85 backdrop-blur-xl
          border border-black/5
          shadow-[0_10px_40px_-8px_rgba(15,23,42,0.22)]
          select-none
          overflow-hidden
        "
      >
        <div className="flex flex-col min-h-0 flex-1">
          <div className="px-4 py-4 flex items-center gap-3 border-b border-black/5">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 min-w-0 group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60 rounded-xl"
              aria-label="Voir et modifier le profil admin"
            >
              <div className="relative w-11 h-11 flex-shrink-0 rounded-xl bg-white ring-1 ring-black/5 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.jpg"
                  alt="CCI Haute Matsiatra"
                  fill
                  sizes="44px"
                  className="object-contain p-1"
                />
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-title-sm text-primary truncate tracking-tight">
                  CCI Matsiatra
                </span>
                <span className="text-[10px] text-on-surface-variant truncate uppercase tracking-wider">
                  Administration
                </span>
              </div>
            </button>
          </div>

          <div className="px-4 pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-outline font-semibold">
              Navigation
            </span>
          </div>

          <nav className="flex flex-col px-2 gap-0.5 overflow-y-auto flex-1 pb-2">
            {visibleItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`
                    group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                    text-label-md font-medium
                    transition-all duration-200 ease-out
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
                    ${
                      active
                        ? "bg-primary-container/15 text-primary"
                        : "text-on-surface-variant hover:text-primary hover:bg-surface-container/60"
                    }
                  `}
                >
                  <span
                    aria-hidden="true"
                    className={`
                      absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-primary
                      transition-all duration-300 ease-out
                      ${active ? "h-6 opacity-100" : "h-0 opacity-0"}
                    `}
                  />
                  <Icon
                    name={item.icon}
                    size={19}
                    className={active ? "text-primary" : ""}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-black/5 flex flex-col gap-2">
          {user && (
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container/60 hover:bg-surface-container w-full text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
              aria-label="Voir mon profil"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover shrink-0 ring-1 ring-black/5"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center text-label-sm font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-label-sm font-semibold text-on-surface truncate">
                  {user.prenom} {user.nom}
                </span>
                <span className="text-[10px] text-outline uppercase tracking-wider truncate">
                  {user.role}
                </span>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            className="
              flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
              bg-surface-container-lowest text-error text-label-sm font-medium
              hover:bg-error-container/30
              transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40
            "
          >
            <Icon name="logout" size={17} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        variant="admin"
      />
    </>
  );
}