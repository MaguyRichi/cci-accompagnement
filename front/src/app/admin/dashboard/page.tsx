"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { useAuth } from "@/hooks/useAuth";
import { adminStatsApi, AdminStats, getImageUrl } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

/* ============================================
   PALETTE
   ============================================ */
const CHART_COLORS = [
  "#1e40af", // bleu
  "#0891b2", // cyan
  "#10b981", // émeraude
  "#f59e0b", // ambre
  "#ef4444", // rouge
  "#8b5cf6", // violet
  "#ec4899", // rose
  "#f97316", // orange
];

const NIVEAU_COLORS: Record<string, string> = {
  DEBUTANT: "#ef4444",
  INTERMEDIAIRE: "#f59e0b",
  AVANCE: "#0891b2",
  EXCELLENCE: "#10b981",
};

/* ============================================
   PAGE
   ============================================ */
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminStatsApi.get();
        setStats(data);
      } catch (err: any) {
        console.error("Erreur stats admin:", err);
        setError("Impossible de charger les statistiques");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  /* ---------- Skeleton ---------- */
  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col w-full gap-6">
          <div className="h-24 rounded-2xl bg-surface-container-lowest animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-surface-container-lowest animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-80 rounded-2xl bg-surface-container-lowest animate-pulse" />
            <div className="h-80 rounded-2xl bg-surface-container-lowest animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center">
            <Icon name="alert" size={32} />
          </div>
          <h1 className="text-headline-md text-primary">
            Erreur de chargement
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-md">
            {error || "Une erreur est survenue."}
          </p>
        </div>
      </div>
    );
  }

  const { kpis } = stats;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col w-full gap-6">
        {/* ============ HEADER ============ */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-code-sm text-outline uppercase tracking-wider">
              Espace d&apos;administration
            </span>
            <h1 className="text-headline-lg text-primary tracking-tight">
              Bonjour, {user?.prenom}
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Voici un aperçu en temps réel de l&apos;activité de la plateforme.
            </p>
          </div>
          <div className="flex items-center gap-2 text-code-sm text-outline">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Données à jour
            </span>
          </div>
        </div>

        {/* ============ KPI CARDS ============ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            icon="users"
            label="Utilisateurs"
            value={kpis.totalUsers}
            accent="primary"
            href="/admin/inscriptions"
          />
          <KpiCard
            icon="building"
            label="Entreprises actives"
            value={kpis.entreprisesActives}
            subtitle={`sur ${kpis.totalEntreprises} au total`}
            accent="secondary"
            href="/admin/inscriptions"
          />
          <KpiCard
            icon="folder"
            label="Demandes"
            value={kpis.totalDemandes}
            subtitle={`${kpis.demandesEnAttente} en attente`}
            accent="tertiary"
            href="/admin/inscriptions"
            highlight={kpis.demandesEnAttente > 0}
          />
          <KpiCard
            icon="chart"
            label="Diagnostics"
            value={kpis.totalDiagnostics}
            accent="primary"
            href="/admin/diagnostics"
          />
        </div>

        {/* ============ KPI SECONDAIRES ============ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiSmall
            icon="mentor"
            label="Mentors actifs"
            value={kpis.mentorsActifs}
            href="/admin/inscriptions"
          />
          <KpiSmall
            icon="description"
            label="Documents à valider"
            value={kpis.documentsAValider}
            href="/admin/documents"
            highlight={kpis.documentsAValider > 0}
          />
          <KpiSmall
            icon="pending_actions"
            label="Demandes en attente"
            value={kpis.demandesEnAttente}
            href="/admin/inscriptions"
            highlight={kpis.demandesEnAttente > 0}
          />
          <KpiSmall
            icon="domain"
            label="Total entreprises"
            value={kpis.totalEntreprises}
            href="/admin/inscriptions"
          />
        </div>

        {/* ============ GRAPHIQUE LIGNE : Évolution des inscriptions ============ */}
        <Card
          title="Évolution des inscriptions"
          subtitle="12 derniers mois"
          icon="trending_up"
        >
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.inscriptionsParMois}
                margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,0.98)",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
                    fontSize: 13,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="utilisateurs"
                  name="Utilisateurs"
                  stroke="#1e40af"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#1e40af" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="entreprises"
                  name="Entreprises"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ============ GRILLE 2 COLONNES ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Donut : Répartition par rôle */}
          <Card
            title="Utilisateurs par rôle"
            subtitle={`${kpis.totalUsers} comptes au total`}
            icon="groups"
          >
            <div className="h-72 w-full">
              {stats.usersParRole.length === 0 ? (
                <EmptyChart message="Aucune donnée" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.usersParRole}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {stats.usersParRole.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.98)",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
                        fontSize: 13,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Barres horizontales : Top 5 villes */}
          <Card
            title="Top villes"
            subtitle="Répartition géographique"
            icon="location_city"
          >
            <div className="h-72 w-full">
              {stats.topVilles.length === 0 ? (
                <EmptyChart message="Aucune donnée" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.topVilles}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="ville"
                      tick={{ fontSize: 12, fill: "#334155" }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.98)",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
                        fontSize: 13,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Entreprises"
                      fill="#0891b2"
                      radius={[0, 8, 8, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* ============ GRILLE 2 COLONNES ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Barres : Diagnostics par niveau */}
          <Card
            title="Diagnostics par niveau"
            subtitle="Répartition des évaluations"
            icon="chart"
          >
            <div className="h-72 w-full">
              {stats.diagnosticsParNiveau.length === 0 ? (
                <EmptyChart message="Aucun diagnostic" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.diagnosticsParNiveau}
                    margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.98)",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
                        fontSize: 13,
                      }}
                    />
                    <Bar dataKey="count" name="Diagnostics" radius={[8, 8, 0, 0]}>
                      {stats.diagnosticsParNiveau.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            NIVEAU_COLORS[entry.niveau] ||
                            CHART_COLORS[i % CHART_COLORS.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Donut : Demandes par type */}
          <Card
            title="Demandes par type"
            subtitle="Toutes demandes confondues"
            icon="folder"
          >
            <div className="h-72 w-full">
              {stats.demandesParType.length === 0 ? (
                <EmptyChart message="Aucune demande" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.demandesParType}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {stats.demandesParType.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.98)",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
                        fontSize: 13,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* ============ GRILLE 2 COLONNES : TABLEAUX ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Dernières inscriptions */}
          <Card
            title="Dernières inscriptions"
            subtitle="5 derniers comptes créés"
            icon="person_add"
            action={
              <Link
                href="/admin/inscriptions"
                className="text-label-sm text-primary font-semibold hover:underline"
              >
                Voir tout
              </Link>
            }
          >
            {stats.dernieresInscriptions.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant py-6 text-center">
                Aucune inscription récente
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-black/5">
                {stats.dernieresInscriptions.map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 py-3">
                    {getImageUrl(u.photoProfil) ? (
                      <img
                        src={getImageUrl(u.photoProfil) || ""}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover shrink-0 ring-1 ring-black/5"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm shrink-0">
                        {u.prenom?.[0]}
                        {u.nom?.[0]}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-label-md text-on-surface font-semibold truncate">
                        {u.prenom} {u.nom}
                      </span>
                      <span className="text-code-sm text-outline truncate">
                        {u.email}
                      </span>
                    </div>
                    <RoleBadge role={u.role} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Demandes en attente */}
          <Card
            title="Demandes en attente"
            subtitle="À traiter en priorité"
            icon="pending_actions"
            action={
              <Link
                href="/admin/inscriptions"
                className="text-label-sm text-primary font-semibold hover:underline"
              >
                Voir tout
              </Link>
            }
          >
            {stats.demandesEnAttente.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant py-6 text-center">
                Aucune demande en attente
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-black/5">
                {stats.demandesEnAttente.map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Icon name="folder" size={18} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-label-md text-on-surface font-semibold truncate">
                        {d.titre || `Demande #${d.id}`}
                      </span>
                      <span className="text-code-sm text-outline truncate">
                        {d.emetteur
                          ? `${d.emetteur.prenom} ${d.emetteur.nom}`
                          : d.type}
                      </span>
                    </div>
                    <span className="text-code-sm text-outline shrink-0">
                      {new Date(d.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   SOUS-COMPOSANTS
   ============================================ */
function KpiCard({
  icon,
  label,
  value,
  subtitle,
  accent,
  href,
  highlight,
}: {
  icon: string;
  label: string;
  value: number;
  subtitle?: string;
  accent: "primary" | "secondary" | "tertiary";
  href?: string;
  highlight?: boolean;
}) {
  const accentClasses = {
    primary: "bg-primary-container/30 text-primary",
    secondary: "bg-secondary-container/40 text-on-secondary-container",
    tertiary: "bg-tertiary-container/30 text-tertiary",
  };

  const content = (
    <div
      className={`
        relative rounded-2xl p-4 sm:p-5
        bg-surface-container-lowest border border-black/5
        shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]
        hover:shadow-[0_8px_24px_-6px_rgba(15,23,42,0.14)]
        hover:-translate-y-0.5 transition-all duration-200
        ${highlight ? "ring-2 ring-amber-400/40" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            {label}
          </span>
          <span className="text-headline-lg text-on-surface font-bold leading-tight">
            {value.toLocaleString("fr-FR")}
          </span>
          {subtitle && (
            <span className="text-code-sm text-outline truncate">
              {subtitle}
            </span>
          )}
        </div>
        <div
          className={`
            w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0
            ${accentClasses[accent]}
          `}
        >
          <Icon name={icon as any} size={22} />
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function KpiSmall({
  icon,
  label,
  value,
  href,
  highlight,
}: {
  icon: string;
  label: string;
  value: number;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div
      className={`
        flex items-center gap-3 p-3 sm:p-4 rounded-xl
        bg-surface-container-lowest border border-black/5
        hover:bg-surface-container-low
        transition-colors duration-200
        ${highlight ? "ring-2 ring-amber-400/30" : ""}
      `}
    >
      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
        <Icon name={icon as any} size={18} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-outline uppercase tracking-wider">
          {label}
        </span>
        <span className="text-title-md text-on-surface font-bold">
          {value.toLocaleString("fr-FR")}
        </span>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function Card({
  title,
  subtitle,
  icon,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-black/5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
            <Icon name={icon as any} size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-title-md text-on-surface font-semibold truncate">
              {title}
            </span>
            {subtitle && (
              <span className="text-code-sm text-outline truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ADMIN: {
      label: "Admin",
      className: "bg-tertiary-container/40 text-tertiary",
    },
    DIRIGEANT: {
      label: "Dirigeant",
      className: "bg-primary-container/30 text-primary",
    },
    MENTOR: {
      label: "Mentor",
      className: "bg-secondary-container/40 text-on-secondary-container",
    },
  };
  const cfg = map[role] || {
    label: role,
    className: "bg-surface-container text-on-surface-variant",
  };
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
        <Icon name="info" size={24} className="text-outline" />
      </div>
      <span className="text-body-sm text-on-surface-variant">{message}</span>
    </div>
  );
}