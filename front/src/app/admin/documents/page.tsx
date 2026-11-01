"use client";

import { useEffect, useState, useRef } from "react";
import { documentsApi, getImageUrl } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [filterValide, setFilterValide] = useState<string>("false");
  const [filterCategorie, setFilterCategorie] = useState<string>("");
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

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentsApi.getAll({
        page,
        limit: 20,
        valide: filterValide || undefined,
        categorie: filterCategorie || undefined,
      });
      setDocuments(res.data);
      setMeta(res.meta);
    } catch (error) {
      console.error("Erreur documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [page, filterValide, filterCategorie]);

  const handleValider = async (id: number) => {
    setOpenMenuId(null);
    if (!confirm("Valider ce document ?")) return;
    try {
      await documentsApi.valider(id);
      loadDocuments();
      alert("✅ Document validé avec succès.");
    } catch (error: any) {
      alert("Erreur : " + (error.response?.data?.message || error.message));
    }
  };

  const handleRejeter = async (id: number) => {
    setOpenMenuId(null);
    const motif = prompt("Motif du rejet du document :\n\nEx: Document illisible, expiré, non conforme…");
    if (!motif) return;
    try {
      await documentsApi.rejeter(id, motif);
      loadDocuments();
      alert("✅ Document rejeté.");
    } catch (error: any) {
      alert("Erreur : " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id: number, nom: string) => {
    setOpenMenuId(null);
    if (!confirm(`🗑️ Suppression DÉFINITIVE du document "${nom}".\n\nCette action est irréversible.\n\nContinuer ?`)) return;
    try {
      await documentsApi.remove(id);
      loadDocuments();
      alert("✅ Document supprimé définitivement.");
    } catch (error: any) {
      alert("Erreur : " + (error.response?.data?.message || error.message));
    }
  };

  const getCategorieColor = (categorie?: string) => {
    switch (categorie) {
      case "NIF": return "bg-blue-50 text-blue-700 border-blue-200";
      case "STAT": return "bg-purple-50 text-purple-700 border-purple-200";
      case "RCS": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "CNaPS": return "bg-teal-50 text-teal-700 border-teal-200";
      case "CV_MENTOR":
      case "DIPLOME": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "RECU_COTA": return "bg-amber-50 text-amber-700 border-amber-200";
      case "RAPPORT_DIAGNOSTIC": return "bg-pink-50 text-pink-700 border-pink-200";
      default: return "bg-surface-container text-on-surface-variant border-black/5";
    }
  };

  const getCategorieLabel = (categorie?: string) => {
    const map: Record<string, string> = { NIF: "NIF", STAT: "STAT", RCS: "RCS", CNAPS: "CNaPS", CNaPS: "CNaPS", CV_MENTOR: "CV Mentor", DIPLOME: "Diplôme", RECU_COTA: "Reçu Cota", RAPPORT_DIAGNOSTIC: "Rapport Diag.", BILAN: "Bilan", BROCHURE: "Brochure", PHOTO_ENTREPRISE: "Photo Entreprise", PHOTO_PRODUIT: "Photo Produit", LOGO: "Logo", AUTRE: "Autre" };
    return map[categorie || ""] || categorie || "—";
  };

  const getFileIcon = (typeMime?: string) => {
    if (typeMime?.includes("pdf")) return "description";
    if (typeMime?.includes("image")) return "image";
    return "description";
  };

  const getFileColor = (typeMime?: string) => {
    if (typeMime?.includes("pdf")) return "text-red-500 bg-red-50";
    if (typeMime?.includes("image")) return "text-blue-500 bg-blue-50";
    return "text-outline bg-surface-container";
  };

  const stats = {
    total: meta?.total || 0,
    enAttente: documents.filter((d) => !d.valide).length,
    valides: documents.filter((d) => d.valide).length,
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col w-full gap-6">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-code-sm uppercase tracking-wider text-primary font-semibold bg-primary-container/10 px-2 py-0.5 rounded-md">Gestion Documentaire</span>
              <span className="text-outline text-body-sm">•</span>
              <span className="text-label-sm text-on-surface-variant">Exercice 2026</span>
            </div>
            <h1 className="text-3xl sm:text-headline-lg text-primary font-bold tracking-tight">Validation des documents</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Vérifiez, validez ou rejetez les pièces justificatives des PME et des mentors.</p>
          </div>
          <button onClick={loadDocuments} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-black/5 shadow-sm text-label-md font-semibold text-on-surface hover:bg-surface-container-low transition-colors">
            <Icon name="refresh" size={18} className="text-outline" />
            <span>Actualiser</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-surface-container-lowest border border-black/5 p-5 rounded-[1.5rem] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-label-sm text-outline uppercase tracking-wider font-semibold">Total documents</p>
              <p className="text-headline-lg text-on-surface font-bold mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Icon name="folder" size={24} /></div>
          </div>
          <div className="bg-surface-container-lowest border border-black/5 p-5 rounded-[1.5rem] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-label-sm text-outline uppercase tracking-wider font-semibold">En attente</p>
              <p className="text-headline-lg text-amber-600 font-bold mt-1">{stats.enAttente}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Icon name="schedule" size={24} /></div>
          </div>
          <div className="bg-surface-container-lowest border border-black/5 p-5 rounded-[1.5rem] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-label-sm text-outline uppercase tracking-wider font-semibold">Validés</p>
              <p className="text-headline-lg text-emerald-600 font-bold mt-1">{stats.valides}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Icon name="check" size={24} /></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-black/5 rounded-[1.5rem] shadow-sm overflow-visible flex flex-col">
          <div className="p-4 sm:p-5 border-b border-black/5 flex flex-wrap items-center gap-3 bg-surface-container-lowest rounded-t-[1.5rem]">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl">
              <span className="text-label-sm font-semibold text-outline uppercase tracking-wider">Statut :</span>
              <select value={filterValide} onChange={(e) => { setFilterValide(e.target.value); setPage(1); }} className="bg-transparent text-label-md text-on-surface font-bold focus:outline-none cursor-pointer">
                <option value="">Tous</option>
                <option value="false">En attente</option>
                <option value="true">Validés</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl">
              <span className="text-label-sm font-semibold text-outline uppercase tracking-wider">Catégorie :</span>
              <select value={filterCategorie} onChange={(e) => { setFilterCategorie(e.target.value); setPage(1); }} className="bg-transparent text-label-md text-on-surface font-bold focus:outline-none cursor-pointer">
                <option value="">Toutes</option>
                <option value="NIF">NIF</option>
                <option value="STAT">STAT</option>
                <option value="RCS">RCS</option>
                <option value="CNaPS">CNaPS</option>
                <option value="CV_MENTOR">CV Mentor</option>
                <option value="DIPLOME">Diplôme</option>
                <option value="RECU_COTA">Reçu Cota</option>
                <option value="RAPPORT_DIAGNOSTIC">Rapport Diag.</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Icon name="refresh" size={40} className="text-primary animate-spin mb-3" />
              <p className="text-body-sm text-on-surface-variant">Chargement des documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <Icon name="folder_open" size={32} className="text-outline" />
              </div>
              <h3 className="text-title-lg font-bold text-primary mb-1">Aucun document {filterValide === "false" ? "en attente" : ""}</h3>
              <p className="text-body-md text-on-surface-variant">Les documents téléversés par les PME et les mentors apparaîtront ici pour validation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left">
                <thead className="bg-surface-container-lowest border-b border-black/5 text-label-sm text-outline uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-5 font-semibold">Document</th>
                    <th className="py-4 px-5 font-semibold">Catégorie</th>
                    <th className="py-4 px-5 font-semibold">Taille</th>
                    <th className="py-4 px-5 font-semibold">Date</th>
                    <th className="py-4 px-5 font-semibold">Statut</th>
                    <th className="py-4 px-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-body-sm">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getFileColor(doc.typeMime)}`}>
                            <Icon name={getFileIcon(doc.typeMime)} size={20} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-title-sm font-bold text-on-surface truncate max-w-[200px]">{doc.nom}</span>
                            <span className="text-code-sm text-outline truncate">{doc.typeMime || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getCategorieColor(doc.categorie)}`}>
                          {getCategorieLabel(doc.categorie)}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-code-sm text-on-surface-variant font-medium">{doc.taille ? `${(doc.taille / 1024).toFixed(0)} Ko` : "—"}</td>
                      <td className="py-4 px-5 text-code-sm text-on-surface-variant font-medium">{new Date(doc.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-4 px-5">
                        {doc.valide ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                            <Icon name="check" size={12} /> Validé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold uppercase tracking-wider">
                            <Icon name="schedule" size={12} /> En attente
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {/* MENU 3 POINTS */}
                        <div className="relative inline-block text-left" ref={openMenuId === doc.id ? menuRef : null}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                            className="p-1.5 rounded-lg text-outline hover:bg-surface-container-high transition-colors"
                          >
                            <Icon name="more_vert" size={20} />
                          </button>

                          {openMenuId === doc.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-surface-container-lowest border border-black/5 shadow-xl py-1 z-50">
                              <a href={getImageUrl(doc.chemin) || "#"} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-on-surface hover:bg-surface-container text-left transition-colors">
                                <Icon name="eye" size={16} /> Voir le document
                              </a>
                              
                              {!doc.valide && (
                                <button onClick={() => handleValider(doc.id)} className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-emerald-700 hover:bg-emerald-50 text-left transition-colors">
                                  <Icon name="check" size={16} /> Valider
                                </button>
                              )}
                              
                              {!doc.valide && (
                                <button onClick={() => handleRejeter(doc.id)} className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-amber-700 hover:bg-amber-50 text-left transition-colors">
                                  <Icon name="block" size={16} /> Rejeter
                                </button>
                              )}
                              
                              <div className="h-px bg-black/5 my-1" />
                              <button onClick={() => handleDelete(doc.id, doc.nom)} className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-red-700 hover:bg-red-50 text-left transition-colors">
                                <Icon name="trash" size={16} /> Supprimer
                              </button>
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