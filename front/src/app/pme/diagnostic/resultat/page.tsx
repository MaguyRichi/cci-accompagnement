"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  diagnosticsApi,
  Diagnostic,
  ComparaisonDiagnostic,
} from "@/lib/api-services";
import { generateRapportDiagnosticPDF } from "@/lib/pdf";
import Icon from "@/components/ui/Icon";

function ResultatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const diagnosticId = searchParams.get("id");

  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [comparaison, setComparaison] = useState<ComparaisonDiagnostic | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!diagnosticId) {
      router.push("/pme/diagnostic/questionnaire");
      return;
    }
    const loadData = async () => {
      try {
        const [diag, comp] = await Promise.allSettled([
          diagnosticsApi.getById(Number(diagnosticId)),
          diagnosticsApi.comparer(Number(diagnosticId)),
        ]);
        if (diag.status === "fulfilled") setDiagnostic(diag.value);
        if (comp.status === "fulfilled") setComparaison(comp.value);
      } catch (error) {
        console.error("Erreur résultat:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [diagnosticId, router]);

  const handleDownloadPDF = () => {
    if (!diagnostic) return;
    generateRapportDiagnosticPDF(diagnostic);
  };

  const getNiveauColor = (niveau?: string) => {
    switch (niveau) {
      case "DEBUTANT":
        return {
          bg: "bg-error-container",
          text: "text-on-error-container",
          label: "Débutant",
        };
      case "INTERMEDIAIRE":
        return {
          bg: "bg-primary-fixed",
          text: "text-on-primary-fixed",
          label: "Intermédiaire",
        };
      case "AVANCE":
        return {
          bg: "bg-secondary-container",
          text: "text-on-secondary-container",
          label: "Avancé",
        };
      case "EXCELLENCE":
        return {
          bg: "bg-tertiary-fixed",
          text: "text-on-tertiary-fixed",
          label: "Excellence",
        };
      default:
        return {
          bg: "bg-surface-container",
          text: "text-on-surface-variant",
          label: "—",
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-secondary";
    if (score >= 70) return "text-primary";
    if (score >= 50) return "text-on-tertiary-container";
    return "text-error";
  };

  if (isLoading) {
    return (
      <div className="w-full px-8 py-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col gap-6">
          <div className="h-40 rounded-xl bg-surface-container-lowest animate-pulse" />
          <div className="h-96 rounded-xl bg-surface-container-lowest animate-pulse" />
        </div>
      </div>
    );
  }

  if (!diagnostic) {
    return (
      <div className="w-full px-8 py-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Icon name="alert" size={48} className="text-primary" />
          <h1 className="text-headline-md text-primary">
            Diagnostic introuvable
          </h1>
          <Link
            href="/pme/diagnostic/questionnaire"
            className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold"
          >
            Démarrer un diagnostic
          </Link>
        </div>
      </div>
    );
  }

  const niveauInfo = getNiveauColor(diagnostic.niveau);
  const scores = diagnostic.scoresParCategorie || {};
  const axes = Object.entries(scores);

  return (
    <div className="w-full px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col w-full gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary text-label-sm font-semibold">
                REF: {diagnostic.reference}
              </span>
              <span className="text-outline text-label-sm">•</span>
              <span className="text-on-surface-variant text-label-sm">
                {new Date(diagnostic.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-headline-xl text-primary tracking-tight">
              Résultat du diagnostic de maturité
            </h1>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Icon name="verify" size={20} className="text-secondary" />
              <span className="text-title-md text-on-surface">
                {diagnostic.entreprise?.raisonSociale || "Votre entreprise"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/pme/diagnostic/questionnaire"
              className="h-10 px-4 rounded-xl bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-high text-label-md flex items-center gap-1"
            >
              <Icon name="refresh" size={18} />
              <span>Nouveau diagnostic</span>
            </Link>
            <button
              onClick={handleDownloadPDF}
              className="h-10 px-4 rounded-xl bg-primary-container text-on-primary shadow-sm hover:bg-primary text-label-md flex items-center gap-1"
            >
              <Icon name="download" size={18} />
              <span>Télécharger PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-surface-container-low rounded-full pointer-events-none"></div>
            <div className="flex flex-col gap-4 relative z-10">
              <span className="text-label-sm uppercase tracking-wider text-outline font-semibold">
                Indice Consulaire 360°
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span
                  className={`text-[64px] leading-none font-bold tracking-tight ${getScoreColor(diagnostic.scoreGlobal)}`}
                >
                  {diagnostic.scoreGlobal}
                </span>
                <span className="text-headline-md text-outline">/ 100</span>
              </div>
              <div
                className={`inline-flex items-center px-2 py-1 rounded-lg self-start ${niveauInfo.bg} ${niveauInfo.text}`}
              >
                <span className="text-label-md font-semibold">
                  Niveau : {niveauInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <h2 className="text-title-lg text-primary mb-4">
              Cartographie des axes stratégiques
            </h2>
            <div className="flex flex-col gap-4">
              {axes.map(([cat, score]) => (
                <div key={cat} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-label-sm">
                    <span className="text-on-surface font-medium">{cat}</span>
                    <span className="font-semibold text-on-surface">
                      {Number(score).toFixed(1)} / 100
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        score >= 85
                          ? "bg-secondary"
                          : score >= 70
                            ? "bg-primary-container"
                            : score >= 50
                              ? "bg-on-tertiary-container"
                              : "bg-error"
                      }`}
                      style={{ width: `${Math.min(Number(score), 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {diagnostic.recommandations &&
          diagnostic.recommandations.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-headline-lg text-primary tracking-tight">
                Plan de recommandations prioritaires
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnostic.recommandations.map((reco: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                        <Icon name="lightbulb" size={20} />
                      </div>
                      <span className="text-label-sm font-semibold uppercase tracking-wider text-outline">
                        {reco.axe || "Recommandation"}
                      </span>
                    </div>
                    <h3 className="text-title-lg text-on-surface font-semibold">
                      {reco.titre}
                    </h3>
                    <p className="text-body-md text-on-surface-variant">
                      {reco.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        <div className="bg-primary text-on-primary rounded-xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 max-w-2xl">
            <div className="flex items-center gap-1 text-primary-fixed">
              <Icon name="verify" size={20} />
              <span className="text-label-sm font-semibold tracking-wider uppercase">
                Accompagnement Personnalisé
              </span>
            </div>
            <h3 className="text-headline-md font-bold tracking-tight">
              Validez votre feuille de route avec votre conseiller
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
            <Link
              href="/pme/mentorat"
              className="h-11 px-4 rounded-xl bg-surface-container-lowest text-primary text-label-md font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <Icon name="mentor" size={18} />
              <span>Demander un mentorat</span>
            </Link>
            <Link
              href="/pme/dashboard"
              className="h-11 px-4 rounded-xl bg-surface-container-high text-on-primary-container text-label-md font-semibold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1"
            >
              <Icon name="dashboard" size={18} />
              <span>Retour au dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultatPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-8 py-6 max-w-[1440px] mx-auto">
          <div className="h-96 rounded-xl bg-surface-container-lowest animate-pulse" />
        </div>
      }
    >
      <ResultatContent />
    </Suspense>
  );
}