"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getImageUrl, Entreprise } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

interface EntrepriseCardProps {
  entreprise: Entreprise;
  onMessage?: (entreprise: Entreprise) => void;
  onCollaboration?: (entreprise: Entreprise) => void;
  userRole?: string;
  isOwnEntreprise?: boolean;
}

export default function EntrepriseCard({
  entreprise,
  onMessage,
  onCollaboration,
  userRole,
  isOwnEntreprise = false,
}: EntrepriseCardProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const coverUrl = getImageUrl(entreprise.photoCouverture);
  const logoUrl = getImageUrl(entreprise.logo);
  const initials = (entreprise.sigle || entreprise.raisonSociale || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const canMessage = userRole && !isOwnEntreprise;
  const canCollaborate = userRole === "DIRIGEANT" && !isOwnEntreprise;
  
  // Badge FPD
  const badges = entreprise.dirigeant?.badges || [];
  const hasFpdBadge = badges.length > 0;

  const goToProfil = () => {
    router.push(`/entreprise/${entreprise.id}`);
  };

  const Actions = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-1.5"} ${compact ? "justify-center" : "justify-start"}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); goToProfil(); }}
        className={`flex items-center justify-center gap-1.5 rounded-lg font-semibold bg-surface-container-lowest text-primary hover:bg-surface-container-lowest/80 transition-all duration-200 ${compact ? "px-3 py-2 text-label-sm" : "px-2.5 py-1.5 text-label-sm"}`}
        title="Voir le profil"
      >
        <Icon name="eye" size={compact ? 16 : 14} />
        {compact && <span>Voir</span>}
      </button>

      {canMessage && onMessage && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMessage(entreprise); }}
          className={`flex items-center justify-center gap-1.5 rounded-lg font-semibold bg-primary-container text-on-primary hover:bg-primary transition-all duration-200 ${compact ? "px-3 py-2 text-label-sm" : "px-2.5 py-1.5 text-label-sm"}`}
          title="Envoyer un message"
        >
          <Icon name="chat" size={compact ? 16 : 14} />
          {compact && <span>Message</span>}
        </button>
      )}

      {canCollaborate && onCollaboration && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCollaboration(entreprise); }}
          className={`flex items-center justify-center gap-1.5 rounded-lg font-semibold bg-secondary text-on-secondary hover:bg-secondary/90 transition-all duration-200 ${compact ? "px-3 py-2 text-label-sm" : "px-2.5 py-1.5 text-label-sm"}`}
          title="Proposer une collaboration"
        >
          <Icon name="handshake" size={compact ? 16 : 14} />
          {compact && <span>Collab</span>}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* VERSION DESKTOP */}
      <div
        onClick={goToProfil}
        className="group relative hidden sm:flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-surface-container-lowest border border-black/5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out hover:shadow-[0_16px_48px_-12px_rgba(15,23,42,0.25)] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToProfil(); } }}
      >
        {/* Couverture */}
        <div className="relative w-full h-40 bg-gradient-to-br from-primary-container/30 via-surface-container to-secondary-container/20 overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt={entreprise.raisonSociale} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="domain" size={48} className="text-primary/30" />
            </div>
          )}

          {/* Overlay slide-up */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/95 via-primary/85 to-primary/0 backdrop-blur-[2px] p-4 pt-8 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out flex flex-col gap-2">
            {entreprise.description && (
              <p className="text-body-sm text-on-primary line-clamp-2">{entreprise.description}</p>
            )}
            <Actions />
          </div>

          {/* Note */}
          {entreprise.noteMoyenne > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white transition-opacity duration-200 group-hover:opacity-0">
              <Icon name="star" size={13} className="text-amber-300" />
              <span className="text-code-sm font-bold">{Number(entreprise.noteMoyenne).toFixed(1)}</span>
            </div>
          )}

          {/* Badges top-left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 transition-opacity duration-200 group-hover:opacity-0">
            {entreprise.verifie && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/95 backdrop-blur-md text-white">
                <Icon name="verify" size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Vérifié</span>
              </div>
            )}
            {hasFpdBadge && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 backdrop-blur-md text-white">
                <Icon name="workspace_premium" size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">FPD</span>
              </div>
            )}
          </div>
        </div>

        {/* Corps */}
        <div className="relative flex flex-col gap-1 p-4 pt-6">
          <div className="absolute -top-6 left-4 w-12 h-12 rounded-xl bg-surface-container-lowest border-2 border-surface-container-lowest shadow-md overflow-hidden flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt={entreprise.raisonSociale} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-md">{initials}</div>
            )}
          </div>

          <div className="self-end flex items-center gap-1">
            {entreprise.mentorId && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container text-[10px] font-semibold uppercase tracking-wider">
                <Icon name="mentor" size={11} /> Mentor
              </div>
            )}
          </div>

          <h3 className="text-title-md text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
            {entreprise.raisonSociale}
          </h3>

          <div className="flex items-center gap-2 text-code-sm text-on-surface-variant">
            {entreprise.secteur && <span className="truncate">{entreprise.secteur}</span>}
            {entreprise.secteur && entreprise.ville && <span className="text-outline">•</span>}
            {entreprise.ville && (
              <span className="flex items-center gap-0.5 truncate">
                <Icon name="location" size={11} className="text-outline" />
                {entreprise.ville}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* VERSION MOBILE */}
      <div
        onClick={() => setMobileOpen(true)}
        className="sm:hidden flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-surface-container-lowest border border-black/5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] active:scale-[0.98] transition-all duration-200"
      >
        <div className="relative w-full h-32 bg-gradient-to-br from-primary-container/30 to-secondary-container/20 overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt={entreprise.raisonSociale} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="domain" size={36} className="text-primary/30" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            {entreprise.verifie && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white"><Icon name="verify" size={11} /></div>
            )}
            {hasFpdBadge && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-white"><Icon name="workspace_premium" size={11} /></div>
            )}
          </div>
          {entreprise.noteMoyenne > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-md text-white">
              <Icon name="star" size={11} className="text-amber-300" />
              <span className="text-[10px] font-bold">{Number(entreprise.noteMoyenne).toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="relative flex flex-col gap-0.5 p-3 pt-5">
          <div className="absolute -top-5 left-3 w-10 h-10 rounded-lg bg-surface-container-lowest border-2 border-surface-container-lowest shadow overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={entreprise.raisonSociale} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">{initials}</div>
            )}
          </div>
          <h3 className="text-label-md text-on-surface font-semibold truncate">{entreprise.raisonSociale}</h3>
          <div className="flex items-center gap-1.5 text-code-sm text-on-surface-variant">
            {entreprise.secteur && <span className="truncate">{entreprise.secteur}</span>}
            {entreprise.ville && (<><span className="text-outline">•</span><span className="truncate">{entreprise.ville}</span></>)}
          </div>
        </div>
      </div>

      {/* MODAL MOBILE */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <div onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-primary/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />
          <div className="relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="relative w-full h-40 bg-gradient-to-br from-primary-container/30 to-secondary-container/20 overflow-hidden">
              {coverUrl ? <img src={coverUrl} alt={entreprise.raisonSociale} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon name="domain" size={48} className="text-primary/30" /></div>}
              <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center" aria-label="Fermer">
                <Icon name="close" size={18} />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                {entreprise.verifie && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider">
                    <Icon name="verify" size={11} /> Vérifié
                  </span>
                )}
                {hasFpdBadge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    <Icon name="workspace_premium" size={11} /> FPD
                  </span>
                )}
              </div>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-surface-container-low border border-black/5 overflow-hidden flex items-center justify-center shrink-0">
                  {logoUrl ? <img src={logoUrl} alt={entreprise.raisonSociale} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-title-md">{initials}</div>}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-title-lg text-primary font-semibold truncate">{entreprise.raisonSociale}</h3>
                  <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                    {entreprise.secteur && <span>{entreprise.secteur}</span>}
                    {entreprise.ville && (<><span className="text-outline">•</span><span>{entreprise.ville}</span></>)}
                  </div>
                </div>
              </div>
              {entreprise.noteMoyenne > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low">
                  <Icon name="star" size={20} className="text-amber-500" />
                  <span className="text-title-md text-on-surface font-bold">{Number(entreprise.noteMoyenne).toFixed(1)}</span>
                  <span className="text-body-sm text-on-surface-variant">/ 5 ({entreprise.nbAvis} avis)</span>
                </div>
              )}
              {entreprise.description && <p className="text-body-md text-on-surface-variant line-clamp-4">{entreprise.description}</p>}
              <Actions compact />
            </div>
          </div>
        </div>
      )}
    </>
  );
}