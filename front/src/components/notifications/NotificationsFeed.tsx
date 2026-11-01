"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { notificationsApi, Notification } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

/* ============================================
   TYPES
   ============================================ */
type NotifType =
  | "INFO"
  | "ALERTE"
  | "RAPPEL"
  | "VALIDATION"
  | "MESSAGE"
  | "COTA"
  | "RDV"
  | "MENTORAT";

/* ============================================
   HELPERS
   ============================================ */
function stripEmojis(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

const TYPE_CONFIG: Record<
  NotifType,
  {
    icon: string;
    label: string;
    gradient: string;
    iconColor: string;
    border: string;
  }
> = {
  INFO: {
    icon: "info",
    label: "Information",
    gradient: "from-blue-50 to-blue-100",
    iconColor: "text-blue-600",
    border: "border-l-blue-400",
  },
  ALERTE: {
    icon: "alert",
    label: "Alerte",
    gradient: "from-red-50 to-red-100",
    iconColor: "text-red-600",
    border: "border-l-red-400",
  },
  RAPPEL: {
    icon: "schedule",
    label: "Rappel",
    gradient: "from-amber-50 to-amber-100",
    iconColor: "text-amber-600",
    border: "border-l-amber-400",
  },
  VALIDATION: {
    icon: "check",
    label: "Validation",
    gradient: "from-emerald-50 to-emerald-100",
    iconColor: "text-emerald-600",
    border: "border-l-emerald-400",
  },
  MESSAGE: {
    icon: "chat",
    label: "Message",
    gradient: "from-indigo-50 to-indigo-100",
    iconColor: "text-indigo-600",
    border: "border-l-indigo-400",
  },
  COTA: {
    icon: "payment",
    label: "Cotisation",
    gradient: "from-purple-50 to-purple-100",
    iconColor: "text-purple-600",
    border: "border-l-purple-400",
  },
  RDV: {
    icon: "calendar",
    label: "Rendez-vous",
    gradient: "from-cyan-50 to-cyan-100",
    iconColor: "text-cyan-600",
    border: "border-l-cyan-400",
  },
  MENTORAT: {
    icon: "mentor",
    label: "Mentorat",
    gradient: "from-teal-50 to-teal-100",
    iconColor: "text-teal-600",
    border: "border-l-teal-400",
  },
};

const DEFAULT_CONFIG = TYPE_CONFIG.INFO;

/* ============================================
   HELPERS DE DATE
   ============================================ */
function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH} h`;
  if (diffD === 1) return "hier";
  if (diffD < 7) return `il y a ${diffD} j`;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor(
    (today.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return "Cette semaine";
  if (diffDays < 30) return "Ce mois-ci";
  return "Plus ancien";
}

/* ============================================
   COMPOSANT PRINCIPAL
   ============================================ */
interface NotificationsFeedProps {
  variant?: "pme" | "admin";
}

export default function NotificationsFeed({
  variant = "pme",
}: NotificationsFeedProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterLu, setFilterLu] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [removingIds, setRemovingIds] = useState<number[]>([]);

  const isAdmin = variant === "admin";
  const notifPath = isAdmin ? "/admin/notifications" : "/pme/notifications";

  /* ---------- Chargement ---------- */
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationsApi.getMesNotifications({
        limit: 100,
        lu: filterLu || undefined,
      });
      setNotifications(res.data || []);
    } catch (error) {
      console.error("Erreur notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLu]);

  /* ---------- Filtrage ---------- */
  const filteredNotifications = useMemo(() => {
    if (!filterType) return notifications;
    return notifications.filter((n) => n.type === filterType);
  }, [notifications, filterType]);

  /* ---------- Groupement ---------- */
  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    const order = [
      "Aujourd'hui",
      "Hier",
      "Cette semaine",
      "Ce mois-ci",
      "Plus ancien",
    ];

    filteredNotifications.forEach((n) => {
      const key = getDateGroup(n.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    return order
      .filter((k) => groups[k]?.length)
      .map((k) => ({ label: k, items: groups[k] }));
  }, [filteredNotifications]);

  /* ---------- Actions ---------- */
  const handleClick = async (notif: Notification) => {
    if (!notif.lu) {
      try {
        await notificationsApi.marquerCommeLue(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, lu: true } : n)),
        );
      } catch {}
    }
    if (notif.lien) {
      router.push(notif.lien);
    }
  };

  const handleToutLu = async () => {
    try {
      await notificationsApi.toutMarquerCommeLu();
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    } catch {}
  };

  const handleSupprimer = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette notification ?")) return;

    setRemovingIds((prev) => [...prev, id]);
    setTimeout(async () => {
      try {
        await notificationsApi.remove(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch {
        /* silencieux */
      } finally {
        setRemovingIds((prev) => prev.filter((x) => x !== id));
      }
    }, 250);
  };

  /* ---------- Stats ---------- */
  const nonLues = notifications.filter((n) => !n.lu).length;
  const total = notifications.length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col w-full gap-6">
        {/* HEADER */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-headline-lg text-primary tracking-tight">
                  Notifications
                </h1>
                {nonLues > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-label-sm font-semibold">
                    <Icon name="bell" size={12} />
                    {nonLues} nouvelle{nonLues > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-body-md text-on-surface-variant">
                {isAdmin
                  ? "Suivez les activités et alertes de la plateforme"
                  : "Restez informé des activités et alertes de la CCI"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {nonLues > 0 && (
                <button
                  onClick={handleToutLu}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-label-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
                >
                  <Icon name="check" size={16} />
                  <span>Tout marquer comme lu</span>
                </button>
              )}
              <button
                onClick={loadNotifications}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
                title="Actualiser"
                aria-label="Actualiser les notifications"
              >
                <Icon name="refresh" size={18} />
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatPill
              label="Total"
              value={total}
              icon="bell"
              active={filterLu === ""}
              onClick={() => setFilterLu("")}
            />
            <StatPill
              label="Non lues"
              value={nonLues}
              icon="info"
              active={filterLu === "false"}
              onClick={() => setFilterLu("false")}
              accent
            />
            <StatPill
              label="Lues"
              value={total - nonLues}
              icon="check"
              active={filterLu === "true"}
              onClick={() => setFilterLu("true")}
            />
            <StatPill
              label="Aujourd'hui"
              value={
                notifications.filter(
                  (n) => getDateGroup(n.createdAt) === "Aujourd'hui",
                ).length
              }
              icon="calendar"
              active={false}
              onClick={() => {}}
            />
          </div>

          {/* FILTRES TYPE */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <FilterChip
              label="Tous types"
              active={filterType === ""}
              onClick={() => setFilterType("")}
            />
            {(Object.keys(TYPE_CONFIG) as NotifType[]).map((type) => {
              const cfg = TYPE_CONFIG[type];
              const count = notifications.filter((n) => n.type === type).length;
              if (count === 0) return null;
              return (
                <FilterChip
                  key={type}
                  label={cfg.label}
                  icon={cfg.icon}
                  count={count}
                  active={filterType === type}
                  onClick={() => setFilterType(type)}
                />
              );
            })}
          </div>
        </div>

        {/* CONTENU */}
        {isLoading ? (
          <SkeletonList />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-1">
                  <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    {group.label}
                  </span>
                  <span className="text-code-sm text-outline">
                    {group.items.length}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-surface-container-high to-transparent" />
                </div>

                <div className="flex flex-col gap-2">
                  {group.items.map((notif, idx) => (
                    <NotificationCard
                      key={notif.id}
                      notif={notif}
                      isRemoving={removingIds.includes(notif.id)}
                      onClick={() => handleClick(notif)}
                      onDelete={(e) => handleSupprimer(notif.id, e)}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   STAT PILL
   ============================================ */
function StatPill({
  label,
  value,
  icon,
  active,
  onClick,
  accent,
}: {
  label: string;
  value: number;
  icon: string;
  active: boolean;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-xl text-left
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
        ${
          active
            ? "bg-primary-container/10 ring-1 ring-primary-container/30"
            : "bg-surface-container-lowest hover:bg-surface-container-low shadow-sm"
        }
      `}
    >
      <div
        className={`
          w-9 h-9 rounded-lg flex items-center justify-center shrink-0
          ${
            accent && value > 0
              ? "bg-error-container text-on-error-container"
              : active
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface-variant"
          }
        `}
      >
        <Icon name={icon as any} size={18} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-code-sm text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
        <span
          className={`text-title-lg font-bold leading-tight ${
            accent && value > 0 ? "text-error" : "text-on-surface"
          }`}
        >
          {value}
        </span>
      </div>
    </button>
  );
}

