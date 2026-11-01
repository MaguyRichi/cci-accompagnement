"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  entreprisesApi,
  publicationsApi,
  getImageUrl,
  Entreprise,
  Publication,
} from "@/lib/api-services";
import { useAuth } from "@/hooks/useAuth";
import Icon from "@/components/ui/Icon";
import MessageModal from "@/components/entreprises/MessageModal";

export default function EntrepriseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = Number(params.id);

  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showMessageModal, setShowMessageModal] = useState(false);

  const [showModalAvis, setShowModalAvis] = useState(false);
  const [avisNote, setAvisNote] = useState(5);
  const [avisCommentaire, setAvisCommentaire] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const [ent, pubs] = await Promise.allSettled([
          entreprisesApi.getById(id),
          publicationsApi.getMurEntreprise(id, { limit: 6 }),
        ]);
        if (ent.status === "fulfilled") setEntreprise(ent.value);
        if (pubs.status === "fulfilled") setPublications(pubs.value.data);
      } catch (err) {
        setError("Entreprise introuvable");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSubmitAvis = async () => {
    if (!entreprise || !avisCommentaire.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await entreprisesApi.ajouterAvis(entreprise.id, {
        note: avisNote,
        commentaire: avisCommentaire,
      });
      setEntreprise(updated);
      setShowModalAvis(false);
      setAvisNote(5);
      setAvisCommentaire("");
    } catch (err: any) {
      setError("Erreur lors de l'ajout de l'avis");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (text: string) =>
    text.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const renderStars = (note: number, size = 18) => {
    const fullStars = Math.floor(note);
    const hasHalf = note - fullStars >= 0.5;
    return (
      <div className="flex items-center gap-0.5" aria-label={`Note ${note}/5`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= fullStars;
          const half = i === fullStars + 1 && hasHalf;
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Icon name="star" size={size} className="absolute inset-0 text-outline-variant/40" />
              {(filled || half) && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: half ? size / 2 : size }}>
                  <Icon name="star" size={size} className="text-amber-500" />
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Icon name="refresh" size={40} className="text-primary animate-spin" />
          <p className="text-body-md text-on-surface-variant">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!entreprise) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center">
          <Icon name="domain" size={40} className="text-primary" />
        </div>
        <h1 className="text-headline-md text-primary">Entreprise introuvable</h1>
        <p className="text-body-md text-on-surface-variant max-w-md text-center">{error || "Cette entreprise n'existe pas ou a été supprimée."}</p>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const logoUrl = getImageUrl(entreprise.logo);
  const coverUrl = getImageUrl(entreprise.photoCouverture);
  const dejaNote = entreprise.avis?.some((a) => a.user_id === user?.id);
  const isOwnEntreprise = entreprise.dirigeantId === user?.id;
  const badges = entreprise.dirigeant?.badges || [];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[1440px] mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">CCI</div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-title-sm text-primary">CCI Matsiatra</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Matsiatra Ambony</span>
            </div>
          </Link>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface text-label-md font-medium hover:bg-surface-container transition-colors">
            <Icon name="arrow-back" size={18} />
            <span className="hidden sm:inline">Retour</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col gap-6">
          {/* Bandeau */}
          <div className="rounded-2xl bg-surface-container-lowest shadow-sm border border-black/5 overflow-hidden">
            <div className="relative h-40 sm:h-48 bg-gradient-to-br from-primary-container/30 via-surface-container to-secondary-container/20">
              {coverUrl && <img src={coverUrl} alt={entreprise.raisonSociale} className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className="relative p-5 sm:p-6 -mt-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                {logoUrl ? (
                  <img src={logoUrl} alt={entreprise.raisonSociale} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-lg border-4 border-surface-container-lowest" />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-headline-md shadow-lg border-4 border-surface-container-lowest">
                    {getInitials(entreprise.sigle || entreprise.raisonSociale)}
                  </div>
                )}

                <div className="flex flex-col gap-2 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-headline-md sm:text-headline-lg text-primary tracking-tight">{entreprise.raisonSociale}</h1>
                    {entreprise.verifie && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-label-sm font-semibold">
                        <Icon name="verify" size={14} /> Vérifié CCI
                      </span>
                    )}
                  </div>

                  {/* ⬇️ BADGES FPD */}
                  {badges.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {badges.map((badge: any) => (
                        <div
                          key={badge.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-label-sm font-bold shadow-sm"
                          title={`Formation FPD validée le ${new Date(badge.date).toLocaleDateString("fr-FR")} — Note : ${badge.note}/20`}
                        >
                          <Icon name="workspace_premium" size={14} />
                          {badge.titre}
                        </div>
                      ))}
                    </div>
                  )}

                  {entreprise.nbAvis > 0 && (
                    <div className="flex items-center gap-2">
                      {renderStars(entreprise.noteMoyenne, 18)}
                      <span className="text-title-md text-on-surface font-semibold">{Number(entreprise.noteMoyenne).toFixed(1)}</span>
                      <span className="text-body-sm text-on-surface-variant">({entreprise.nbAvis} avis)</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
                    {entreprise.formeJuridique && <span className="font-medium text-on-surface">{entreprise.formeJuridique}</span>}
                    {entreprise.formeJuridique && entreprise.secteur && <span className="text-outline">•</span>}
                    {entreprise.secteur && <span>{entreprise.secteur}</span>}
                    {entreprise.ville && (<><span className="text-outline">•</span><span className="flex items-center gap-1"><Icon name="location" size={14} className="text-outline" />{entreprise.ville}</span></>)}
                    {entreprise.effectif && (<><span className="text-outline">•</span><span>{entreprise.effectif} employés</span></>)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {user && !dejaNote && !isOwnEntreprise && (
                  <button onClick={() => setShowModalAvis(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary-container text-on-secondary-container text-label-md font-semibold hover:opacity-90 transition-colors shadow-sm">
                    <Icon name="star" size={18} /> Laisser un avis
                  </button>
                )}
                {user && !isOwnEntreprise && (
                  <button onClick={() => setShowMessageModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors shadow-sm">
                    <Icon name="chat" size={18} /> Contacter
                  </button>
                )}
                {!user && (
                  <Link href="/connexion" className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors shadow-sm">
                    <Icon name="login" size={18} /> Se connecter
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 shadow-sm border border-black/5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="article" size={20} className="text-primary" />
                  <h2 className="text-title-lg text-primary">À propos de l&apos;entreprise</h2>
                </div>
                <p className="text-body-md text-on-surface leading-relaxed">{entreprise.description || "Description non disponible."}</p>
                {entreprise.motsCles && entreprise.motsCles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {entreprise.motsCles.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full bg-surface-container text-label-sm text-on-surface-variant font-medium">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {entreprise.listeProduits && entreprise.listeProduits.length > 0 && (
                <div className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 shadow-sm border border-black/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="inventory" size={20} className="text-primary" />
                    <h2 className="text-title-lg text-primary">Produits phares</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {entreprise.listeProduits.map((p, i) => (
                      <div key={i} className="rounded-xl bg-surface-container-low overflow-hidden border border-black/5">
                        {p.image ? (
                          <img src={getImageUrl(p.image) || ""} alt={p.nom} className="w-full h-32 object-cover" />
                        ) : (
                          <div className="w-full h-32 bg-surface-container flex items-center justify-center"><Icon name="inventory" size={40} className="text-outline" /></div>
                        )}
                        <div className="p-3 flex flex-col gap-0.5">
                          <span className="text-[10px] text-outline uppercase tracking-wider font-semibold">{p.categorie || "Produit"}</span>
                          <h3 className="text-title-md text-on-surface truncate">{p.nom}</h3>
                          {p.prix && <span className="text-title-md text-primary font-bold">{p.prix}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 shadow-sm border border-black/5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Icon name="star" size={20} className="text-amber-500" />
                    <h2 className="text-title-lg text-primary">Avis clients ({entreprise.nbAvis})</h2>
                  </div>
                  {user && !dejaNote && !isOwnEntreprise && (
                    <button onClick={() => setShowModalAvis(true)} className="flex items-center gap-1 text-label-md text-primary hover:underline font-semibold">
                      <Icon name="plus" size={16} /> Ajouter un avis
                    </button>
                  )}
                </div>

                {!entreprise.avis || entreprise.avis.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-3"><Icon name="star" size={28} className="text-outline" /></div>
                    <p className="text-body-md text-on-surface-variant">Aucun avis pour le moment</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {entreprise.avis.map((avis, i) => (
                      <div key={i} className="p-4 rounded-xl bg-surface-container-low flex gap-3">
                        {avis.auteur_photo ? (
                          <img src={getImageUrl(avis.auteur_photo) || ""} alt={avis.auteur_nom} className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-black/5" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm shrink-0">{getInitials(avis.auteur_nom)}</div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0 gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-title-sm text-on-surface font-semibold truncate">{avis.auteur_nom}</span>
                            <span className="text-code-sm text-outline shrink-0">{new Date(avis.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <div>{renderStars(avis.note, 14)}</div>
                          <p className="text-body-sm text-on-surface-variant mt-1">{avis.commentaire}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 shadow-sm border border-black/5 flex flex-col gap-4">
                <div className="flex items-center gap-2"><Icon name="info" size={20} className="text-primary" /><h2 className="text-title-md text-primary font-semibold">Informations</h2></div>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: "badge", l: "NIF", v: entreprise.nif },
                    { icon: "receipt_long", l: "STAT", v: entreprise.stat },
                    { icon: "account_balance", l: "Forme juridique", v: entreprise.formeJuridique },
                    { icon: "category", l: "Secteur", v: entreprise.secteur },
                    { icon: "calendar", l: "Créée en", v: entreprise.anneeCreation ? new Date(entreprise.anneeCreation).getFullYear().toString() : null },
                    { icon: "groups", l: "Effectif", v: entreprise.effectif ? `${entreprise.effectif} employés` : null },
                  ].filter((item) => item.v).map((item) => (
                    <div key={item.l} className="flex items-start gap-2.5">
                      <Icon name={item.icon as any} size={18} className="text-outline mt-0.5 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-outline uppercase tracking-wider">{item.l}</span>
                        <span className="text-body-sm text-on-surface font-medium truncate">{item.v}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {(entreprise.telephone || entreprise.email || entreprise.siteWeb) && (
                  <div className="pt-4 border-t border-black/5 flex flex-col gap-2">
                    {entreprise.telephone && (
                      <a href={`tel:${entreprise.telephone}`} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                        <Icon name="phone" size={18} className="text-primary shrink-0" />
                        <span className="text-body-sm text-on-surface font-medium truncate">{entreprise.telephone}</span>
                      </a>
                    )}
                    {entreprise.email && (
                      <a href={`mailto:${entreprise.email}`} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                        <Icon name="mail" size={18} className="text-primary shrink-0" />
                        <span className="text-body-sm text-on-surface font-medium truncate">{entreprise.email}</span>
                      </a>
                    )}
                    {entreprise.siteWeb && (
                      <a href={entreprise.siteWeb.startsWith("http") ? entreprise.siteWeb : `https://${entreprise.siteWeb}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                        <Icon name="globe" size={18} className="text-primary shrink-0" />
                        <span className="text-body-sm text-primary font-medium truncate">{entreprise.siteWeb}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 shadow-sm border border-black/5 flex flex-col gap-3">
                <div className="flex items-center gap-2"><Icon name="location_on" size={20} className="text-primary" /><h2 className="text-title-md text-primary font-semibold">Localisation</h2></div>
                <div className="flex items-start gap-2.5">
                  <Icon name="location" size={18} className="text-primary-container mt-0.5 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-body-md text-on-surface font-medium">{entreprise.adresse || "—"}</span>
                    <span className="text-body-sm text-on-surface-variant">{[entreprise.ville, entreprise.region].filter(Boolean).join(", ")}</span>
                  </div>
                </div>
              </div>

              {entreprise.mentor && (
                <div className="rounded-2xl bg-gradient-to-br from-primary-container/20 via-surface-container-lowest to-secondary-container/20 p-5 sm:p-6 shadow-sm border border-black/5">
                  <div className="flex items-center gap-2 mb-3"><Icon name="mentor" size={20} className="text-secondary" /><h2 className="text-title-md text-primary font-semibold">Mentor consulaire</h2></div>
                  <div className="flex items-center gap-3">
                    {getImageUrl(entreprise.mentor.photoProfil) ? (
                      <img src={getImageUrl(entreprise.mentor.photoProfil) || ""} alt="" className="w-12 h-12 rounded-xl object-cover ring-1 ring-black/5" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold">{getInitials(`${entreprise.mentor.prenom} ${entreprise.mentor.nom}`)}</div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-label-md text-on-surface font-semibold truncate">{entreprise.mentor.prenom} {entreprise.mentor.nom}</span>
                      <span className="text-body-sm text-on-surface-variant truncate">{entreprise.mentor.domaineMentor || "Expert consulaire"}</span>
                    </div>
                  </div>
                </div>
              )}

              {publications.length > 0 && (
                <div className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 shadow-sm border border-black/5">
                  <div className="flex items-center gap-2 mb-3"><Icon name="feed" size={20} className="text-primary" /><h2 className="text-title-md text-primary font-semibold">Actualités récentes</h2></div>
                  <div className="flex flex-col gap-3">
                    {publications.slice(0, 3).map((pub) => (
                      <div key={pub.id} className="p-3 rounded-lg bg-surface-container-low">
                        {pub.titre && <span className="text-label-sm text-primary font-semibold block mb-1">{pub.titre}</span>}
                        <p className="text-body-sm text-on-surface line-clamp-3">{pub.contenu}</p>
                        <span className="text-code-sm text-outline mt-1.5 block">{new Date(pub.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Avis */}
      {showModalAvis && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div onClick={() => setShowModalAvis(false)} className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5"><h2 className="text-title-lg text-primary">Laisser un avis</h2><p className="text-body-sm text-on-surface-variant">{entreprise.raisonSociale}</p></div>
              <button onClick={() => setShowModalAvis(false)} className="w-9 h-9 rounded-xl flex items-center justify-center text-outline hover:bg-surface-container transition-colors"><Icon name="close" size={18} /></button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-label-md font-semibold text-on-surface">Note</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setAvisNote(n)} className="transition-transform hover:scale-110">
                    <Icon name="star" size={32} className={n <= avisNote ? "text-amber-500" : "text-outline-variant/40"} />
                  </button>
                ))}
                <span className="text-title-lg text-on-surface font-semibold ml-2">{avisNote}/5</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">Commentaire</label>
              <textarea value={avisCommentaire} onChange={(e) => setAvisCommentaire(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container resize-none" placeholder="Partagez votre expérience…" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowModalAvis(false)} className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md hover:bg-surface-container-high transition-colors">Annuler</button>
              <button onClick={handleSubmitAvis} disabled={isSubmitting || !avisCommentaire.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-label-md font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50">
                {isSubmitting ? <><Icon name="refresh" size={16} className="animate-spin" /><span>Envoi…</span></> : <><Icon name="check" size={16} /><span>Publier</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      <MessageModal open={showMessageModal} onClose={() => setShowMessageModal(false)} entreprise={entreprise} />
    </div>
  );
}