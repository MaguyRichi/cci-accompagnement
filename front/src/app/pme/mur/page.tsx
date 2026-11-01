"use client";

import { useEffect, useMemo, useState } from "react";
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
   PAGE
   ============================================ */
export default function MurPage() {
  const { user } = useAuth();

  const [mainTab, setMainTab] = useState<MainTab>("mon-mur");

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col w-full gap-6">
        {/* ============ HEADER PRINCIPAL ============ */}
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

            {/* Onglets principaux */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low">
              <button
                type="button"
                onClick={() => setMainTab("mon-mur")}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  text-label-md font-semibold transition-all
                  ${
                    mainTab === "mon-mur"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }
                `}
              >
                <Icon name="feed" size={16} />
                <span>Mon mur</span>
              </button>
              <button
                type="button"
                onClick={() => setMainTab("decouvrir")}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  text-label-md font-semibold transition-all
                  ${
                    mainTab === "decouvrir"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }
                `}
              >
                <Icon name="storefront" size={16} />
                <span>Découvrir les PME</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============ CONTENU DE L'ONGLET ============ */}
        {mainTab === "mon-mur" && <MonMurTab />}
        {mainTab === "decouvrir" && <DecouvrirTab />}
      </div>
    </div>
  );
}

/* ============================================
   ONGLET 1 — MON MUR (feed actuel)
   ============================================ */
