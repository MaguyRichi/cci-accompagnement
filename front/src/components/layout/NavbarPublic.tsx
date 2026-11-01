"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";

const navItems = [
  { href: "/", icon: "home", label: "Accueil" },
  { href: "/annuaire", icon: "storefront", label: "Annuaire" },
  { href: "/fpd", icon: "school", label: "Formation FPD" },
];

export default function NavbarPublic() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={`fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[1440px] transition-all duration-300 ease-out ${
          scrolled ? "top-2" : "top-3 sm:top-4"
        }`}
      >
        <nav
          className={`
            relative flex items-center justify-between gap-2
            px-3 sm:px-4 h-14 sm:h-16
            rounded-2xl
            bg-surface-container-lowest/85 backdrop-blur-xl
            border border-black/5
            transition-all duration-300 ease-out
            ${
              scrolled
                ? "shadow-[0_10px_40px_-8px_rgba(15,23,42,0.22)]"
                : "shadow-[0_6px_24px_-6px_rgba(15,23,42,0.14)]"
            }
          `}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 shrink-0 group"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-xl bg-white ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 overflow-hidden">
              <Image
                src="/logo.jpg"
                alt="CCI Haute Matsiatra"
                fill
                sizes="40px"
                className="object-contain p-0.5"
              />
            </div>
            <div className="hidden sm:flex flex-col leading-tight text-left">
              <span className="text-title-sm text-primary tracking-tight">
                CCI Matsiatra
              </span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                Matsiatra Ambony
              </span>
            </div>
          </Link>

          {/* Liens Desktop */}
          <ul className="hidden lg:flex items-center gap-0.5 flex-1 justify-center px-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      relative flex items-center gap-1.5 px-3 py-2 rounded-xl
                      text-label-md font-medium whitespace-nowrap
                      transition-all duration-200 ease-out
                      ${
                        active
                          ? "text-primary bg-primary-container/10"
                          : "text-on-surface-variant hover:text-primary hover:bg-surface-container/60"
                      }
                    `}
                  >
                    <Icon name={item.icon as any} size={17} />
                    <span className="hidden xl:inline">{item.label}</span>
                    <span
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
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/connexion"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-label-md font-medium hover:bg-surface-container transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors shadow-sm"
            >
              S'inscrire
            </Link>

            {/* Burger mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container/70 transition-all"
              type="button"
              aria-label="Ouvrir le menu"
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

      {/* Drawer mobile */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-[60] bg-primary/40 backdrop-blur-sm lg:hidden transition-opacity ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-80 max-w-[88vw] bg-surface-container-lowest z-[70] lg:hidden shadow-2xl flex flex-col transition-transform ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-surface-container-low flex items-center justify-between">
          <span className="text-title-md font-bold text-primary">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-outline hover:bg-surface-container transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-label-md ${
                  active
                    ? "bg-primary-container/10 text-primary font-semibold"
                    : "text-on-surface hover:bg-surface-container/70"
                }`}
              >
                <Icon name={item.icon as any} size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-surface-container-low flex flex-col gap-2">
          <Link href="/connexion" className="w-full py-2.5 text-center rounded-xl bg-surface-container-low text-on-surface text-label-md font-medium hover:bg-surface-container transition-colors">
            Se connecter
          </Link>
          <Link href="/inscription" className="w-full py-2.5 text-center rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors">
            S'inscrire
          </Link>
        </div>
      </aside>

      {/* Spacer pour compenser la navbar flottante */}
      <div className="h-20 sm:h-24" />
    </>
  );
}