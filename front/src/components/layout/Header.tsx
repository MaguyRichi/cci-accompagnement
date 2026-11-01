"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  notificationsApi,
  searchApi,
  getImageUrl,
  SearchResults,
} from "@/lib/api-services";
import Icon from "@/components/ui/Icon";
import ProfileModal from "./ProfileModal";

type OpenMenu = "notifications" | "help" | null;

export default function Header() {
  const router = useRouter();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user
    ? `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase()
    : "?";

  /* ---------- Recherche debounce ---------- */
  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setResults(null);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await searchApi.global(search.trim(), 5);
        setResults(res);
        setShowResults(true);
      } catch (err) {
        console.error("Erreur recherche:", err);
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  /* ---------- Click outside ---------- */
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /* ---------- Escape ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowResults(false);
        setOpenMenu(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleResultClick = (path: string) => {
    setShowResults(false);
    setSearch("");
    router.push(path);
  };

  const hasResults =
    results &&
    results.total > 0 &&
    (results.utilisateurs.length > 0 ||
      results.entreprises.length > 0 ||
      results.demandes.length > 0 ||
      results.documents.length > 0);

  return (
    <>
      <header
        ref={menuRef}
        className="
          hidden lg:flex
          fixed top-3 left-[17.5rem] right-3 h-16 z-40
          items-center justify-between gap-4 px-4
          rounded-2xl
          bg-surface-container-lowest/85 backdrop-blur-xl
          border border-black/5
          shadow-[0_10px_40px_-8px_rgba(15,23,42,0.15)]
        "
      >
        {/* ============ RECHERCHE ============ */}
        <div className="flex-1 max-w-2xl relative" ref={searchRef}>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              {isSearching ? (
                <Icon name="refresh" size={18} className="animate-spin" />
              ) : (
                <Icon name="search" size={18} />
              )}
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => results && setShowResults(true)}
              placeholder="Rechercher un dossier, une PME, un NIF/STAT..."
              className="
                w-full pl-10 pr-4 py-2.5
                bg-surface-container/70 hover:bg-surface-container
                rounded-xl text-body-sm text-on-surface
                placeholder:text-outline
                border border-transparent
                focus:outline-none focus:ring-2 focus:ring-primary-container/60 focus:bg-surface-container-lowest focus:border-black/5
                transition-all duration-200
              "
            />
          </div>

          {/* Résultats */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl border border-black/5 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.22)] overflow-hidden max-h-[500px] overflow-y-auto">
              {!hasResults ? (
                <div className="p-6 text-center">
                  <Icon
                    name="search"
                    size={24}
                    className="text-outline mx-auto mb-2"
                  />
                  <p className="text-label-md text-on-surface-variant">
                    Aucun résultat pour « {search} »
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {results!.utilisateurs.length > 0 && (
                    <ResultSection
                      title="Utilisateurs"
                      icon="user"
                      items={results!.utilisateurs.map((u: any) => ({
                        id: u.id,
                        primary: `${u.prenom} ${u.nom}`,
                        secondary: u.email,
                        badge: u.role,
                        path: `/admin/inscriptions?user=${u.id}`,
                      }))}
                      onClick={handleResultClick}
                    />
                  )}

                  {results!.entreprises.length > 0 && (
                    <ResultSection
                      title="Entreprises"
                      icon="building"
                      items={results!.entreprises.map((e: any) => ({
                        id: e.id,
                        primary: e.raisonSociale,
                        secondary: `${e.ville || ""}${e.nif ? " • " + e.nif : ""}`,
                        badge: e.statut,
                        path: `/admin/inscriptions?entreprise=${e.id}`,
                      }))}
                      onClick={handleResultClick}
                    />
                  )}

                  {results!.demandes.length > 0 && (
                    <ResultSection
                      title="Demandes"
                      icon="folder"
                      items={results!.demandes.map((d: any) => ({
                        id: d.id,
                        primary: d.titre || `Demande ${d.id}`,
                        secondary: d.type,
                        badge: d.statut,
                        path: `/admin/inscriptions?demande=${d.id}`,
                      }))}
                      onClick={handleResultClick}
                    />
                  )}

                  {results!.documents.length > 0 && (
                    <ResultSection
                      title="Documents"
                      icon="description"
                      items={results!.documents.map((doc: any) => ({
                        id: doc.id,
                        primary: doc.nom,
                        secondary: doc.categorie,
                        badge: doc.valide ? "Validé" : "En attente",
                        path: `/admin/documents?doc=${doc.id}`,
                      }))}
                      onClick={handleResultClick}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============ ACTIONS DROITE ============ */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Notifications */}
          <Link
            href="/admin/notifications"
            className="
              relative w-10 h-10 rounded-xl flex items-center justify-center
              text-on-surface-variant hover:text-primary hover:bg-surface-container/70
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
            "
            aria-label="Notifications"
            title="Notifications"
          >
            <Icon name="bell" size={20} />
            <NotificationBadge />
          </Link>

          {/* Aide */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenMenu(openMenu === "help" ? null : "help")
              }
              aria-expanded={openMenu === "help"}
              aria-haspopup="menu"
              aria-label="Aide"
              title="Aide"
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
                ${
                  openMenu === "help"
                    ? "bg-primary-container/10 text-primary"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container/70"
                }
              `}
            >
              <Icon name="help" size={20} />
            </button>

            {openMenu === "help" && (
              <div
                role="menu"
                className="
                  absolute right-0 top-[calc(100%+8px)] w-72
                  rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl
                  border border-black/5 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.22)]
                  p-1.5
                  animate-[fadeInUp_0.2s_ease-out_both]
                "
              >
                <div className="px-3 py-2 border-b border-black/5 mb-1">
                  <p className="text-label-md font-semibold text-on-surface">
                    Centre d&apos;aide
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    Ressources et support
                  </p>
                </div>

                <HelpLink
                  href="/admin/dashboard"
                  icon="description"
                  title="Documentation"
                  description="Guide d'utilisation de la plateforme"
                  onClick={() => setOpenMenu(null)}
                />
                <HelpLink
                  href="/admin/inscriptions"
                  icon="support_agent"
                  title="Support"
                  description="Contacter l'équipe technique"
                  onClick={() => setOpenMenu(null)}
                />
                <HelpLink
                  href="/admin/dashboard"
                  icon="history"
                  title="Nouveautés"
                  description="Dernières mises à jour"
                  onClick={() => setOpenMenu(null)}
                />

                <div className="my-1 border-t border-black/5" />

                <div className="px-3 py-2 text-code-sm text-outline">
                  Version 1.0.0 — © CCI Matsiatra
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-black/5 mx-1" aria-hidden="true" />

          {/* User card → clic ouvre modal */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-container/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
            aria-label="Voir et modifier mon profil"
          >
            {user?.photoProfil ? (
              <img
                src={getImageUrl(user.photoProfil) || ""}
                alt=""
                className="w-9 h-9 rounded-lg object-cover ring-1 ring-black/5"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center text-label-sm font-bold">
                {initials}
              </div>
            )}
            <div className="flex flex-col text-left max-w-[140px]">
              <span className="text-label-sm font-semibold text-on-surface leading-tight truncate">
                {user ? `${user.prenom} ${user.nom}` : "Délégué consulaire"}
              </span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">
                {user?.role || "ADMIN"}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Modal profil admin */}
      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        variant="admin"
      />
    </>
  );
}

