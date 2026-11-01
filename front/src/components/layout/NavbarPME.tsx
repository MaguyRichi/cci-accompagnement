"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { notificationsApi, getImageUrl } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";
import ProfileModal from "./ProfileModal";

interface NavItem {
  href: string;
  icon: any;
  label: string;
  shortLabel?: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { href: "/pme/dashboard", icon: "dashboard", label: "Tableau de bord", shortLabel: "Accueil", roles: ["DIRIGEANT"] },
  { href: "/pme/mur", icon: "feed", label: "Mon Mur", shortLabel: "Mur", roles: ["DIRIGEANT"] },
  { href: "/pme/diagnostic/questionnaire", icon: "assessment", label: "Diagnostic 360", shortLabel: "Diag.", roles: ["DIRIGEANT"] },
  { href: "/pme/mentorat", icon: "mentor", label: "Mentorat", shortLabel: "Mentorat", roles: ["DIRIGEANT", "MENTOR"] },
  { href: "/pme/fpd", icon: "school", label: "Formation FPD", shortLabel: "FPD", roles: ["DIRIGEANT"] },
  { href: "/pme/fpd/mentorats", icon: "workspace_premium", label: "Validations FPD", shortLabel: "FPD", roles: ["MENTOR"] },
  { href: "/pme/messages", icon: "chat", label: "Messagerie", shortLabel: "Messages", roles: ["DIRIGEANT", "MENTOR"] },
  { href: "/annuaire", icon: "storefront", label: "Annuaire", shortLabel: "Annuaire", roles: ["DIRIGEANT", "MENTOR"] },
  { href: "/pme/profil", icon: "badge", label: "Mon Profil", shortLabel: "Profil", roles: ["DIRIGEANT"] },
];

