"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  entreprisesApi,
  documentsApi,
  getImageUrl,
  Entreprise,
  Produit,
} from "@/lib/api-services";
import ImageUpload from "@/components/ui/ImageUpload";
import DocumentUpload from "@/components/ui/DocumentUpload";
import { generateFicheEntreprisePDF, generateCertificatFPD } from "@/lib/pdf";
import Icon from "@/components/ui/Icon";

type TabType = "general" | "documents" | "produits" | "badges";

export default function ProfilPage() {
  const { user } = useAuth();

  /* ---------- ÉTATS ---------- */
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [tab, setTab] = useState<TabType>("general");
  const [isLoading, setIsLoading] = useState(true);

  /* États modal produit */
  const [showModalProduit, setShowModalProduit] = useState(false);
  const [produitNom, setProduitNom] = useState("");
  const [produitPrix, setProduitPrix] = useState("");
  const [produitCategorie, setProduitCategorie] = useState("");
  const [produitImage, setProduitImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /* ---------- CHARGEMENT ---------- */
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const ent = await entreprisesApi.getMyEntreprise();
        setEntreprise(ent);

        if (ent) {
          try {
            const res = await documentsApi.getAll({
              entrepriseId: ent.id,
              limit: 100,
            });
            setDocuments(res.data || []);
          } catch {
            setDocuments([]);
          }
        }
      } catch (error) {
        console.error("Erreur profil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  /* ---------- HELPERS ---------- */
  const getInitials = (text: string) =>
    text
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const findDocByCategorie = (cat: string) =>
    documents.find((d) => d.categorie === cat);

  const handleDownloadFiche = () => {
    if (!entreprise) return;
    generateFicheEntreprisePDF(entreprise);
  };

  const handleLogoUpload = async (url: string) => {
    if (!entreprise) return;
    try {
      const updated = await entreprisesApi.update(entreprise.id, {
        logo: url,
      } as any);
      setEntreprise(updated);
    } catch (error) {
      console.error("Erreur mise à jour logo:", error);
    }
  };

  const handleCouvertureUpload = async (url: string) => {
    if (!entreprise) return;
    try {
      const updated = await entreprisesApi.update(entreprise.id, {
        photoCouverture: url,
      } as any);
      setEntreprise(updated);
    } catch (error) {
      console.error("Erreur mise à jour couverture:", error);
    }
  };

  const handleAjouterProduit = async () => {
    if (!entreprise || !produitNom.trim()) return;

    setIsSaving(true);
    try {
      const updated = await entreprisesApi.ajouterProduit(entreprise.id, {
        nom: produitNom,
        prix: produitPrix || undefined,
        categorie: produitCategorie || undefined,
        image: produitImage || undefined,
      });
      setEntreprise(updated);

      setShowModalProduit(false);
      setProduitNom("");
      setProduitPrix("");
      setProduitCategorie("");
      setProduitImage(null);
    } catch (error) {
      console.error("Erreur ajout produit:", error);
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- ÉTATS DE CHARGEMENT ---------- */
  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col w-full gap-6">
          <div className="h-40 rounded-xl bg-surface-container-lowest animate-pulse" />
          <div className="h-96 rounded-xl bg-surface-container-lowest animate-pulse" />
        </div>
      </div>
    );
  }

  if (!entreprise) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center">
            <Icon name="domain" size={40} className="text-primary" />
          </div>
          <h1 className="text-headline-md text-primary">
            Aucune entreprise associée
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-md">
            Votre compte n&apos;est pas encore associé à une entreprise.
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- AFFICHAGE ---------- */
  // ✅ Cast en any pour éviter l'erreur "Property 'badges' does not exist"
  const mesBadges: any[] = (user as any)?.badges || [];

  const tabs = [
    { id: "general", label: "Informations générales" },
    { id: "documents", label: `Documents légaux (${documents.length})` },
    {
      id: "produits",
      label: `Produits (${entreprise.listeProduits?.length || 0})`,
    },
    { id: "badges", label: `Mes Badges FPD (${mesBadges.length})` },
  ] as const;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col w-full gap-6">
        {/* ============ EN-TÊTE ============ */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-surface-container-lowest shadow-sm border border-black/5">
          <div className="relative h-32 bg-gradient-to-r from-primary-container/20 via-surface-container-low to-secondary-container/20">
            <ImageUpload
              currentImage={entreprise.photoCouverture}
              categorie="couverture"
              onUploadSuccess={handleCouvertureUpload}
              aspectRatio="auto"
              label="Ajouter une photo de couverture"
              className="absolute inset-0 w-full h-full [&>div:first-child]:border-0 [&>div:first-child]:rounded-none [&>div:first-child]:bg-transparent [&>div:first-child]:hover:border-0"
            />
          </div>

          <div className="relative p-6 -mt-16 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              <div className="w-24 h-24 flex-shrink-0">
                <ImageUpload
                  currentImage={entreprise.logo}
                  categorie="logo"
                  onUploadSuccess={handleLogoUpload}
                  aspectRatio="square"
                  label="Logo"
                  className="w-24 h-24"
                />
              </div>

              <div className="flex flex-col gap-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-headline-lg text-primary tracking-tight">
                    {entreprise.raisonSociale}
                  </h1>
                  {entreprise.verifie && (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container text-label-sm font-semibold">
                      <Icon
                        name="verify"
                        size={16}
                        className="text-secondary"
                      />
                      <span>Vérifié</span>
                    </div>
                  )}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${
                      entreprise.statut === "ACTIF"
                        ? "bg-secondary-container/30 text-secondary"
                        : "bg-error-container/30 text-error"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        entreprise.statut === "ACTIF"
                          ? "bg-secondary"
                          : "bg-error"
                      }`}
                    ></span>
                    <span>
                      {entreprise.statut === "ACTIF"
                        ? "Compte Actif"
                        : "Suspendu"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
                  <span className="font-medium text-on-surface">
                    {entreprise.formeJuridique || "—"}
                  </span>
                  <span>•</span>
                  <span>{entreprise.secteur}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Icon
                      name="location"
                      size={16}
                      className="text-outline"
                    />
                    {entreprise.ville}
                  </span>
                  <span>•</span>
                  <span className="text-code-sm text-outline">
                    NIF : {entreprise.nif}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md transition-colors">
                <Icon name="edit" size={18} />
                <span>Modifier</span>
              </button>
              <button
                onClick={handleDownloadFiche}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-label-md shadow-sm transition-colors"
              >
                <Icon name="download" size={18} />
                <span>Fiche PDF</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 flex items-center gap-4 overflow-x-auto border-t border-black/5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as TabType)}
                className={`py-4 text-label-md font-semibold whitespace-nowrap border-b-2 transition-all ${
                  tab === t.id
                    ? "text-primary border-primary"
                    : "text-on-surface-variant border-transparent hover:text-on-surface"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============ TAB GÉNÉRAL ============ */}
        {tab === "general" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 flex flex-col gap-6">
              <div className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-sm border border-black/5 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Icon name="badge" size={22} className="text-primary" />
                    <h2 className="text-title-lg text-primary">
                      Identité de l&apos;entreprise
                    </h2>
                  </div>
                  <span className="text-code-sm px-2.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                    RCS Certifié
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      l: "Raison sociale",
                      v: entreprise.raisonSociale,
                      type: "text",
                    },
                    { l: "Sigle", v: entreprise.sigle || "—", type: "text" },
                    {
                      l: "Forme juridique",
                      v: entreprise.formeJuridique || "—",
                      type: "text",
                    },
                    { l: "NIF", v: entreprise.nif, type: "code" },
                    { l: "STAT", v: entreprise.stat || "—", type: "code" },
                    { l: "RCS", v: entreprise.rcs || "—", type: "code" },
                    {
                      l: "Date de constitution",
                      v: entreprise.anneeCreation
                        ? new Date(entreprise.anneeCreation).toLocaleDateString(
                            "fr-FR",
                          )
                        : "—",
                      type: "text",
                    },
                    {
                      l: "Catégorie",
                      v: entreprise.taille || "—",
                      type: "text",
                    },
                    {
                      l: "Effectif",
                      v: entreprise.effectif
                        ? `${entreprise.effectif} employés`
                        : "—",
                      type: "text",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-surface-container-low flex flex-col gap-1"
                    >
                      <span className="text-label-sm text-outline uppercase tracking-wider">
                        {item.l}
                      </span>
                      <span
                        className={
                          item.type === "code"
                            ? "text-code-sm text-primary font-semibold"
                            : "text-title-md text-on-surface"
                        }
                      >
                        {item.v}
                      </span>
                    </div>
                  ))}
                  <div className="md:col-span-2 p-2 rounded-lg bg-surface-container-low flex flex-col gap-1">
                    <span className="text-label-sm text-outline uppercase tracking-wider">
                      Secteur d&apos;activité
                    </span>
                    <span className="text-body-md text-on-surface font-medium">
                      {entreprise.secteur}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low flex flex-col gap-1">
                    <span className="text-label-sm text-outline uppercase tracking-wider">
                      Chiffre d&apos;affaires
                    </span>
                    <span className="text-title-md text-secondary font-bold">
                      {entreprise.chiffreAffaires
                        ? `${Number(entreprise.chiffreAffaires).toLocaleString("fr-FR")} MGA`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-sm border border-black/5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Icon
                    name="description"
                    size={22}
                    className="text-primary"
                  />
                  <h2 className="text-title-lg text-primary">Description</h2>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                  <p className="text-body-lg text-on-surface leading-relaxed">
                    {entreprise.description || "Description non disponible."}
                  </p>
                  {entreprise.motsCles && entreprise.motsCles.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {entreprise.motsCles.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full bg-surface-container text-label-sm text-on-surface-variant font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-sm border border-black/5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Icon name="user" size={22} className="text-primary" />
                  <h2 className="text-title-lg text-primary">Dirigeant</h2>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low">
                  <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-title-lg font-bold flex-shrink-0">
                    {getInitials(
                      `${entreprise.dirigeant?.prenom || user?.prenom || ""} ${entreprise.dirigeant?.nom || user?.nom || ""}`,
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-title-md text-on-surface font-semibold truncate">
                      {entreprise.dirigeant
                        ? `${entreprise.dirigeant.prenom} ${entreprise.dirigeant.nom}`
                        : `${user?.prenom} ${user?.nom}`}
                    </span>
                    <span className="text-label-md text-primary font-medium">
                      Dirigeant(e)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  {[
                    {
                      icon: "phone" as const,
                      l: "Téléphone",
                      v: entreprise.telephone || "—",
                    },
                    {
                      icon: "mail" as const,
                      l: "Email",
                      v: entreprise.email || "—",
                    },
                    {
                      icon: "globe" as const,
                      l: "Site web",
                      v: entreprise.siteWeb || "—",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low"
                    >
                      <Icon
                        name={item.icon}
                        size={20}
                        className="text-outline"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-label-sm text-outline">
                          {item.l}
                        </span>
                        <span className="text-body-md text-on-surface font-medium truncate">
                          {item.v}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-sm border border-black/5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Icon
                    name="location_city"
                    size={22}
                    className="text-primary"
                  />
                  <h2 className="text-title-lg text-primary">Siège social</h2>
                </div>
                <div className="flex items-start gap-2">
                  <Icon
                    name="location"
                    size={20}
                    className="text-primary-container mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-label-sm text-outline">Adresse</span>
                    <span className="text-body-md text-on-surface font-semibold">
                      {entreprise.adresse || "—"}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                      {entreprise.ville}, {entreprise.region}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ TAB DOCUMENTS ============ */}
        {tab === "documents" && (
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-sm border border-black/5 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Icon name="folder" size={24} className="text-primary" />
              <h2 className="text-title-lg text-primary">
                Documents légaux & Attestations
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-2">
              <Icon
                name="info"
                size={20}
                className="text-primary shrink-0 mt-0.5"
              />
              <div className="flex flex-col gap-1">
                <span className="text-label-md font-semibold text-on-surface">
                  Téléversez vos documents officiels
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  Cliquez sur chaque zone ci-dessous pour téléverser vos pièces
                  justificatives. Un agent consulaire les validera sous 48h.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <DocumentUpload
                categorie="NIF"
                entrepriseId={entreprise.id}
                label="Carte d'Immatriculation Fiscale (NIF)"
                description="Document officiel émis par la Direction Générale des Impôts"
                existingDoc={findDocByCategorie("NIF")}
                onUploadSuccess={(doc) =>
                  setDocuments((prev) => [doc, ...prev])
                }
                onDelete={(id) =>
                  setDocuments((prev) => prev.filter((d) => d.id !== id))
                }
                required
              />
              <DocumentUpload
                categorie="STAT"
                entrepriseId={entreprise.id}
                label="Carte Statistique (STAT)"
                description="Carte d'identification statistique INSTAT"
                existingDoc={findDocByCategorie("STAT")}
                onUploadSuccess={(doc) =>
                  setDocuments((prev) => [doc, ...prev])
                }
                onDelete={(id) =>
                  setDocuments((prev) => prev.filter((d) => d.id !== id))
                }
                required
              />
              <DocumentUpload
                categorie="RCS"
                entrepriseId={entreprise.id}
                label="Extrait RCS / Kbis"
                description="Extrait du Registre du Commerce et des Sociétés"
                existingDoc={findDocByCategorie("RCS")}
                onUploadSuccess={(doc) =>
                  setDocuments((prev) => [doc, ...prev])
                }
                onDelete={(id) =>
                  setDocuments((prev) => prev.filter((d) => d.id !== id))
                }
                required
              />
              <DocumentUpload
                categorie="CNaPS"
                entrepriseId={entreprise.id}
                label="Attestation CNaPS"
                description="Attestation de régularité sociale (optionnel)"
                existingDoc={findDocByCategorie("CNaPS")}
                onUploadSuccess={(doc) =>
                  setDocuments((prev) => [doc, ...prev])
                }
                onDelete={(id) =>
                  setDocuments((prev) => prev.filter((d) => d.id !== id))
                }
              />
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-black/5">
              <h3 className="text-title-md text-primary font-semibold">
                Mes documents ({documents.length})
              </h3>

              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <Icon
                    name="folder_open"
                    size={48}
                    className="text-outline mx-auto"
                  />
                  <p className="text-body-sm text-on-surface-variant mt-2">
                    Aucun document téléversé
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
                        <th className="py-3 px-4 rounded-l-lg">Document</th>
                        <th className="py-3 px-4">Catégorie</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right rounded-r-lg">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 text-body-sm text-on-surface">
                      {documents.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-surface-container-low/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-medium">
                            <div className="flex items-center gap-2">
                              <Icon
                                name={
                                  doc.typeMime?.includes("pdf")
                                    ? "description"
                                    : "image"
                                }
                                size={20}
                                className="text-primary-container"
                              />
                              <span className="truncate max-w-xs">
                                {doc.nom}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-code-sm font-medium">
                              {doc.categorie || "AUTRE"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            {new Date(doc.createdAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {doc.valide ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-semibold">
                                <Icon name="check" size={14} />
                                Validé
                              </span>
                            ) : doc.motifRejet ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-label-sm font-semibold w-fit">
                                  <Icon name="alert" size={14} />
                                  Rejeté
                                </span>
                                <span className="text-body-sm text-error max-w-xs truncate">
                                  {doc.motifRejet}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-semibold">
                                <Icon name="schedule" size={14} />
                                En attente
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <a
                              href={getImageUrl(doc.chemin) || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary text-label-sm font-medium transition-colors"
                            >
                              <Icon name="download" size={16} />
                              <span>Voir</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ TAB PRODUITS ============ */}
        {tab === "produits" && (
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-sm border border-black/5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div className="flex items-center gap-2">
                <Icon name="inventory" size={24} className="text-primary" />
                <h2 className="text-title-lg text-primary">
                  Produits & Productions
                </h2>
              </div>
              <button
                onClick={() => setShowModalProduit(true)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary-container text-on-primary text-label-md hover:bg-primary transition-colors shadow-sm"
              >
                <Icon name="plus" size={18} />
                <span>Ajouter un produit</span>
              </button>
            </div>

            {!entreprise.listeProduits ||
            entreprise.listeProduits.length === 0 ? (
              <div className="text-center py-16">
                <Icon
                  name="inventory"
                  size={60}
                  className="text-outline mx-auto"
                />
                <p className="text-body-md text-on-surface-variant mt-3">
                  Aucun produit enregistré
                </p>
                <p className="text-body-sm text-outline mt-1">
                  Présentez vos produits pour attirer plus de clients
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entreprise.listeProduits.map((p: Produit, i: number) => (
                  <div
                    key={i}
                    className="rounded-xl bg-surface-container-low flex flex-col overflow-hidden"
                  >
                    {p.image ? (
                      <img
                        src={getImageUrl(p.image) || ""}
                        alt={p.nom}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-surface-container flex items-center justify-center">
                        <Icon
                          name="inventory"
                          size={60}
                          className="text-outline"
                        />
                      </div>
                    )}
                    <div className="p-4 flex flex-col gap-2">
                      <span className="text-label-sm text-outline uppercase">
                        {p.categorie || "Produit"}
                      </span>
                      <h3 className="text-title-md text-on-surface">{p.nom}</h3>
                      {p.prix && (
                        <span className="text-title-lg text-primary font-bold">
                          {p.prix}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ TAB BADGES FPD ============ */}
        {tab === "badges" && (
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-sm border border-black/5 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Icon name="workspace_premium" size={24} className="text-amber-500" />
              <h2 className="text-title-lg text-primary">
                Mes Badges FPD
              </h2>
            </div>

            {mesBadges.length === 0 ? (
              <div className="text-center py-16 bg-surface-container-low/50 rounded-xl border border-black/5">
                <Icon
                  name="workspace_premium"
                  size={60}
                  className="text-outline mx-auto opacity-50"
                />
                <p className="text-title-md text-on-surface-variant font-medium mt-3">
                  Aucun badge obtenu
                </p>
                <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
                  Terminez vos formations FPD et faites-les valider par votre mentor pour obtenir vos badges ici.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mesBadges.map((badge, index) => (
                  <div 
                    key={index} 
                    className="p-6 rounded-[1.5rem] bg-gradient-to-br from-primary/5 to-surface-container-lowest border border-black/5 shadow-sm flex flex-col gap-4 relative overflow-hidden"
                  >
                    {/* Fioriture décorative en fond */}
                    <div className="absolute -right-6 -top-6 text-primary/5">
                      <Icon name="workspace_premium" size={120} />
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 z-10 shadow-sm">
                      <Icon name="workspace_premium" size={28} />
                    </div>

                    <div className="flex flex-col z-10">
                      <span className="text-title-lg font-bold text-primary leading-tight">
                        {badge.titre || "Badge FPD"}
                      </span>
                      <span className="text-body-sm text-on-surface-variant font-medium mt-1 line-clamp-2">
                        {badge.session || "Formation Professionnelle Duale"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2 z-10 bg-surface-container-lowest/60 p-3 rounded-xl border border-black/5">
                      <span className="text-label-sm text-outline font-medium flex items-center gap-1.5">
                        <Icon name="calendar" size={14} />
                        Obtenu le {badge.date ? new Date(badge.date).toLocaleDateString("fr-FR") : "—"}
                      </span>
                      {badge.mentor && (
                        <span className="text-label-sm text-outline font-medium flex items-center gap-1.5">
                          <Icon name="user" size={14} />
                          Validé par {badge.mentor}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        generateCertificatFPD({
                          ...badge,
                          session: { nom: badge.session },
                          prenom: user?.prenom,
                          nom: user?.nom,
                        });
                      }}
                      className="mt-auto w-full py-2.5 rounded-xl bg-surface-container hover:bg-primary/10 text-primary text-label-md font-bold transition-colors flex items-center justify-center gap-2 z-10 border border-primary/10 shadow-sm"
                    >
                      <Icon name="download" size={18} /> Télécharger le certificat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ MODAL AJOUT PRODUIT ============ */}
        {showModalProduit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-[1.5rem] shadow-xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-title-lg text-primary">Nouveau produit</h2>
                <button
                  onClick={() => setShowModalProduit(false)}
                  className="p-2 rounded-lg text-outline hover:bg-surface-container transition-colors"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              <ImageUpload
                currentImage={produitImage}
                categorie="produit"
                onUploadSuccess={(url) => setProduitImage(url)}
                aspectRatio="wide"
                label="Ajouter une image du produit"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-semibold text-on-surface">
                  Nom du produit *
                </label>
                <input
                  value={produitNom}
                  onChange={(e) => setProduitNom(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="Ex: Étole Landy Betsileo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-md font-semibold text-on-surface">
                    Prix
                  </label>
                  <input
                    value={produitPrix}
                    onChange={(e) => setProduitPrix(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                    placeholder="Ex: 180 000 MGA"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-md font-semibold text-on-surface">
                    Catégorie
                  </label>
                  <input
                    value={produitCategorie}
                    onChange={(e) => setProduitCategorie(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                    placeholder="Ex: Artisanat"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowModalProduit(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md hover:bg-surface-container-high transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAjouterProduit}
                  disabled={isSaving || !produitNom.trim()}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
                >
                  {isSaving ? (
                    <>
                      <Icon
                        name="refresh"
                        size={18}
                        className="animate-spin"
                      />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={18} />
                      <span>Ajouter</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}