"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  annuaireApi,
  AnnuaireStats,
  Entreprise,
} from "@/lib/api-services";
import Icon from "@/components/ui/Icon";
import EntrepriseCard from "@/components/entreprises/EntrepriseCard";
import AnnuaireFilters from "@/components/entreprises/AnnuaireFilters";

interface FilterValues {
  q: string;
  secteur: string;
  ville: string;
  taille: string;
  effectifMin: number | "";
  effectifMax: number | "";
  verifie: string;
  sort: string;
}

const DEFAULT_FILTERS: FilterValues = {
  q: "",
  secteur: "",
  ville: "",
  taille: "",
  effectifMin: "",
  effectifMax: "",
  verifie: "",
  sort: "recent",
};

export default function AdminAnnuairePage() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [stats, setStats] = useState<AnnuaireStats | null>(null);
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [secteurs, setSecteurs] = useState<string[]>([]);
  const [villes, setVilles] = useState<string[]>([]);

  const limit = 12;

  useEffect(() => {
    const load = async () => {
      try {
        const s = await annuaireApi.getStats();
        setStats(s);
        setSecteurs(s.parSecteur.map((x) => x.secteur).filter(Boolean));
        setVilles(s.parVille.map((x) => x.ville).filter(Boolean));
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await annuaireApi.get({
          page,
          limit,
          q: filters.q || undefined,
          secteur: filters.secteur || undefined,
          ville: filters.ville || undefined,
          taille: filters.taille || undefined,
          effectifMin:
            filters.effectifMin !== "" ? Number(filters.effectifMin) : undefined,
          effectifMax:
            filters.effectifMax !== "" ? Number(filters.effectifMax) : undefined,
          verifie: filters.verifie || undefined,
          sort: filters.sort,
        });
        setEntreprises(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [page, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleExportCsv = async () => {
    try {
      const blob = await annuaireApi.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `annuaire-cci-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors de l'export");
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col w-full gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-code-sm text-outline uppercase tracking-wider">
              Administration
            </span>
            <h1 className="text-headline-lg text-primary tracking-tight">
              Annuaire des ressortissants
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Consultez et exportez la base des entreprises membres.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors shadow-sm"
            >
              <Icon name="download" size={18} />
              Exporter en CSV
            </button>
            <Link
              href="/annuaire"
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-label-md font-medium hover:bg-surface-container transition-colors"
            >
              <Icon name="eye" size={18} />
              Vue publique
            </Link>
          </div>
        </div>

        {/* Stats rapides */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatPill
              icon="building"
              label="Entreprises"
              value={stats.total}
            />
            <StatPill
              icon="verify"
              label="Vérifiées"
              value={stats.verifiees}
            />
            <StatPill
              icon="category"
              label="Secteurs"
              value={stats.parSecteur.length}
            />
            <StatPill
              icon="location_city"
              label="Villes"
              value={stats.parVille.length}
            />
          </div>
        )}

        {/* Contenu */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-4">
            <AnnuaireFilters
              values={filters}
              onChange={setFilters}
              secteurs={secteurs}
              villes={villes}
              total={total}
            />

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl bg-surface-container-lowest border border-black/5 animate-pulse"
                  />
                ))}
              </div>
            ) : entreprises.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-10 text-center border border-black/5">
                <Icon
                  name="building"
                  size={48}
                  className="text-outline mx-auto mb-3"
                />
                <p className="text-body-md text-on-surface-variant">
                  Aucune entreprise trouvée
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {entreprises.map((ent) => (
                    <EntrepriseCard
                      key={ent.id}
                      entreprise={ent}
                      userRole="ADMIN"
                      isOwnEntreprise={false}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-label-md font-medium transition-colors disabled:opacity-40"
                    >
                      <Icon name="chevron-left" size={16} />
                      Précédent
                    </button>
                    <span className="text-label-md text-on-surface-variant">
                      Page {page} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-label-md font-medium transition-colors disabled:opacity-40"
                    >
                      Suivant
                      <Icon name="chevron-right" size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar stats */}
          <aside className="lg:col-span-1 flex flex-col gap-4">
            {stats && (
              <>
                <StatCard
                  title="Top secteurs"
                  icon="category"
                  items={stats.parSecteur.slice(0, 6)}
                  itemKey="secteur"
                />
                <StatCard
                  title="Top villes"
                  icon="location_city"
                  items={stats.parVille.slice(0, 6)}
                  itemKey="ville"
                />
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-black/5">
      <div className="w-9 h-9 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
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
}

function StatCard({
  title,
  icon,
  items,
  itemKey,
}: {
  title: string;
  icon: string;
  items: any[];
  itemKey: string;
}) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-black/5 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
          <Icon name={icon as any} size={16} />
        </div>
        <span className="text-title-sm text-on-surface font-semibold">
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const pct = (item.count / max) * 100;
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-label-sm">
                <span className="text-on-surface truncate">
                  {item[itemKey]}
                </span>
                <span className="text-on-surface-variant font-semibold shrink-0 ml-2">
                  {item.count}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-container transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}