/* ============================================
   FILTER CHIP
   ============================================ */
function FilterChip({
  label,
  icon,
  count,
  active,
  onClick,
}: {
  label: string;
  icon?: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full
        text-label-sm font-medium whitespace-nowrap
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
        ${
          active
            ? "bg-primary text-on-primary shadow-sm"
            : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border border-black/5"
        }
      `}
    >
      {icon && <Icon name={icon as any} size={14} />}
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={`
            ml-0.5 min-w-[18px] h-[18px] px-1.5 rounded-full
            text-[10px] font-bold leading-none
            flex items-center justify-center
            ${active ? "bg-white/25" : "bg-surface-container text-on-surface-variant"}
          `}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

/* ============================================
   CARTE NOTIFICATION
   ============================================ */
function NotificationCard({
  notif,
  isRemoving,
  onClick,
  onDelete,
  index,
}: {
  notif: Notification;
  isRemoving: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  index: number;
}) {
  const cfg =
    TYPE_CONFIG[(notif.type as NotifType) || "INFO"] || DEFAULT_CONFIG;
  const unread = !notif.lu;
  const cleanTitre = stripEmojis(notif.titre) || "Notification";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
      className={`
        group relative flex items-start gap-3.5 p-4
        rounded-2xl cursor-pointer
        border border-black/5
        transition-all duration-300 ease-out
        animate-[fadeInUp_0.4s_ease-out_both]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
        ${
          isRemoving
            ? "opacity-0 -translate-x-4 scale-95 pointer-events-none"
            : unread
              ? `bg-surface-container-lowest shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_8px_24px_-6px_rgba(15,23,42,0.14)] hover:-translate-y-0.5 border-l-4 ${cfg.border}`
              : "bg-surface-container-lowest/60 hover:bg-surface-container-lowest hover:shadow-[0_4px_16px_-6px_rgba(15,23,42,0.10)]"
        }
      `}
    >
      <div
        className={`
          shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
          bg-gradient-to-br ${cfg.gradient} ${cfg.iconColor}
          ring-1 ring-black/5
        `}
      >
        <Icon name={cfg.icon as any} size={20} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className={`
                text-title-md truncate
                ${unread ? "text-on-surface font-semibold" : "text-on-surface-variant font-medium"}
              `}
            >
              {cleanTitre}
            </h3>
            {unread && (
              <span
                className="shrink-0 w-1.5 h-1.5 rounded-full bg-error animate-pulse"
                aria-label="Non lue"
              />
            )}
          </div>
          <span className="shrink-0 text-code-sm text-outline whitespace-nowrap">
            {getRelativeTime(notif.createdAt)}
          </span>
        </div>

        {notif.message && (
          <p className="text-body-sm text-on-surface-variant line-clamp-2">
            {notif.message}
          </p>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-md
              text-[10px] font-semibold uppercase tracking-wider
              bg-gradient-to-br ${cfg.gradient} ${cfg.iconColor}
            `}
          >
            <Icon name={cfg.icon as any} size={10} />
            {cfg.label}
          </span>
          {notif.emailEnvoye && (
            <span className="inline-flex items-center gap-1 text-code-sm text-outline">
              <Icon name="mail" size={11} />
              <span>Email envoyé</span>
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label="Supprimer la notification"
        className="
          shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          text-outline
          opacity-0 group-hover:opacity-100
          hover:text-error hover:bg-error-container/30
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 focus-visible:opacity-100
        "
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
}

/* ============================================
   SKELETON
   ============================================ */
function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3.5 p-4 rounded-2xl bg-surface-container-lowest border border-black/5 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="w-11 h-11 rounded-xl bg-surface-container" />
          <div className="flex-1 flex flex-col gap-2 pt-1">
            <div className="h-3.5 w-1/3 rounded bg-surface-container" />
            <div className="h-3 w-3/4 rounded bg-surface-container" />
            <div className="h-2.5 w-1/4 rounded bg-surface-container" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================
   ÉTAT VIDE
   ============================================ */
function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest border border-black/5 shadow-sm p-10 sm:p-14 text-center">
      <div
        aria-hidden="true"
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary-container/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-secondary-container/20 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative w-32 h-32">
          <Image
            src="/images/empty-state.svg"
            alt=""
            fill
            sizes="128px"
            className="object-contain opacity-80"
          />
        </div>
        <div className="flex flex-col gap-1.5 max-w-md">
          <h3 className="text-headline-sm text-primary tracking-tight">
            Aucune notification
          </h3>
          <p className="text-body-md text-on-surface-variant">
            Vous serez informé ici dès qu&apos;une activité importante se
            produira sur votre compte.
          </p>
        </div>
      </div>
    </div>
  );
}