function MonMurTab() {
  const { user } = useAuth();

  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("toutes");
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModalCollab, setShowModalCollab] = useState(false);
  const [collabTitre, setCollabTitre] = useState("");
  const [collabDescription, setCollabDescription] = useState("");
  const [collabBesoin, setCollabBesoin] = useState("");
  const [collabVolume, setCollabVolume] = useState("");
  const [collabLocalisation, setCollabLocalisation] = useState("");
  const [collabSecteur, setCollabSecteur] = useState("");
  const [collabSousType, setCollabSousType] = useState("DEMANDE");
  const [isCreatingCollab, setIsCreatingCollab] = useState(false);

  const loadPublications = async (entrepriseId: number) => {
    try {
      const res = await publicationsApi.getMurEntreprise(entrepriseId, {
        limit: 20,
      });
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
        if (ent) await loadPublications(ent.id);
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
    try {
      const res = await publicationsApi.toggleLike(pubId);
      setPublications((prev) =>
        prev.map((p) =>
          p.id === pubId
            ? {
                ...p,
                nbLikes: res.nbLikes,
                likes: res.liked
                  ? [...(p.likes || []), user!.id]
                  : (p.likes || []).filter((id) => id !== user!.id),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("Erreur like:", err);
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
        besoinDetaille: collabBesoin || undefined,
        volume: collabVolume || undefined,
        localisationCible: collabLocalisation || undefined,
        secteurConcerne: collabSecteur || entreprise.secteur,
        sousType: collabSousType,
        visiblePubliquement: true,
      });
      setShowModalCollab(false);
      setCollabTitre("");
      setCollabDescription("");
      setCollabBesoin("");
      setCollabVolume("");
      setCollabLocalisation("");
      setCollabSecteur("");
      setCollabSousType("DEMANDE");
      alert("✅ Collaboration publiée avec succès !");
    } catch (err: any) {
      setError("Erreur lors de la création de la collaboration");
    } finally {
      setIsCreatingCollab(false);
    }
  };

  const getInitials = (text: string) =>
    text
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

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
        <h1 className="text-headline-md text-primary">
          Aucune entreprise associée
        </h1>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "toutes", label: "Toutes" },
    { id: "diagnostics", label: "Diagnostics" },
    { id: "mentorat", label: "Mentorat" },
    { id: "collaborations", label: "Collaborations" },
  ];

  const publicationsFiltered =
    activeTab === "toutes"
      ? publications
      : publications.filter((p) => {
          if (activeTab === "diagnostics") return p.type === "DIAGNOSTIC";
          if (activeTab === "mentorat") return p.type === "MENTORAT";
          if (activeTab === "collaborations") return p.type === "COLLABORATION";
          return true;
        });

  const logoUrl = getImageUrl(entreprise.logo);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Tabs */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-label-md transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary-container text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-start gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={entreprise.raisonSociale}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
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
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-md rounded-xl p-2 resize-none focus:outline-none focus:bg-surface-container-lowest transition-colors disabled:opacity-50"
                placeholder="Partagez une actualité, une opportunité..."
                rows={3}
              />
            </div>
          </div>

          {postImage && (
            <div className="relative rounded-xl overflow-hidden bg-surface-container-low max-w-md">
              <img
                src={getImageUrl(postImage) || ""}
                alt="Aperçu"
                className="w-full max-h-64 object-cover"
              />
              <button
                type="button"
                onClick={() => setPostImage(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-primary/80 text-on-primary hover:bg-primary transition-colors"
              >
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
                <input
                  id="post-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                />
                <label
                  htmlFor="post-image-upload"
                  className="flex items-center gap-1 px-3 py-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors text-label-sm cursor-pointer"
                >
                  <Icon
                    name={isUploadingImage ? "refresh" : "add_photo_alternate"}
                    size={18}
                    className={isUploadingImage ? "animate-spin" : ""}
                  />
                  <span className="hidden sm:inline">
                    {isUploadingImage ? "Envoi..." : "Illustration"}
                  </span>
                </label>
              </div>
            </div>
            <button
              onClick={handlePublish}
              disabled={
                isPublishing || !postContent.trim() || isUploadingImage
              }
              className="flex items-center justify-center gap-1 bg-primary-container text-on-primary hover:bg-primary px-5 py-2 rounded-lg text-label-md transition-colors shadow-sm disabled:opacity-50"
            >
              <Icon
                name={published ? "check" : "send"}
                size={18}
                className={isPublishing ? "animate-spin" : ""}
              />
              <span>
                {published
                  ? "Publié !"
                  : isPublishing
                    ? "Envoi..."
                    : "Publier"}
              </span>
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="flex flex-col gap-6">
          {publicationsFiltered.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-8 sm:p-12 shadow-sm text-center">
              <div className="relative w-48 h-48 mx-auto mb-4">
                <Image
                  src="/images/empty-state.svg"
                  alt="Aucune publication"
                  fill
                  sizes="192px"
                  className="object-contain"
                />
              </div>
              <h3 className="text-title-lg text-primary mb-2">
                Aucune publication pour le moment
              </h3>
              <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
                Soyez le premier à partager une actualité avec le réseau.
              </p>
            </div>
          ) : (
            publicationsFiltered.map((pub) => {
              const isLiked = (pub.likes || []).includes(user?.id || 0);
              return (
                <article
                  key={pub.id}
                  className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-title-md shrink-0">
                        {getInitials(
                          pub.entreprise?.sigle ||
                            pub.entreprise?.raisonSociale ||
                            entreprise.raisonSociale,
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-title-md text-on-surface truncate">
                          {pub.entreprise?.raisonSociale ||
                            entreprise.raisonSociale}
                        </span>
                        <span className="text-code-sm text-outline">
                          {new Date(pub.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-body-md text-on-surface flex flex-col gap-2">
                    {pub.titre && (
                      <h3 className="text-title-lg text-primary">{pub.titre}</h3>
                    )}
                    <p className="whitespace-pre-line">{pub.contenu}</p>
                  </div>

                  {pub.image && (
                    <div className="rounded-xl overflow-hidden bg-surface-container">
                      <img
                        src={getImageUrl(pub.image) || ""}
                        alt="Publication"
                        className="w-full max-h-[400px] object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-surface-container-low">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleLike(pub.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-label-sm ${
                          isLiked
                            ? "text-error"
                            : "text-on-surface-variant hover:text-error"
                        }`}
                      >
                        <Icon name="heart" size={18} />
                        <span>{pub.nbLikes}</span>
                      </button>
                      <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-on-surface-variant hover:text-primary text-label-sm">
                        <Icon name="chat" size={18} />
                        <span>Commentaires ({pub.nbCommentaires})</span>
                      </button>
                    </div>
                    <span className="text-code-sm text-outline">
                      {pub.nbVues} vues
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-title-md text-primary flex items-center gap-1">
            <Icon name="building" size={20} className="text-secondary" />
            Mon entreprise
          </h3>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={entreprise.raisonSociale}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-title-lg">
                {getInitials(entreprise.sigle || entreprise.raisonSociale)}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-title-md text-on-surface font-semibold truncate">
                {entreprise.raisonSociale}
              </span>
              <span className="text-body-sm text-on-surface-variant truncate">
                {entreprise.secteur}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-low">
            <div className="flex flex-col">
              <span className="text-label-sm text-outline">Publications</span>
              <span className="text-title-md text-primary font-bold">
                {entreprise.nbPublications}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-sm text-outline">Vues</span>
              <span className="text-title-md text-primary font-bold">
                {entreprise.nbVues}
              </span>
            </div>
          </div>
          <Link
            href="/pme/profil"
            className="w-full inline-flex items-center justify-center gap-1 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-label-md transition-colors"
          >
            <Icon name="badge" size={18} />
            <span>Voir mon profil</span>
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-title-md text-primary flex items-center gap-1">
            <Icon name="lightbulb" size={20} className="text-primary" />
            Actions rapides
          </h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowModalCollab(true)}
              className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0">
                <Icon name="handshake" size={20} />
              </div>
              <span className="text-label-md text-on-surface font-semibold flex-1">
                Créer une collaboration
              </span>
              <Icon name="chevron-right" size={18} className="text-outline" />
            </button>

            {[
              {
                icon: "mentor",
                title: "Voir mes mentorats",
                href: "/pme/mentorat",
              },
              {
                icon: "assessment",
                title: "Démarrer un diagnostic",
                href: "/pme/diagnostic/questionnaire",
              },
              {
                icon: "chat",
                title: "Ouvrir la messagerie",
                href: "/pme/messages",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0">
                  <Icon name={item.icon as any} size={20} />
                </div>
                <span className="text-label-md text-on-surface font-semibold flex-1">
                  {item.title}
                </span>
                <Icon name="chevron-right" size={18} className="text-outline" />
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Modal Collaboration */}
      {showModalCollab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-title-lg text-primary">
                  Créer une demande de collaboration
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Publiez une offre ou une demande visible par les autres PME
                </p>
              </div>
              <button
                onClick={() => setShowModalCollab(false)}
                className="p-2 rounded-lg text-outline hover:bg-surface-container transition-colors"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">
                Type de collaboration *
              </label>
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
                      collabSousType === opt.v
                        ? "bg-primary-container text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <Icon name={opt.icon as any} size={24} />
                    <span className="text-label-sm font-semibold">{opt.l}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">
                Titre *
              </label>
              <input
                value={collabTitre}
                onChange={(e) => setCollabTitre(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="Ex: Recherche partenaire emballage"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">
                Description *
              </label>
              <textarea
                value={collabDescription}
                onChange={(e) => setCollabDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="Décrivez votre besoin..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                value={collabVolume}
                onChange={(e) => setCollabVolume(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="Volume"
              />
              <input
                value={collabLocalisation}
                onChange={(e) => setCollabLocalisation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="Localisation"
              />
              <input
                value={collabSecteur}
                onChange={(e) => setCollabSecteur(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="Secteur"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModalCollab(false)}
                className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md hover:bg-surface-container-high transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCollaboration}
                disabled={
                  isCreatingCollab ||
                  !collabTitre.trim() ||
                  !collabDescription.trim()
                }
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
              >
                {isCreatingCollab ? (
                  <>
                    <Icon name="refresh" size={18} className="animate-spin" />
                    <span>Publication...</span>
                  </>
                ) : (
                  <>
                    <Icon name="campaign" size={18} />
                    <span>Publier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   ONGLET 2 — DÉCOUVRIR LES PME (nouvelle galerie)
   ============================================ */
function DecouvrirTab() {
  const { user } = useAuth();

  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Filtres
  const [search, setSearch] = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");
  const [filterVille, setFilterVille] = useState("");
  const [filterVerifie, setFilterVerifie] = useState("");
  const [filterHasMentor, setFilterHasMentor] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");

  // Modal message
  const [messageTarget, setMessageTarget] = useState<Entreprise | null>(null);

  // Liste unique des secteurs/villes
  const [secteurs, setSecteurs] = useState<string[]>([]);
  const [villes, setVilles] = useState<string[]>([]);

  const loadEntreprises = async () => {
    setIsLoading(true);
    try {
      const res = await entreprisesApi.getPublic({
        page,
        limit,
        q: search.trim() || undefined,
        secteur: filterSecteur || undefined,
        ville: filterVille || undefined,
        verifie: filterVerifie || undefined,
        hasMentor: filterHasMentor || undefined,
        sort,
      } as any);
      setEntreprises(res.data || []);
      setTotal(res.meta?.total || 0);

      // Extraire les secteurs et villes uniques
      if (res.data) {
        const s = new Set<string>();
        const v = new Set<string>();
        res.data.forEach((e) => {
          if (e.secteur) s.add(e.secteur);
          if (e.ville) v.add(e.ville);
        });
        setSecteurs((prev) => Array.from(new Set([...prev, ...s])).sort());
        setVilles((prev) => Array.from(new Set([...prev, ...v])).sort());
      }
    } catch (err) {
      console.error("Erreur chargement entreprises:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadEntreprises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rechargement quand filtres changent (avec debounce pour la recherche)
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadEntreprises();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterSecteur, filterVille, filterVerifie, filterHasMentor, sort]);

  // Rechargement quand page change
  useEffect(() => {
    if (page !== 1) loadEntreprises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters =
    search || filterSecteur || filterVille || filterVerifie || filterHasMentor;

  const resetFilters = () => {
    setSearch("");
    setFilterSecteur("");
    setFilterVille("");
    setFilterVerifie("");
    setFilterHasMentor("");
    setSort("recent");
    setPage(1);
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* ============ BARRE DE FILTRES ============ */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-black/5 flex flex-col gap-3">
          {/* Ligne 1 : recherche + tri */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                <Icon name="search" size={18} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une PME (nom, NIF, sigle...)"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl text-body-sm text-on-surface placeholder:text-outline border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 focus:bg-surface-container-lowest focus:border-black/5 transition-all"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3.5 py-2.5 bg-surface-container-low rounded-xl text-body-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer"
            >
              <option value="recent">Plus récentes</option>
              <option value="note">Meilleures notes</option>
              <option value="vues">Plus vues</option>
              <option value="nom">Nom (A-Z)</option>
            </select>
          </div>

          {/* Ligne 2 : filtres avancés */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterSecteur}
              onChange={(e) => setFilterSecteur(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer"
            >
              <option value="">Tous secteurs</option>
              {secteurs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterVille}
              onChange={(e) => setFilterVille(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer"
            >
              <option value="">Toutes villes</option>
              {villes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              value={filterVerifie}
              onChange={(e) => setFilterVerifie(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer"
            >
              <option value="">Toutes</option>
              <option value="true">Vérifiées CCI</option>
              <option value="false">Non vérifiées</option>
            </select>

            <select
              value={filterHasMentor}
              onChange={(e) => setFilterHasMentor(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer"
            >
              <option value="">Tous mentors</option>
              <option value="true">Avec mentor</option>
              <option value="false">Sans mentor</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-error-container text-on-error-container text-label-sm font-semibold hover:bg-error-container/80 transition-colors"
              >
                <Icon name="close" size={14} />
                Réinitialiser
              </button>
            )}

            <span className="ml-auto text-code-sm text-outline">
              {total} entreprise{total > 1 ? "s" : ""} active{total > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ============ GRILLE DE CARTES ============ */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-surface-container-lowest border border-black/5 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : entreprises.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-10 sm:p-14 text-center border border-black/5 shadow-sm">
            <div className="relative w-40 h-40 mx-auto mb-4">
              <Image
                src="/images/empty-state.svg"
                alt=""
                fill
                sizes="160px"
                className="object-contain opacity-80"
              />
            </div>
            <h3 className="text-headline-sm text-primary mb-2">
              Aucune entreprise trouvée
            </h3>
            <p className="text-body-md text-on-surface-variant max-w-md mx-auto">
              {hasActiveFilters
                ? "Essayez d'ajuster vos filtres de recherche."
                : "Aucune entreprise active pour le moment."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {entreprises.map((ent) => (
                <EntrepriseCard
                  key={ent.id}
                  entreprise={ent}
                  userRole={user?.role}
                  isOwnEntreprise={ent.dirigeantId === user?.id}
                  onMessage={(e) => setMessageTarget(e)}
                  onCollaboration={(e) => {
                    // Rediriger vers le mur avec le modal de collaboration ouvert
                    window.location.href = `/pme/mur?collab=${e.id}`;
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-label-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron-left" size={16} />
                  Précédent
                </button>
                <span className="text-label-md text-on-surface-variant">
                  Page <strong className="text-on-surface">{page}</strong> sur{" "}
                  {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-label-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                  <Icon name="chevron-right" size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal message */}
      <MessageModal
        open={!!messageTarget}
        onClose={() => setMessageTarget(null)}
        entreprise={messageTarget}
      />
    </>
  );
}