"use client";

import { useEffect, useState, useRef } from "react";
import { diagnosticsApi, Diagnostic, RepartitionDiagnostics } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

export default function DiagnosticsAdminPage() {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [repartition, setRepartition] = useState<RepartitionDiagnostics | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [filterNiveau, setFilterNiveau] = useState<string>("");
  const [filterStatut, setFilterStatut] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [diags, repart, st] = await Promise.allSettled([
        diagnosticsApi.getAll({ page, limit: 20, niveau: filterNiveau || undefined, statut: filterStatut || undefined }),
        diagnosticsApi.getRepartition(),
        diagnosticsApi.getStats(),
      ]);

      if (diags.status === "fulfilled") {
        setDiagnostics(diags.value.data);
        setMeta(diags.value.meta);
      }
      if (repart.status === "fulfilled") setRepartition(repart.value);
      if (st.status === "fulfilled") setStats(st.value);
    } catch (error) {
      console.error("Erreur diagnostics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filterNiveau, filterStatut]);

  const handleValider = async (id: number) => {
    setOpenMenuId(null);
    if (!confirm("Valider ce diagnostic ?")) return;
    try {
      await diagnosticsApi.valider(id);
      loadData();
    } catch (error) {
      console.error("Erreur validation:", error);
    }
  };

  const getNiveauColor = (niveau?: string) => {
    switch (niveau) {
      case "DEBUTANT": return "bg-red-50 text-red-700 border-red-200";
      case "INTERMEDIAIRE": return "bg-blue-50 text-blue-700 border-blue-200";
      case "AVANCE": return "bg-purple-50 text-purple-700 border-purple-200";
      case "EXCELLENCE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-surface-container text-on-surface-variant border-black/5";
    }
  };

  const getNiveauLabel = (niveau?: string) => {
    const map: Record<string, string> = { DEBUTANT: "Débutant", INTERMEDIAIRE: "Intermédiaire", AVANCE: "Avancé", EXCELLENCE: "Excellence" };
    return map[niveau || ""] || "—";
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "EN_COURS": return "bg-amber-50 text-amber-700 border-amber-200";
      case "TERMINE": return "bg-blue-50 text-blue-700 border-blue-200";
      case "VALIDE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-surface-container text-on-surface-variant border-black/5";
    }
  };

  const getStatutLabel = (statut: string) => {
    const map: Record<string, string> = { EN_COURS: "En cours", TERMINE: "Terminé", VALIDE: "Validé" };
    return map[statut] || statut;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col w-full gap-6">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-code-sm uppercase tracking-wider text-primary font-semibold bg-primary-container/10 px-2 py-0.5 rounded-md">Évaluations 360°</span>
              <span className="text-outline text-body-sm">•</span>
              <span className="text-label-sm text-on-surface-variant">Exercice 2026</span>
            </div>
            <h1 className="text-3xl sm:text-headline-lg text-primary font-bold tracking-tight">Diagnostics de maturité</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Supervisez et validez les évaluations des PME pour l'obtention du statut CCI.</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-black/5 shadow-sm text-label-md font-semibold text-on-surface hover:bg-surface-container-low transition-colors">
            <Icon name="refresh" size={18} className="text-outline" />
            <span>Actualiser</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-surface-container-lowest border border-black/5 p-5 rounded-[1.5rem] shadow-sm flex flex-col gap-1">
            <span className="text-label-sm text-outline uppercase tracking-wider font-semibold">Diagnostics réalisés</span>
            <span className="text-headline-lg text-on-surface font-bold">{isLoading ? "..." : stats?.total || 0}</span>
          </div>
          <div className="bg-surface-container-lowest border border-black/5 p-5 rounded-[1.5rem] shadow-sm flex flex-col gap-1">
            <span className="text-label-sm text-outline uppercase tracking-wider font-semibold">Score moyen</span>
            <span className="text-headline-lg text-blue-600 font-bold">{isLoading ? "..." : Number(stats?.scoreMoyen || 0).toFixed(1)}</span>
          </div>
          <div className="bg-surface-container-lowest border border-black/5 p-5 rounded-[1.5rem] shadow-sm flex flex-col gap-1">
            <span className="text-label-sm text-outline uppercase tracking-wider font-semibold">En cours</span>
            <span className="text-headline-lg text-amber-600 font-bold">{isLoading ? "..." : stats?.enCours || 0}</span>
          </div>
          <div className="bg-surface-container-lowest border border-black/5 p-5 rounded-[1.5rem] shadow-sm flex flex-col gap-1">
            <span className="text-label-sm text-outline uppercase tracking-wider font-semibold">Validés</span>
            <span className="text-headline-lg text-emerald-600 font-bold">{isLoading ? "..." : stats?.valides || 0}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-black/5 rounded-[1.5rem] shadow-sm overflow-visible flex flex-col">
          <div className="p-4 sm:p-5 border-b border-black/5 flex flex-wrap items-center gap-3 bg-surface-container-lowest rounded-t-[1.5rem]">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl">
              <span className="text-label-sm font-semibold text-outline uppercase tracking-wider">Niveau :</span>
              <select value={filterNiveau} onChange={(e) => { setFilterNiveau(e.target.value); setPage(1); }} className="bg-transparent text-label-md text-on-surface font-bold focus:outline-none cursor-pointer">
                <option value="">Tous</option>
                <option value="DEBUTANT">Débutant</option>
                <option value="INTERMEDIAIRE">Intermédiaire</option>
                <option value="AVANCE">Avancé</option>
                <option value="EXCELLENCE">Excellence</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl">
              <span className="text-label-sm font-semibold text-outline uppercase tracking-wider">Statut :</span>
              <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }} className="bg-transparent text-label-md text-on-surface font-bold focus:outline-none cursor-pointer">
                <option value="">Tous</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
                <option value="VALIDE">Validé</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Icon name="refresh" size={40} className="text-primary animate-spin mb-3" />
              <p className="text-body-sm text-on-surface-variant">Chargement des diagnostics...</p>
            </div>
          ) : diagnostics.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <Icon name="chart" size={32} className="text-outline" />
              </div>
              <h3 className="text-title-lg font-bold text-primary mb-1">Aucun diagnostic</h3>
              <p className="text-body-md text-on-surface-variant">Aucun diagnostic n'a été enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left">
                <thead className="bg-surface-container-lowest border-b border-black/5 text-label-sm text-outline uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-5 font-semibold">Entreprise</th>
                    <th className="py-4 px-5 font-semibold">Référence</th>
                    <th className="py-4 px-5 font-semibold w-48">Score global</th>
                    <th className="py-4 px-5 font-semibold">Niveau</th>
                    <th className="py-4 px-5 font-semibold">Statut</th>
                    <th className="py-4 px-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-body-sm">
                  {diagnostics.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-title-sm font-bold text-on-surface">{d.entreprise?.raisonSociale || "—"}</span>
                          <span className="text-code-sm text-outline font-medium">{d.entreprise?.nif || "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5"><span className="text-code-sm text-primary font-bold">{d.reference}</span></td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-1.5 w-full">
                          <span className="font-bold text-on-surface text-title-sm">{d.scoreGlobal}/100</span>
                          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div className={`${getScoreColor(d.scoreGlobal)} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.min(d.scoreGlobal, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getNiveauColor(d.niveau)}`}>{getNiveauLabel(d.niveau)}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatutColor(d.statut)}`}>{getStatutLabel(d.statut)}</span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        {/* MENU 3 POINTS */}
                        <div className="relative inline-block text-left" ref={openMenuId === d.id ? menuRef : null}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === d.id ? null : d.id)}
                            className="p-1.5 rounded-lg text-outline hover:bg-surface-container-high transition-colors"
                          >
                            <Icon name="more_vert" size={20} />
                          </button>

                          {openMenuId === d.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-surface-container-lowest border border-black/5 shadow-xl py-1 z-50">
                              {d.statut === "TERMINE" && (
                                <button onClick={() => handleValider(d.id)} className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-blue-700 hover:bg-blue-50 text-left transition-colors">
                                  <Icon name="check" size={16} /> Valider
                                </button>
                              )}
                              {d.statut === "VALIDE" && (
                                <div className="px-3 py-2 text-label-sm font-medium text-emerald-600 flex items-center gap-2">
                                  <Icon name="check_circle" size={16} /> Validé
                                </div>
                              )}
                              {d.statut === "EN_COURS" && (
                                <div className="px-3 py-2 text-label-sm font-medium text-amber-600 flex items-center gap-2">
                                  <Icon name="schedule" size={16} /> En cours
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}