"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import {
  entreprisesApi,
  diagnosticsApi,
  conversationsApi,
  notificationsApi,
  demandesApi,
  getImageUrl,
  Entreprise,
  Diagnostic,
  Conversation,
} from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

export default function DashboardDirigeantPage() {
  const { user } = useAuth();

  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [dernierDiagnostic, setDernierDiagnostic] = useState<Diagnostic | null>(
    null,
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [nbNonLues, setNbNonLues] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  /* ==== Modal RDV ==== */
  const [showModalRdv, setShowModalRdv] = useState(false);
  const [rdvTitre, setRdvTitre] = useState("");
  const [rdvDescription, setRdvDescription] = useState("");
  const [rdvDate, setRdvDate] = useState("");
  const [isSubmittingRdv, setIsSubmittingRdv] = useState(false);

  /* ==== Modal Plan d'action ==== */
  const [showModalPlan, setShowModalPlan] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [entRes, diagRes, convRes, notifRes] = await Promise.allSettled([
          entreprisesApi.getMyEntreprise(),
          diagnosticsApi.getMesDiagnostics({ limit: 1 }),
          conversationsApi.getMesConversations({ limit: 1 }),
          notificationsApi.getCountNonLues(),
        ]);

        if (entRes.status === "fulfilled") setEntreprise(entRes.value);
        if (diagRes.status === "fulfilled" && diagRes.value.data.length > 0) {
          setDernierDiagnostic(diagRes.value.data[0]);
        }
        if (convRes.status === "fulfilled") setConversations(convRes.value.data);
        if (notifRes.status === "fulfilled") setNbNonLues(notifRes.value.count);
      } catch (error) {
        console.error("Erreur dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const getInitials = (text: string) =>
    text
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  /* ==== Actions ==== */

  // 1. Ouvrir modal RDV
  const handleOuvrirRdv = () => {
    setRdvTitre("");
    setRdvDescription("");
    setRdvDate("");
    setShowModalRdv(true);
  };

  // 2. Envoyer la demande de RDV
  const handleEnvoyerRdv = async () => {
    if (!rdvTitre.trim() || !rdvDescription.trim() || !rdvDate) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    setIsSubmittingRdv(true);
    try {
      await demandesApi.createRdv({
        titre: rdvTitre,
        description: rdvDescription,
        dateSouhaitee: rdvDate,
      });
      setShowModalRdv(false);
      alert(
        "✅ Demande de rendez-vous envoyée à la CCI. Vous recevrez une confirmation.",
      );
    } catch (error: any) {
      alert("Erreur : " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmittingRdv(false);
    }
  };

  // 3. Ouvrir modal Plan d'action
  const handleOuvrirPlan = () => {
    if (!dernierDiagnostic) {
      alert(
        "Veuillez d'abord réaliser un diagnostic pour générer votre plan d'action.",
      );
      return;
    }
    setShowModalPlan(true);
  };

  if (!isLoading && !entreprise) {
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
            Veuillez contacter l&apos;administrateur CCI.
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

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col w-full gap-6">
          <div className="h-64 rounded-xl bg-surface-container-lowest animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-80 rounded-xl bg-surface-container-lowest animate-pulse" />
            <div className="h-80 rounded-xl bg-surface-container-lowest animate-pulse" />
            <div className="h-80 rounded-xl bg-surface-container-lowest animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const mentorPhoto = getImageUrl(entreprise?.mentor?.photoProfil);

  /* Récupérer les recommandations du dernier diagnostic */
  const recommandations = dernierDiagnostic?.recommandations || [];
  const actionsPrioritaires = Array.isArray(recommandations)
    ? recommandations
    : [];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col w-full gap-6">
        {/* ============ BANNIÈRE HERO ============ */}
        <section className="relative overflow-hidden rounded-xl shadow-sm">
          <div className="relative w-full h-48 sm:h-56 lg:h-64">
            <Image
              src="/images/hero-dashboard.jpg"
              alt="Espace PME CCI Haute Matsiatra"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-transparent"></div>
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "url('/images/pattern-bg.png')",
                backgroundSize: "300px",
                backgroundRepeat: "repeat",
              }}
            ></div>

            <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-1">
                <span className="text-code-sm text-primary-fixed tracking-wider uppercase">
                  Espace Membre Adhérent
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-fixed"></span>
                <span className="text-label-sm text-secondary-fixed font-semibold">
                  Exercice 2026
                </span>
              </div>
              <h1 className="text-headline-lg sm:text-headline-xl text-on-primary tracking-tight">
                Bonjour, {entreprise?.raisonSociale}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-primary-fixed">
                <span className="text-code-sm bg-on-primary/10 backdrop-blur-sm px-2 py-0.5 rounded text-on-primary">
                  NIF : {entreprise?.nif}
                </span>
                <span className="text-on-primary/60">•</span>
                <span className="text-on-primary/90">
                  Secteur : {entreprise?.secteur}
                </span>
                <span className="text-on-primary/60">•</span>
                <span className="text-on-primary/90">{entreprise?.ville}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CARTE MENTOR + RDV ============ */}
        <section className="rounded-xl bg-surface-container-lowest p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {entreprise?.mentor ? (
                <>
                  {mentorPhoto ? (
                    <img
                      src={mentorPhoto}
                      alt="Mentor"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-semibold">
                      {getInitials(
                        `${entreprise.mentor.prenom} ${entreprise.mentor.nom}`,
                      )}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-label-sm text-secondary font-semibold uppercase tracking-wider">
                      Mentor Consulaire Attitré
                    </span>
                    <span className="text-title-md text-on-surface font-semibold">
                      {entreprise.mentor.prenom} {entreprise.mentor.nom}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                      {entreprise.mentor.domaineMentor || "Expert consulaire"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-tertiary-fixed text-on-tertiary-container flex items-center justify-center">
                    <Icon name="user" size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-label-sm text-on-tertiary-fixed-variant uppercase tracking-wider font-semibold">
                      Aucun mentor assigné
                    </span>
                    <Link
                      href="/pme/mentorat"
                      className="text-title-md text-primary font-semibold hover:underline"
                    >
                      Demander un mentorat
                    </Link>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleOuvrirRdv}
              className="inline-flex items-center gap-1 px-4 py-2.5 bg-primary-container text-on-primary rounded-xl text-label-md hover:bg-primary transition-all shadow-sm w-full sm:w-auto justify-center"
            >
              <Icon name="calendar" size={20} />
              <span>Rendez-vous</span>
            </button>
          </div>
        </section>

        {/* ============ CARTES PRINCIPALES ============ */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* DIAGNOSTIC */}
          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-outline uppercase tracking-wider font-semibold">
                  Audit Consulaire
                </span>
                {dernierDiagnostic && (
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-semibold">
                    {dernierDiagnostic.reference?.slice(-8) || "N/A"}
                  </span>
                )}
              </div>
              <h2 className="text-title-lg text-primary">
                Dernier Diagnostic 360
              </h2>
              {dernierDiagnostic ? (
                <>
                  <p className="text-body-sm text-on-surface-variant">
                    Évaluation réalisée le{" "}
                    {new Date(dernierDiagnostic.createdAt).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                  <div className="flex items-center justify-between my-2 p-4 bg-surface-container-low rounded-xl">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-headline-xl text-primary font-bold">
                          {dernierDiagnostic.scoreGlobal}
                        </span>
                        <span className="text-title-md text-outline">/100</span>
                      </div>
                      <span className="text-code-sm text-on-surface-variant mt-1">
                        Niveau : {dernierDiagnostic.niveau}
                      </span>
                    </div>
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-surface-container-highest"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        />
                        <path
                          className="text-primary-container"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray={`${dernierDiagnostic.scoreGlobal}, 100`}
                          strokeLinecap="round"
                          strokeWidth="3.5"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon
                          name="chart"
                          size={24}
                          className="text-primary-container"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-body-sm text-on-surface-variant">
                    Vous n&apos;avez pas encore réalisé de diagnostic.
                  </p>
                  <div className="p-4 bg-surface-container-low rounded-xl text-center">
                    <Icon
                      name="assessment"
                      size={40}
                      className="text-outline mx-auto"
                    />
                    <p className="text-body-sm text-on-surface-variant mt-2">
                      Aucun diagnostic enregistré
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="pt-4">
              <Link
                href="/pme/diagnostic/questionnaire"
                className="w-full inline-flex items-center justify-center gap-1 py-2 px-4 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl text-label-md transition-colors"
              >
                <span>
                  {dernierDiagnostic
                    ? "Voir l'analyse complète"
                    : "Démarrer un diagnostic"}
                </span>
                <Icon name="arrow-right" size={18} />
              </Link>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-outline uppercase tracking-wider font-semibold">
                  Plan d&apos;action
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-label-sm font-semibold">
                  {actionsPrioritaires.length} action
                  {actionsPrioritaires.length > 1 ? "s" : ""}
                </span>
              </div>
              <h2 className="text-title-lg text-primary">
                Actions prioritaires
              </h2>
              {actionsPrioritaires.length > 0 ? (
                <div className="flex flex-col gap-2 my-1">
                  {actionsPrioritaires
                    .slice(0, 3)
                    .map((reco: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-surface-container-low rounded-xl flex items-start gap-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary flex items-center justify-center text-label-sm font-semibold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-label-md font-semibold text-on-surface truncate">
                            {reco.titre || reco.axe || "Action"}
                          </span>
                          {reco.priorite && (
                            <span className="text-code-sm text-outline">
                              Priorité {reco.priorite}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  {actionsPrioritaires.length > 3 && (
                    <span className="text-code-sm text-outline text-center">
                      + {actionsPrioritaires.length - 3} autre(s)
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-surface-container-low rounded-xl text-center my-2">
                  <Icon
                    name="lightbulb"
                    size={40}
                    className="text-outline mx-auto"
                  />
                  <p className="text-body-sm text-on-surface-variant mt-2">
                    Aucune action en cours
                  </p>
                </div>
              )}
            </div>
            <div className="pt-4">
              <button
                onClick={handleOuvrirPlan}
                className="w-full inline-flex items-center justify-center gap-1 py-2 px-4 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl text-label-md transition-colors"
              >
                <Icon name="plus" size={18} />
                <span>Gérer le plan d&apos;action</span>
              </button>
            </div>
          </div>

          {/* MESSAGERIE */}
          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-outline uppercase tracking-wider font-semibold">
                  Canal Privilégié
                </span>
                {nbNonLues > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-label-sm font-semibold flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-error animate-pulse"></span>
                    {nbNonLues} non lus
                  </span>
                )}
              </div>
              <h2 className="text-title-lg text-primary">
                Messagerie & Mentorat
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Échanges directs avec votre tuteur économique accrédité.
              </p>
              {conversations.length > 0 ? (
                <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[12px] font-bold">
                        {getInitials(
                          conversations[0].destinataire
                            ? `${conversations[0].destinataire.prenom} ${conversations[0].destinataire.nom}`
                            : "CCI",
                        )}
                      </div>
                      <span className="text-title-md text-on-surface truncate">
                        {conversations[0].destinataire
                          ? `${conversations[0].destinataire.prenom} ${conversations[0].destinataire.nom}`
                          : "Conversation"}
                      </span>
                    </div>
                    {conversations[0].dernierMessageAt && (
                      <span className="text-code-sm text-outline">
                        {new Date(
                          conversations[0].dernierMessageAt,
                        ).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                  <div className="p-2 bg-surface-container-lowest rounded-lg text-body-sm text-on-surface-variant italic line-clamp-2">
                    &quot;
                    {conversations[0].dernierMessage || "Aucun message"}
                    &quot;
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-surface-container-low rounded-xl text-center">
                  <Icon name="chat" size={40} className="text-outline mx-auto" />
                  <p className="text-body-sm text-on-surface-variant mt-2">
                    Aucune conversation
                  </p>
                </div>
              )}
            </div>
            <div className="pt-4 flex items-center gap-2">
              <Link
                href="/pme/messages"
                className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-4 bg-primary-container hover:bg-primary text-on-primary rounded-xl text-label-md transition-colors shadow-sm"
              >
                <Icon name="chat" size={18} />
                <span>Ouvrir la messagerie</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ============ MUR D'ACTUALITÉS ============ */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-code-sm text-outline uppercase tracking-wider">
                  Flux Régional
                </span>
                <h2 className="text-headline-md text-primary">
                  Mur d&apos;actualités
                </h2>
              </div>
              <Link
                href="/pme/mur"
                className="inline-flex items-center gap-1 text-label-md text-primary font-semibold"
              >
                <span>Voir tout</span>
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>

            <article className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold">
                  CCI
                </div>
                <div className="flex flex-col">
                  <span className="text-title-md text-primary">
                    Chambre de Commerce et d&apos;Industrie
                  </span>
                  <span className="text-code-sm text-outline">
                    Message officiel
                  </span>
                </div>
              </div>
              <div className="text-body-md text-on-surface">
                <p>
                  Bienvenue {user?.prenom} {user?.nom} sur la plateforme
                  d&apos;accompagnement des PME de la CCI Haute Matsiatra —
                  Exercice 2026. Votre espace vous permet de réaliser vos
                  diagnostics, de suivre vos actions et d&apos;échanger avec
                  votre mentor.
                </p>
                <p className="text-on-surface-variant mt-2">
                  N&apos;hésitez pas à contacter votre conseiller pour toute
                  question.
                </p>
              </div>
            </article>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-title-lg text-primary">
                Services Consulaires Rapides
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  {
                    icon: "handshake",
                    title: "Bourse de Partenariat",
                    href: "/pme/mur",
                  },
                  {
                    icon: "mentor",
                    title: "Mon Mentorat",
                    href: "/pme/mentorat",
                  },
                  { icon: "badge", title: "Mon Profil", href: "/pme/profil" },
                  {
                    icon: "assessment",
                    title: "Nouveau Diagnostic",
                    href: "/pme/diagnostic/questionnaire",
                  },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary flex-shrink-0">
                      <Icon name={item.icon as any} size={20} />
                    </div>
                    <span className="text-label-md text-on-surface font-semibold flex-1">
                      {item.title}
                    </span>
                    <Icon
                      name="chevron-right"
                      size={18}
                      className="text-outline"
                    />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-primary text-on-primary p-6 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">
                  Permanence Consulaire
                </span>
                <Icon name="help" size={20} className="text-primary-fixed" />
              </div>
              <h3 className="text-title-lg">
                Besoin d&apos;un accompagnement ?
              </h3>
              <p className="text-body-sm text-surface-variant">
                Le Guichet Unique vous reçoit du lundi au vendredi de 8h à 16h.
              </p>
              <div className="flex flex-col gap-1 text-body-sm mt-1">
                <span className="flex items-center gap-2">
                  <Icon name="phone" size={16} className="text-primary-fixed" />
                  +261 (0)20 75 512 34
                </span>
                <span className="flex items-center gap-2">
                  <Icon name="mail" size={16} className="text-primary-fixed" />
                  appui-pme@cci-matsiatra.mg
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================
          MODAL RENDEZ-VOUS
          ============================================ */}
      {showModalRdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-title-lg text-primary">
                  Demander un rendez-vous
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Un agent consulaire vous contactera pour confirmer
                </p>
              </div>
              <button
                onClick={() => setShowModalRdv(false)}
                className="p-2 rounded-lg text-outline hover:bg-surface-container transition-colors"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">
                Objet du rendez-vous *
              </label>
              <input
                type="text"
                value={rdvTitre}
                onChange={(e) => setRdvTitre(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="Ex: Validation de dossier, accompagnement export…"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">
                Description *
              </label>
              <textarea
                value={rdvDescription}
                onChange={(e) => setRdvDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-outline"
                placeholder="Précisez le motif et les points à aborder…"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">
                Date souhaitée *
              </label>
              <input
                type="datetime-local"
                value={rdvDate}
                onChange={(e) => setRdvDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModalRdv(false)}
                className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md hover:bg-surface-container-high transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleEnvoyerRdv}
                disabled={isSubmittingRdv}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
              >
                {isSubmittingRdv ? (
                  <>
                    <Icon name="refresh" size={18} className="animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <Icon name="send" size={18} />
                    <span>Envoyer la demande</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL PLAN D'ACTION
          ============================================ */}
      {showModalPlan && dernierDiagnostic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-surface-container-lowest rounded-xl shadow-xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-title-lg text-primary">
                  Plan d&apos;action
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Recommandations issues du diagnostic{" "}
                  {dernierDiagnostic.reference}
                </p>
              </div>
              <button
                onClick={() => setShowModalPlan(false)}
                className="p-2 rounded-lg text-outline hover:bg-surface-container transition-colors"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-label-sm text-outline uppercase">
                  Score global
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-headline-lg text-primary font-bold">
                    {dernierDiagnostic.scoreGlobal}
                  </span>
                  <span className="text-title-md text-outline">/100</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-semibold">
                    {dernierDiagnostic.niveau}
                  </span>
                </div>
              </div>
              <Link
                href={`/pme/diagnostic/resultat?id=${dernierDiagnostic.id}`}
                className="text-label-md text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Voir le rapport</span>
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>

            {actionsPrioritaires.length > 0 ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-title-md text-primary font-semibold">
                  {actionsPrioritaires.length} action
                  {actionsPrioritaires.length > 1 ? "s" : ""} recommandée
                  {actionsPrioritaires.length > 1 ? "s" : ""}
                </h3>
                {actionsPrioritaires.map((reco: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-label-sm font-semibold uppercase tracking-wider text-outline">
                          {reco.axe || "Action"}
                        </span>
                        {reco.priorite && (
                          <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-label-sm font-bold">
                            Priorité {reco.priorite}
                          </span>
                        )}
                        {reco.impact && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary text-label-sm">
                            Impact {reco.impact}
                          </span>
                        )}
                      </div>
                      <h4 className="text-title-md text-on-surface font-semibold">
                        {reco.titre}
                      </h4>
                      <p className="text-body-sm text-on-surface-variant">
                        {reco.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Icon
                  name="lightbulb"
                  size={48}
                  className="text-outline mx-auto"
                />
                <p className="text-body-md text-on-surface-variant mt-3">
                  Aucune recommandation disponible
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModalPlan(false)}
                className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md hover:bg-surface-container-high transition-colors"
              >
                Fermer
              </button>
              <Link
                href="/pme/mentorat"
                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors flex items-center gap-1"
              >
                <Icon name="mentor" size={18} />
                <span>Demander un mentorat</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}