/* ============================================
   SOUS-COMPOSANTS
   ============================================ */
function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await notificationsApi.getCountNonLues();
        if (!cancelled) setCount(res.count || 0);
      } catch {
        /* silencieux */
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span
      className="
        absolute top-1.5 right-1.5 min-w-[18px] h-[18px]
        px-1 rounded-full bg-error text-on-error
        text-[10px] font-bold leading-none
        flex items-center justify-center
        ring-2 ring-surface-container-lowest/90
      "
      aria-hidden="true"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function ResultSection({
  title,
  icon,
  items,
  onClick,
}: {
  title: string;
  icon: string;
  items: {
    id: number;
    primary: string;
    secondary?: string;
    badge?: string;
    path: string;
  }[];
  onClick: (path: string) => void;
}) {
  return (
    <div className="mb-1 last:mb-0">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Icon name={icon as any} size={13} className="text-outline" />
        <span className="text-[10px] font-semibold text-outline uppercase tracking-widest">
          {title}
        </span>
        <span className="text-[10px] text-outline">({items.length})</span>
      </div>
      {items.map((item) => (
        <button
          key={`${title}-${item.id}`}
          onClick={() => onClick(item.path)}
          className="
            w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left
            hover:bg-surface-container/70 transition-colors duration-150
          "
        >
          <div className="flex-1 min-w-0">
            <p className="text-label-md text-on-surface font-medium truncate">
              {item.primary}
            </p>
            {item.secondary && (
              <p className="text-code-sm text-on-surface-variant truncate">
                {item.secondary}
              </p>
            )}
          </div>
          {item.badge && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-outline shrink-0">
              {item.badge}
            </span>
          )}
          <Icon name="chevron-right" size={14} className="text-outline shrink-0" />
        </button>
      ))}
    </div>
  );
}

function HelpLink({
  href,
  icon,
  title,
  description,
  onClick,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="
        flex items-start gap-3 px-3 py-2.5 rounded-xl
        hover:bg-surface-container/70 transition-colors duration-150
      "
    >
      <div className="w-8 h-8 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
        <Icon name={icon as any} size={16} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-label-md font-semibold text-on-surface">
          {title}
        </span>
        <span className="text-code-sm text-on-surface-variant">
          {description}
        </span>
      </div>
    </Link>
  );
}