export default function NavbarPME() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [nbNonLues, setNbNonLues] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const visibleItems = user
    ? navItems.filter((item) => item.roles.includes(user.role))
    : [];

  const isActive = (href: string) => pathname.startsWith(href);

  // Avatar avec URL complète (corrige le 404)
  const avatarUrl = getImageUrl(user?.photoProfil);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await notificationsApi.getCountNonLues();
        if (!cancelled) setNbNonLues(res.count || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, pathname]);

  const initials = user ? `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase() : "?";
  const roleLabel = user?.role === "MENTOR" ? "Mentor" : user?.role === "DIRIGEANT" ? "Dirigeant" : user?.role || "";

  return (
    <>
      <header
        className={`fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[1440px] transition-all duration-300 ease-out ${
          scrolled ? "top-2" : "top-3 sm:top-4"
        }`}
        role="banner"
      >
        <nav
          aria-label="Navigation principale"
          className={`
            relative flex items-center justify-between gap-2
            px-3 sm:px-4 h-14 sm:h-16
            rounded-2xl
            bg-surface-container-lowest/85 backdrop-blur-xl
            border border-black/5
            transition-all duration-300 ease-out
            ${scrolled ? "shadow-[0_10px_40px_-8px_rgba(15,23,42,0.22)]" : "shadow-[0_6px_24px_-6px_rgba(15,23,42,0.14)]"}
          `}
        >
          {/* Logo */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60 rounded-xl"
            aria-label="Voir mon profil"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-xl bg-white ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 overflow-hidden">
              <Image
                src="/logo.jpg"
                alt="CCI"
                fill
                sizes="40px"
                loading="eager"
                priority
                className="object-contain p-0.5"
              />
            </div>
            <div className="hidden md:flex flex-col leading-tight text-left">
              <span className="text-title-sm text-primary tracking-tight">CCI Matsiatra</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Matsiatra Ambony</span>
            </div>
          </button>

          {/* Liens */}
          <ul className="hidden lg:flex items-center gap-0.5 flex-1 justify-center px-2">
            {visibleItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`
                      relative flex items-center gap-1 px-2 xl:px-3 py-2 rounded-xl
                      text-label-sm font-medium whitespace-nowrap
                      transition-all duration-200 ease-out
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
                      ${active ? "text-primary bg-primary-container/10" : "text-on-surface-variant hover:text-primary hover:bg-surface-container/60"}
                    `}
                  >
                    <Icon name={item.icon} size={16} />
                    <span className="hidden 2xl:inline">{item.label}</span>
                    <span className="hidden xl:inline 2xl:hidden">{item.shortLabel || item.label}</span>
                    <span
                      aria-hidden="true"
                      className={`
                        absolute left-1/2 -translate-x-1/2 bottom-0.5
                        h-[2px] rounded-full bg-primary
                        transition-all duration-300 ease-out
                        ${active ? "w-6 opacity-100" : "w-0 opacity-0"}
                      `}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Actions droite */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Link
              href="/pme/notifications"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container/70 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
              aria-label={`Notifications${nbNonLues > 0 ? ` — ${nbNonLues} non lues` : ""}`}
              title="Notifications"
            >
              <Icon name="bell" size={20} />
              {nbNonLues > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-bold leading-none flex items-center justify-center ring-2 ring-white/90"
                  aria-hidden="true"
                >
                  {nbNonLues > 9 ? "9+" : nbNonLues}
                </span>
              )}
            </Link>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 pl-1 pr-1.5 sm:pr-2 py-1 rounded-xl hover:bg-surface-container/70 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
                type="button"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${user?.prenom} ${user?.nom}`}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-1 ring-black/5"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center text-label-sm font-bold">
                    {initials}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left pr-1 max-w-[100px]">
                  <span className="text-label-sm font-semibold text-on-surface leading-tight truncate">
                    {user?.prenom} {user?.nom}
                  </span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">{roleLabel}</span>
                </div>
                <Icon
                  name="arrow_drop_down"
                  size={16}
                  className={`hidden md:block text-outline transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                role="menu"
                aria-hidden={!userMenuOpen}
                className={`
                  absolute right-0 top-[calc(100%+8px)] w-64
                  rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl
                  border border-black/5 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.22)]
                  p-1.5
                  transition-all duration-200 ease-out origin-top-right
                  ${userMenuOpen ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 -translate-y-1 scale-95 pointer-events-none"}
                `}
              >
                <div className="px-3 py-2.5 border-b border-black/5 mb-1">
                  <p className="text-label-md font-semibold text-on-surface truncate">{user?.prenom} {user?.nom}</p>
                  <p className="text-label-sm text-on-surface-variant truncate">{user?.email}</p>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-label-md text-on-surface hover:bg-surface-container/70 transition-colors"
                >
                  <Icon name="badge" size={17} />
                  <span>Mon profil</span>
                </button>

                <Link
                  href="/pme/notifications"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-label-md text-on-surface hover:bg-surface-container/70 transition-colors"
                >
                  <Icon name="bell" size={17} />
                  <span>Mes notifications</span>
                  {nbNonLues > 0 && <span className="ml-auto text-[10px] font-bold text-error">{nbNonLues}</span>}
                </Link>

                <div className="my-1 border-t border-black/5" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-label-md text-error hover:bg-error-container/30 transition-colors"
                >
                  <Icon name="logout" size={17} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container/70 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
              type="button"
              aria-label="Ouvrir le menu"
              aria-controls="mobile-drawer"
              aria-expanded={mobileOpen}
            >
              <span className="relative w-5 h-5 flex flex-col justify-center items-center gap-[5px]">
                <span className="block h-[2px] w-5 rounded-full bg-current" />
                <span className="block h-[2px] w-5 rounded-full bg-current" />
                <span className="block h-[2px] w-5 rounded-full bg-current" />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={`
          fixed inset-0 z-[60] bg-primary/40 backdrop-blur-sm lg:hidden
          transition-opacity duration-300 ease-out
          ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      <aside
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={`
          fixed top-0 right-0 bottom-0 w-80 max-w-[88vw]
          bg-surface-container-lowest z-[70] lg:hidden
          shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="p-4 border-b border-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-11 h-11 rounded-xl object-cover ring-1 ring-black/5" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold">{initials}</div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-label-md font-semibold text-on-surface truncate">{user?.prenom} {user?.nom}</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">{roleLabel}</span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-outline hover:bg-surface-container transition-colors"
            type="button"
            aria-label="Fermer le menu"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`
                  flex items-center gap-3 px-3.5 py-3 rounded-xl
                  text-label-md transition-colors duration-200
                  ${active ? "bg-primary-container/10 text-primary font-semibold" : "text-on-surface hover:bg-surface-container/70"}
                `}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-surface-container-low">
          <button
            onClick={() => {
              setMobileOpen(false);
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-surface-container-low text-error rounded-xl text-label-md font-medium hover:bg-error-container/30 transition-colors"
            type="button"
          >
            <Icon name="logout" size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        variant="user"
      />
    </>
  );
}