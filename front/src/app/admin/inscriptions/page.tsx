"use client";

import { useEffect, useState, useRef } from "react";
import { demandesApi, usersApi, Demande, ChatContact } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

type TabType = "demandes" | "utilisateurs";

export default function AdminInscriptionsPage() {
  const [tab, setTab] = useState<TabType>("demandes");
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [filterStatut, setFilterStatut] = useState<string>("EN_ATTENTE");
  const [isLoading, setIsLoading] = useState(true);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Gestion click outside */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ============================================
     CHARGER DEMANDES & UTILISATEURS
     ============================================ */
  const loadDemandes = async () => {
    setIsLoading(true);
    try {
      const res = await demandesApi.getAll({ page, limit: 20, statut: filterStatut || undefined });
      const inscriptions = res.data.filter((d) => d.type === "INSCRIPTION_DIRIGEANT" || d.type === "INSCRIPTION_MENTOR");
      setDemandes(inscriptions);
      setMeta(res.meta);
    } catch (error) {
      console.error("Erreur demandes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUtilisateurs = async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.getAll();
      const filtered = res.filter((u: any) => u.role !== "ADMIN");
      setUtilisateurs(filtered);
    } catch (error) {
      console.error("Erreur utilisateurs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "demandes") loadDemandes();
    else loadUtilisateurs();
  }, [tab, page, filterStatut]);

  /* ============================================
     ACTIONS
     ============================================ */
  const handleValider = async (id: number) => {
    setOpenMenuId(null);
    if (!confirm("Valider cette inscription ?")) return;
    try {
      await demandesApi.valider(id);
      loadDemandes();
      alert("✅ Inscription validée ! L'utilisateur peut maintenant créer son mot de passe.");
    } catch (error: any) {
      alert("Erreur : " + (error.response?.data?.message || error.message));
    }
  };

  const handleRefuser = async (id: number) => {
    setOpenMenuId(null);
    const motif = prompt("Motif du refus :");
    if (!motif) return;
    try {
      await demandesApi.refuser(id, motif);
      loadDemandes();
    } catch (error) {
      console.error("Erreur refus:", error);
    }
  };

  const handleRdv = async (id: number) => {
    setOpenMenuId(null);
    if (!confirm("Demander un RDV ?")) return;
    try {
      await demandesApi.demanderRdv(id);
      loadDemandes();
    } catch (error) {
      console.error("Erreur RDV:", error);
    }
  };

  const handleBan = async (id: number, nom: string) => {
    setOpenMenuId(null);
    const motif = prompt(`Motif du bannissement de ${nom} ?\n\nExemples : cota impayé, non-respect des règles, fraude…`);
    if (!motif) return;
    if (!confirm(`⚠️ Confirmer le bannissement de ${nom} ?\n\nIl ne pourra plus se connecter.`)) return;
    try {
      await usersApi.ban(id, motif);
      loadUtilisateurs();
      alert("✅ Utilisateur banni avec succès.");
    } catch (error: any) {
      alert("Erreur : " + (error.response?.data?.message || error.message));
    }
  };

  const handleUnban = async (id: number, nom: string) => {
    setOpenMenuId(null);
    if (!confirm(`Réactiver le compte de ${nom} ?`)) return;
    try {
      await usersApi.unban(id);
      loadUtilisateurs();
      alert("✅ Utilisateur réactivé.");
    } catch (error: any) {
      alert("Erreur : " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id: number, nom: string) => {
    setOpenMenuId(null);
    if (!confirm(`🗑️ ATTENTION : Suppression DÉFINITIVE du compte de ${nom}.\n\nToutes ses données seront perdues.\n\nCette action est IRRÉVERSIBLE.\n\nContinuer ?`)) return;
    const confirmation = prompt(`Tapez "SUPPRIMER" pour confirmer la suppression définitive de ${nom} :`);
    if (confirmation !== "SUPPRIMER") {
      alert("Suppression annulée.");
      return;
    }
    try {
      await usersApi.deleteUser(id);
      loadUtilisateurs();
      alert("✅ Utilisateur supprimé définitivement.");
    } catch (error: any) {
      alert("Erreur : " + (error.response?.data?.message || error.message));
    }
  };

  /* ============================================
     HELPERS
     ============================================ */
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE": return "bg-amber-50 text-amber-700 border-amber-200";
      case "VALIDEE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REFUSEE": return "bg-red-50 text-red-700 border-red-200";
      case "RDV_DEMANDE": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-surface-container text-on-surface-variant border-black/5";
    }
  };

  const getStatutLabel = (statut: string) => {
    const map: Record<string, string> = { EN_ATTENTE: "En attente", VALIDEE: "Validée", REFUSEE: "Refusée", RDV_DEMANDE: "RDV demandé", ACCEPTEE: "Acceptée", TERMINEE: "Terminée", ANNULEE: "Annulée" };
    return map[statut] || statut;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { INSCRIPTION_DIRIGEANT: "Dirigeant PME", INSCRIPTION_MENTOR: "Mentor", MENTORAT: "Mentorat", COLLABORATION: "Collaboration", RDV: "RDV" };
    return map[type] || type;
  };

  const isBanned = (u: any) => u.bioCourte && u.bioCourte.startsWith("[BANNI]");

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col w-full gap-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-code-sm uppercase tracking-wider text-primary font-semibold bg-primary-container/10 px-2 py-0.5 rounded-md">Régistre Consulaire Officiel</span>
              <span className="text-outline text-body-sm">•</span>
              <span className="text-label-sm text-on-surface-variant">Exercice 2026</span>
            </div>
            <h1 className="text-3xl sm:text-headline-lg text-primary font-bold tracking-tight">Demandes & Utilisateurs</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Validez les demandes d'inscription, gérez les comptes et bannissez les utilisateurs.</p>
          </div>
          <button
            onClick={() => { if (tab === "demandes") loadDemandes(); else loadUtilisateurs(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-black/5 shadow-sm text-label-md font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <Icon name="refresh" size={18} className="text-outline" />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-surface-container-lowest border border-black/5 rounded-[1rem] shadow-sm w-full md:w-fit">
          <button
            onClick={() => { setTab("demandes"); setPage(1); }}
            className={`flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-label-md transition-all duration-200 ${tab === "demandes" ? "bg-primary text-on-primary font-bold shadow-md" : "text-on-surface-variant font-medium hover:bg-surface-container-low"}`}
          >
            <Icon name="folder" size={18} />
            <span>Demandes d'inscription</span>
          </button>
          <button
            onClick={() => { setTab("utilisateurs"); setPage(1); }}
            className={`flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-label-md transition-all duration-200 ${tab === "utilisateurs" ? "bg-primary text-on-primary font-bold shadow-md" : "text-on-surface-variant font-medium hover:bg-surface-container-low"}`}
          >
            <Icon name="users" size={18} />
            <span>Utilisateurs actifs</span>
          </button>
        </div>

        {/* TAB DEMANDES */}
        {tab === "demandes" && (
          <div className="bg-surface-container-lowest border border-black/5 rounded-[1.5rem] shadow-sm overflow-visible flex flex-col">
            <div className="p-4 sm:p-5 border-b border-black/5 flex flex-wrap items-center gap-3 bg-surface-container-lowest rounded-t-[1.5rem]">
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl">
                <span className="text-label-sm font-semibold text-outline uppercase tracking-wider">Statut :</span>
                <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }} className="bg-transparent text-label-md text-on-surface font-bold focus:outline-none cursor-pointer">
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="VALIDEE">Validée</option>
                  <option value="REFUSEE">Refusée</option>
                  <option value="RDV_DEMANDE">RDV demandé</option>
                  <option value="">Tous les statuts</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center flex flex-col items-center">
                <Icon name="refresh" size={40} className="text-primary animate-spin mb-3" />
                <p className="text-body-sm text-on-surface-variant">Chargement des demandes...</p>
              </div>
            ) : demandes.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                  <Icon name="folder_open" size={32} className="text-outline" />
                </div>
                <h3 className="text-title-lg font-bold text-primary mb-1">Aucune demande trouvée</h3>
                <p className="text-body-md text-on-surface-variant">Il n'y a aucune demande correspondant à ce statut pour le moment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-lowest border-b border-black/5 text-label-sm text-outline uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-5 font-semibold">Réf.</th>
                      <th className="py-4 px-5 font-semibold">Type</th>
                      <th className="py-4 px-5 font-semibold">Émetteur</th>
                      <th className="py-4 px-5 font-semibold">Objet</th>
                      <th className="py-4 px-5 font-semibold">Date</th>
                      <th className="py-4 px-5 font-semibold">Statut</th>
                      <th className="py-4 px-5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 text-body-sm">
                    {demandes.map((d) => (
                      <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-5"><span className="text-code-sm text-primary font-bold">REQ-{String(d.id).padStart(4, "0")}</span></td>
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${d.type === "INSCRIPTION_MENTOR" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                            {getTypeLabel(d.type)}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-col">
                            <span className="text-title-sm font-bold text-on-surface">{d.emetteur ? `${d.emetteur.prenom} ${d.emetteur.nom}` : "—"}</span>
                            {d.entreprise && <span className="text-code-sm text-on-surface-variant">{d.entreprise.raisonSociale}</span>}
                          </div>
                        </td>
                        <td className="py-4 px-5 max-w-[200px]"><span className="text-body-sm text-on-surface-variant line-clamp-2">{d.titre || d.description || "—"}</span></td>
                        <td className="py-4 px-5"><span className="text-code-sm text-on-surface font-medium">{new Date(d.createdAt).toLocaleDateString("fr-FR")}</span></td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatutColor(d.statut)}`}>
                            {getStatutLabel(d.statut)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          {/* MENU 3 POINTS */}
                          <div className="relative inline-block text-left" ref={openMenuId === d.id ? menuRef : null}>
                            {d.statut === "EN_ATTENTE" ? (
                              <button
                                onClick={() => setOpenMenuId(openMenuId === d.id ? null : d.id)}
                                className="p-1.5 rounded-lg text-outline hover:bg-surface-container-high transition-colors"
                              >
                                <Icon name="more_vert" size={20} />
                              </button>
                            ) : (
                              <span className="text-label-sm font-medium text-outline italic px-2">Traitée</span>
                            )}

                            {openMenuId === d.id && (
                              <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-surface-container-lowest border border-black/5 shadow-xl py-1 z-50">
                                <button onClick={() => handleValider(d.id)} className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-emerald-700 hover:bg-emerald-50 text-left transition-colors">
                                  <Icon name="check" size={16} /> Valider
                                </button>
                                <button onClick={() => handleRdv(d.id)} className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-blue-700 hover:bg-blue-50 text-left transition-colors">
                                  <Icon name="calendar" size={16} /> Demander RDV
                                </button>
                                <div className="h-px bg-black/5 my-1" />
                                <button onClick={() => handleRefuser(d.id)} className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-red-700 hover:bg-red-50 text-left transition-colors">
                                  <Icon name="block" size={16} /> Refuser
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
        )}

        {/* TAB UTILISATEURS */}
        {tab === "utilisateurs" && (
          <div className="bg-surface-container-lowest border border-black/5 rounded-[1.5rem] shadow-sm overflow-visible flex flex-col">
            {isLoading ? (
              <div className="p-12 text-center flex flex-col items-center">
                <Icon name="refresh" size={40} className="text-primary animate-spin mb-3" />
                <p className="text-body-sm text-on-surface-variant">Chargement des utilisateurs...</p>
              </div>
            ) : utilisateurs.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                  <Icon name="users" size={32} className="text-outline" />
                </div>
                <h3 className="text-title-lg font-bold text-primary mb-1">Aucun utilisateur</h3>
                <p className="text-body-md text-on-surface-variant">Aucun compte dirigeant ou mentor n'est enregistré pour le moment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-lowest border-b border-black/5 text-label-sm text-outline uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-5 font-semibold">Utilisateur</th>
                      <th className="py-4 px-5 font-semibold">Rôle</th>
                      <th className="py-4 px-5 font-semibold">Email</th>
                      <th className="py-4 px-5 font-semibold">Statut</th>
                      <th className="py-4 px-5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 text-body-sm">
                    {utilisateurs.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            {u.photoProfil ? (
                              <img src={u.photoProfil} alt="" className="w-10 h-10 rounded-xl object-cover ring-1 ring-black/5" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center font-bold">
                                {u.prenom?.[0]}{u.nom?.[0]}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-title-sm font-bold text-on-surface">{u.prenom} {u.nom}</span>
                              <span className="text-code-sm text-outline">ID: {u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${u.role === "MENTOR" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                            {u.role === "MENTOR" ? "Mentor" : u.role === "DIRIGEANT" ? "Dirigeant" : u.role}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-body-sm text-on-surface-variant font-medium">{u.email}</td>
                        <td className="py-4 px-5">
                          {isBanned(u) ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold uppercase tracking-wider">
                              <Icon name="block" size={12} /> Banni
                            </span>
                          ) : u.actif ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                              <Icon name="check_circle" size={12} /> Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-bold uppercase tracking-wider">
                              Inactif
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          {/* MENU 3 POINTS */}
                          <div className="relative inline-block text-left" ref={openMenuId === u.id ? menuRef : null}>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                              className="p-1.5 rounded-lg text-outline hover:bg-surface-container-high transition-colors"
                            >
                              <Icon name="more_vert" size={20} />
                            </button>

                            {openMenuId === u.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-surface-container-lowest border border-black/5 shadow-xl py-1 z-50">
                                {isBanned(u) ? (
                                  <button onClick={() => handleUnban(u.id, `${u.prenom} ${u.nom}`)} className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-emerald-700 hover:bg-emerald-50 text-left transition-colors">
                                    <Icon name="check_circle" size={16} /> Réactiver
                                  </button>
                                ) : (
                                  <button onClick={() => handleBan(u.id, `${u.prenom} ${u.nom}`)} className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-amber-700 hover:bg-amber-50 text-left transition-colors">
                                    <Icon name="block" size={16} /> Bannir
                                  </button>
                                )}
                                <div className="h-px bg-black/5 my-1" />
                                <button onClick={() => handleDelete(u.id, `${u.prenom} ${u.nom}`)} className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-red-700 hover:bg-red-50 text-left transition-colors">
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
        )}

      </div>
    </div>
  );
}