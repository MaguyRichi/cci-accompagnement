"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import {
  entreprisesApi,
  publicationsApi,
  demandesApi,
  uploadApi,
  getImageUrl,
  Entreprise,
  Publication,
} from "@/lib/api-services";
import Icon from "@/components/ui/Icon";
import EntrepriseCard from "@/components/entreprises/EntrepriseCard";
import MessageModal from "@/components/entreprises/MessageModal";

/* ============================================
   TYPES
   ============================================ */
type MainTab = "mon-mur" | "decouvrir";
type SortOption = "recent" | "note" | "vues" | "nom";

/* ============================================
   PAGE PRINCIPALE
   ============================================ */
export default function MurPage() {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>("mon-mur");

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col w-full gap-6">
        {/* HEADER */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm border border-black/5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-code-sm text-outline uppercase tracking-wider">
                Réseau des PME — Haute Matsiatra
              </span>
              <h1 className="text-headline-md text-primary tracking-tight">
                Le Mur des Entreprises
              </h1>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low">
              <button
                type="button"
                onClick={() => setMainTab("mon-mur")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-label-md font-semibold transition-all ${
                  mainTab === "mon-mur"
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon name="feed" size={16} />
                <span>Fil d'actualité</span>
              </button>
              <button
                type="button"
                onClick={() => setMainTab("decouvrir")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-label-md font-semibold transition-all ${
                  mainTab === "decouvrir"
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon name="storefront" size={16} />
                <span>Découvrir</span>
              </button>
            </div>
          </div>
        </div>

        {mainTab === "mon-mur" && <MonMurTab />}
        {mainTab === "decouvrir" && <DecouvrirTab />}
      </div>
    </div>
  );
}

/* ============================================
   ONGLET 1 — MON MUR (FLUX GLOBAL)
   ============================================ */
function MonMurTab() {
  const { user } = useAuth();
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Composer
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal Collaboration
  const [showModalCollab, setShowModalCollab] = useState(false);
  const [collabTitre, setCollabTitre] = useState("");
  const [collabDescription, setCollabDescription] = useState("");
  const [collabSousType, setCollabSousType] = useState("DEMANDE");
  const [isCreatingCollab, setIsCreatingCollab] = useState(false);

  // Modal Commentaires
  const [commentTarget, setCommentTarget] = useState<Publication | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);

  const loadPublications = async () => {
    try {
      const res = await publicationsApi.getFluxPublic({ limit: 50 });
      setPublications(res.data);
    } catch (err) {
      console.error("Erreur publications:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const ent = await entreprisesApi.getMyEntreprise();
        setEntreprise(ent);
        await loadPublications();
      } catch (error) {
        console.error("Erreur mur:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Image trop volumineuse (max 10 Mo)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Seules les images sont acceptées");
      return;
    }
    setError(null);
    setIsUploadingImage(true);
    try {
      const res = await uploadApi.upload(file, "publication");
      setPostImage(res.url);
    } catch (err) {
      setError("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handlePublish = async () => {
    if (!postContent.trim() || !entreprise) return;
    setError(null);
    setIsPublishing(true);
    try {
      const newPub = await publicationsApi.create({
        entrepriseId: entreprise.id,
        type: "POST_MANUEL",
        contenu: postContent,
        image: postImage || undefined,
        visibilite: "PUBLIC",
      });
      setPublications((prev) => [newPub, ...prev]);
      setPostContent("");
      setPostImage(null);
      setPublished(true);
      setTimeout(() => setPublished(false), 2000);
    } catch (err: any) {
      setError("Erreur lors de la publication");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLike = async (pubId: number) => {
    if (!user) return;
    try {
      const res = await publicationsApi.toggleLike(pubId);
      setPublications((prev) =>
        prev.map((p) =>
          p.id === pubId
            ? {
                ...p,
                nbLikes: res.nbLikes,
                likes: res.liked
                  ? [...(p.likes || []), user.id]
                  : (p.likes || []).filter((id) => id !== user.id),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("Erreur like:", err);
    }
  };

  const handleAjouterCommentaire = async () => {
    if (!commentTarget || !commentText.trim() || !user) return;
    setIsSendingComment(true);
    try {
      const newComment = await publicationsApi.ajouterCommentaire(commentTarget.id, commentText);
      
      setPublications((prev) =>
        prev.map((p) =>
          p.id === commentTarget.id
            ? {
                ...p,
                nbCommentaires: p.nbCommentaires + 1,
                commentaires: [...(p.commentaires || []), newComment],
              }
            : p
        )
      );
      setCommentText("");
    } catch (err) {
      console.error("Erreur commentaire:", err);
      alert("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleCreateCollaboration = async () => {
    if (!entreprise || !collabTitre.trim() || !collabDescription.trim()) return;
    setIsCreatingCollab(true);
    setError(null);
    try {
      await demandesApi.createCollaboration({
        titre: collabTitre,
        description: collabDescription,
        sousType: collabSousType,
        visiblePubliquement: true,
      });
      setShowModalCollab(false);
      setCollabTitre("");
      setCollabDescription("");
      alert("✅ Collaboration publiée avec succès ! Retrouvez-la dans l'onglet Découvrir.");
    } catch (err: any) {
      setError("Erreur lors de la création de la collaboration");
    } finally {
      setIsCreatingCollab(false);
    }
  };

  const getInitials = (text: string) =>
    text.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="h-40 rounded-xl bg-surface-container-lowest animate-pulse" />
          <div className="h-72 rounded-xl bg-surface-container-lowest animate-pulse" />
        </div>
        <div className="lg:col-span-4 h-96 rounded-xl bg-surface-container-lowest animate-pulse" />
      </div>
    );
  }

  if (!entreprise) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Icon name="domain" size={48} className="text-primary" />
        <h1 className="text-headline-md text-primary">Aucune entreprise associée</h1>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold">Retour à l&apos;accueil</Link>
      </div>
    );
  }

  const logoUrl = getImageUrl(entreprise.logo);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* COMPOSER */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-start gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={entreprise.raisonSociale} className="w-12 h-12 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold shrink-0">
                {getInitials(entreprise.sigle || entreprise.raisonSociale)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                disabled={isPublishing}
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-md rounded-xl p-3 resize-none focus:outline-none focus:bg-surface-container-lowest transition-colors disabled:opacity-50"
                placeholder="Partagez une actualité, une opportunité..."
                rows={3}
              />
            </div>
          </div>

          {postImage && (
            <div className="relative rounded-xl overflow-hidden bg-surface-container-low max-w-md">
              <img src={getImageUrl(postImage) || ""} alt="Aperçu" className="w-full max-h-64 object-cover" />
              <button onClick={() => setPostImage(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-primary/80 text-on-primary hover:bg-primary transition-colors">
                <Icon name="close" size={18} />
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-error-container text-on-error-container">
              <Icon name="alert" size={20} className="shrink-0 mt-0.5" />
              <span className="text-body-sm">{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1">
              <div className="relative">
                <input id="post-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                <label htmlFor="post-image-upload" className="flex items-center gap-1 px-3 py-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors text-label-sm cursor-pointer">
                  <Icon name={isUploadingImage ? "refresh" : "add_photo_alternate"} size={18} className={isUploadingImage ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">{isUploadingImage ? "Envoi..." : "Illustration"}</span>
                </label>
              </div>
            </div>
            <button
              onClick={handlePublish}
              disabled={isPublishing || !postContent.trim() || isUploadingImage}
              className="flex items-center justify-center gap-1 bg-primary-container text-on-primary hover:bg-primary px-5 py-2 rounded-lg text-label-md transition-colors shadow-sm disabled:opacity-50"
            >
              <Icon name={published ? "check" : "send"} size={18} className={isPublishing ? "animate-spin" : ""} />
              <span>{published ? "Publié !" : isPublishing ? "Envoi..." : "Publier"}</span>
            </button>
          </div>
        </div>

        {/* FEED */}
        <div className="flex flex-col gap-6">
          {publications.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-8 sm:p-12 shadow-sm text-center">
              <Icon name="feed" size={48} className="text-outline mx-auto mb-3" />
              <h3 className="text-title-lg text-primary mb-2">Aucune publication</h3>
              <p className="text-body-sm text-on-surface-variant">Soyez le premier à partager une actualité.</p>
            </div>
          ) : (
            publications.map((pub) => {
              const isLiked = (pub.likes || []).includes(user?.id || 0);
              // ✅ Récupération de l'image de profil de l'auteur ou du logo de l'entreprise
              const authorAvatar = getImageUrl(pub.auteur?.photoProfil) || getImageUrl(pub.entreprise?.logo);
              
              return (
                <article key={pub.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* ✅ AFFICHAGE DE LA PHOTO OU DES INITIALES */}
                      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-primary-container text-on-primary flex items-center justify-center text-title-md border border-black/5">
                        {authorAvatar ? (
                          <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(pub.entreprise?.sigle || pub.entreprise?.raisonSociale || "PME")
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-title-md text-on-surface truncate">
                          {pub.entreprise?.raisonSociale || "Entreprise"}
                        </span>
                        <span className="text-code-sm text-outline">
                          {new Date(pub.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-body-md text-on-surface flex flex-col gap-2">
                    {pub.titre && <h3 className="text-title-lg text-primary">{pub.titre}</h3>}
                    <p className="whitespace-pre-line">{pub.contenu}</p>
                  </div>

                  {pub.image && (
                    <div className="rounded-xl overflow-hidden bg-surface-container">
                      <img src={getImageUrl(pub.image) || ""} alt="Publication" className="w-full max-h-[400px] object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-surface-container-low">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleLike(pub.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-label-sm ${isLiked ? "text-error" : "text-on-surface-variant hover:text-error"}`}
                      >
                        <Icon name="heart" size={18} />
                        <span>{pub.nbLikes || 0}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setCommentTarget(pub);
                          setCommentText("");
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-on-surface-variant hover:text-primary text-label-sm"
                      >
                        <Icon name="chat" size={18} />
                        <span>Commentaires ({pub.nbCommentaires || 0})</span>
                      </button>
                    </div>
                    <span className="text-code-sm text-outline">{pub.nbVues || 0} vues</span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-title-md text-primary flex items-center gap-1">
            <Icon name="building" size={20} className="text-secondary" /> Mon entreprise
          </h3>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={entreprise.raisonSociale} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-title-lg">
                {getInitials(entreprise.sigle || entreprise.raisonSociale)}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-title-md text-on-surface font-semibold truncate">{entreprise.raisonSociale}</span>
              <span className="text-body-sm text-on-surface-variant truncate">{entreprise.secteur}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-low">
            <div className="flex flex-col">
              <span className="text-label-sm text-outline">Publications</span>
              <span className="text-title-md text-primary font-bold">{entreprise.nbPublications}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-sm text-outline">Vues</span>
              <span className="text-title-md text-primary font-bold">{entreprise.nbVues}</span>
            </div>
          </div>
          <Link href="/pme/profil" className="w-full inline-flex items-center justify-center gap-1 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-label-md transition-colors">
            <Icon name="badge" size={18} /> Voir mon profil
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-title-md text-primary flex items-center gap-1">
            <Icon name="lightbulb" size={20} className="text-primary" /> Actions rapides
          </h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowModalCollab(true)}
              className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0">
                <Icon name="handshake" size={20} />
              </div>
              <span className="text-label-md text-on-surface font-semibold flex-1">Créer une collaboration</span>
              <Icon name="chevron-right" size={18} className="text-outline" />
            </button>

            {[
              { icon: "mentor", title: "Voir mes mentorats", href: "/pme/mentorat" },
              { icon: "assessment", title: "Démarrer un diagnostic", href: "/pme/diagnostic/questionnaire" },
              { icon: "chat", title: "Ouvrir la messagerie", href: "/pme/messages" },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0">
                  <Icon name={item.icon as any} size={20} />
                </div>
                <span className="text-label-md text-on-surface font-semibold flex-1">{item.title}</span>
                <Icon name="chevron-right" size={18} className="text-outline" />
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* MODAL CRÉATION COLLABORATION */}
      {showModalCollab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-title-lg text-primary">Créer une demande de collaboration</h2>
                <p className="text-body-sm text-on-surface-variant">Publiez une offre ou une demande visible par les autres PME</p>
              </div>
              <button onClick={() => setShowModalCollab(false)} className="p-2 rounded-lg text-outline hover:bg-surface-container transition-colors">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">Type de collaboration *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "DEMANDE", l: "Demande", icon: "search" },
                  { v: "OFFRE", l: "Offre", icon: "badge" },
                  { v: "PARTENARIAT", l: "Partenariat", icon: "handshake" },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setCollabSousType(opt.v)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      collabSousType === opt.v ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <Icon name={opt.icon as any} size={24} />
                    <span className="text-label-sm font-semibold">{opt.l}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">Titre *</label>
              <input value={collabTitre} onChange={(e) => setCollabTitre(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container" placeholder="Ex: Recherche partenaire emballage" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">Description *</label>
              <textarea value={collabDescription} onChange={(e) => setCollabDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container" placeholder="Décrivez votre besoin..." />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setShowModalCollab(false)} className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md hover:bg-surface-container-high transition-colors">Annuler</button>
              <button onClick={handleCreateCollaboration} disabled={isCreatingCollab || !collabTitre.trim() || !collabDescription.trim()} className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1">
                {isCreatingCollab ? (<><Icon name="refresh" size={18} className="animate-spin" /><span>Publication...</span></>) : (<><Icon name="campaign" size={18} /><span>Publier</span></>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMMENTAIRES */}
      {commentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-xl p-6 flex flex-col gap-4 max-h-[80vh]">
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg text-primary">Commentaires ({commentTarget.nbCommentaires})</h2>
              <button onClick={() => setCommentTarget(null)} className="p-2 rounded-lg text-outline hover:bg-surface-container transition-colors">
                <Icon name="close" size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2">
              {(!commentTarget.commentaires || commentTarget.commentaires.length === 0) ? (
                <p className="text-body-sm text-on-surface-variant italic text-center py-4">Aucun commentaire pour le moment.</p>
              ) : (
                commentTarget.commentaires.map((c: any) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold shrink-0">
                      {c.auteur_nom?.[0] || "?"}
                    </div>
                    <div className="flex flex-col bg-surface-container-low p-2.5 rounded-lg flex-1">
                      <span className="text-label-sm font-semibold text-on-surface">{c.auteur_nom}</span>
                      <span className="text-body-sm text-on-surface-variant">{c.contenu}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-surface-container-low">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Écrire un commentaire..."
                className="flex-1 px-4 py-2 rounded-xl bg-surface-container-low text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                onKeyDown={(e) => { if (e.key === "Enter") handleAjouterCommentaire(); }}
              />
              <button
                onClick={handleAjouterCommentaire}
                disabled={isSendingComment || !commentText.trim()}
                className="p-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors"
              >
                <Icon name={isSendingComment ? "refresh" : "send"} size={18} className={isSendingComment ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   ONGLET 2 — DÉCOUVRIR (PME + COLLABORATIONS)
   ============================================ */
function DecouvrirTab() {
  const { user } = useAuth();
  
  // États PME
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 12;

  // États Collaborations
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [isLoadingCollabs, setIsLoadingCollabs] = useState(true);

  // Filtres PME
  const [search, setSearch] = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");
  const [filterVille, setFilterVille] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");
  const [messageTarget, setMessageTarget] = useState<Entreprise | null>(null);

  const [secteurs, setSecteurs] = useState<string[]>([]);
  const [villes, setVilles] = useState<string[]>([]);

  // Chargement des PME
  const loadEntreprises = async () => {
    setIsLoading(true);
    try {
      const res = await entreprisesApi.getPublic({
        page, limit,
        q: search.trim() || undefined,
        secteur: filterSecteur || undefined,
        ville: filterVille || undefined,
        sort,
      } as any);
      setEntreprises(res.data || []);
      setTotal(res.meta?.total || 0);
      
      if (res.data) {
        const s = new Set<string>(); const v = new Set<string>();
        res.data.forEach((e) => { if (e.secteur) s.add(e.secteur); if (e.ville) v.add(e.ville); });
        setSecteurs((prev) => Array.from(new Set([...prev, ...s])).sort());
        setVilles((prev) => Array.from(new Set([...prev, ...v])).sort());
      }
    } catch (err) {
      console.error("Erreur chargement entreprises:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement des Collaborations
  const loadCollaborations = async () => {
    setIsLoadingCollabs(true);
    try {
      const res = await demandesApi.getCollaborationsPubliques({ limit: 6 });
      setCollaborations(res.data || []);
    } catch (err) {
      console.error("Erreur chargement collaborations:", err);
    } finally {
      setIsLoadingCollabs(false);
    }
  };

  useEffect(() => { 
    loadEntreprises(); 
    loadCollaborations();
  }, []);
  
  useEffect(() => { 
    const t = setTimeout(() => { setPage(1); loadEntreprises(); }, 350); 
    return () => clearTimeout(t); 
  }, [search, filterSecteur, filterVille, sort]);
  
  useEffect(() => { if (page !== 1) loadEntreprises(); }, [page]);

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = search || filterSecteur || filterVille;
  
  const resetFilters = () => {
    setSearch(""); setFilterSecteur(""); setFilterVille(""); setSort("recent"); setPage(1);
  };

  return (
    <>
      <div className="flex flex-col gap-10">
        
        {/* SECTION 1 : LISTE DES PME */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-title-lg text-primary font-bold">Annuaire des PME</h2>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-black/5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"><Icon name="search" size={18} /></div>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une PME..." className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl text-body-sm text-on-surface placeholder:text-outline border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 focus:bg-surface-container-lowest focus:border-black/5 transition-all" />
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="px-3.5 py-2.5 bg-surface-container-low rounded-xl text-body-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer">
                <option value="recent">Plus récentes</option>
                <option value="note">Meilleures notes</option>
                <option value="nom">Nom (A-Z)</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={filterSecteur} onChange={(e) => setFilterSecteur(e.target.value)} className="px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer">
                <option value="">Tous secteurs</option>
                {secteurs.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterVille} onChange={(e) => setFilterVille(e.target.value)} className="px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer">
                <option value="">Toutes villes</option>
                {villes.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-error-container text-on-error-container text-label-sm font-semibold hover:bg-error-container/80 transition-colors">
                  <Icon name="close" size={14} /> Réinitialiser
                </button>
              )}
              <span className="ml-auto text-code-sm text-outline">{total} entreprise{total > 1 ? "s" : ""}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-surface-container-lowest border border-black/5 animate-pulse" />)}
            </div>
          ) : entreprises.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center border border-black/5 shadow-sm">
              <Icon name="storefront" size={48} className="text-outline mx-auto mb-3" />
              <h3 className="text-headline-sm text-primary mb-2">Aucune entreprise trouvée</h3>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {entreprises.map((ent) => (
                  <EntrepriseCard key={ent.id} entreprise={ent} userRole={user?.role} isOwnEntreprise={ent.dirigeantId === user?.id} onMessage={(e) => setMessageTarget(e)} onCollaboration={(e) => { window.location.href = `/pme/mur?collab=${e.id}`; }} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-label-md transition-colors disabled:opacity-40"><Icon name="chevron-left" size={16} /> Précédent</button>
                  <span className="text-label-md text-on-surface-variant">Page {page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-label-md transition-colors disabled:opacity-40">Suivant <Icon name="chevron-right" size={16} /></button>
                </div>
              )}
            </>
          )}
        </div>

        {/* SECTION 2 : COLLABORATIONS */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-title-lg text-primary font-bold">Opportunités de collaboration</h2>
            <span className="text-code-sm text-outline">Les dernières offres et demandes du réseau</span>
          </div>

          {isLoadingCollabs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 rounded-2xl bg-surface-container-lowest border border-black/5 animate-pulse" />)}
            </div>
          ) : collaborations.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center border border-black/5 shadow-sm">
              <Icon name="handshake" size={48} className="text-outline mx-auto mb-3" />
              <h3 className="text-headline-sm text-primary mb-2">Aucune opportunité pour le moment</h3>
              <p className="text-body-sm text-on-surface-variant">Créez la première collaboration depuis votre mur.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {collaborations.map((collab) => (
                <div key={collab.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-black/5 flex flex-col gap-3 hover:shadow-md transition-shadow relative overflow-hidden group">
                  
                  {/* Bandeau coloré selon le type */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${
                    collab.sousType === "DEMANDE" ? "bg-blue-400" : collab.sousType === "OFFRE" ? "bg-emerald-400" : "bg-purple-400"
                  }`} />

                  <div className="flex items-center justify-between mt-1">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      collab.sousType === "DEMANDE" ? "bg-blue-50 text-blue-700 border-blue-200" : collab.sousType === "OFFRE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}>
                      {collab.sousType}
                    </span>
                    <span className="text-[10px] text-outline font-medium">
                      {new Date(collab.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  <h3 className="text-title-md font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {collab.titre}
                  </h3>
                  
                  <p className="text-body-sm text-slate-500 line-clamp-3">
                    {collab.description}
                  </p>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                        {collab.entreprise?.sigle?.[0] || collab.entreprise?.raisonSociale?.[0] || "P"}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                        {collab.entreprise?.raisonSociale || "PME"}
                      </span>
                    </div>
                    
                    {/* ✅ BOUTON CONTACTER VERS L'ENTREPRISE (SÉCURISÉ) */}
                    {collab.entreprise?.id ? (
                      <Link 
                        href={`/entreprise/${collab.entreprise.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                      >
                        <Icon name="chat" size={14} /> Contacter
                      </Link>
                    ) : (
                      <span className="text-xs text-outline italic">Indisponible</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MessageModal open={!!messageTarget} onClose={() => setMessageTarget(null)} entreprise={messageTarget} />
    </>
  );
}