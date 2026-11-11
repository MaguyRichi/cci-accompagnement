"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  entreprisesApi,
  diagnosticsApi,
  Entreprise,
  QuestionDiagnostic,
  Diagnostic,
} from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

export default function QuestionnairePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [questions, setQuestions] = useState<QuestionDiagnostic[]>([]);
  const [reponses, setReponses] = useState<Record<number, any>>({});
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [ent, qs] = await Promise.all([
          entreprisesApi.getMyEntreprise(),
          diagnosticsApi.getQuestions(),
        ]);
        setEntreprise(ent);
        setQuestions(qs);
        // ✅ LOG TEMPORAIRE POUR DIAGNOSTIC
        console.log("Questions reçues:", qs);
        if (ent) {
          try {
            const diag = await diagnosticsApi.create({
              entrepriseId: ent.id,
              autoEvaluation: false,
            });
            setDiagnostic(diag);
          } catch (err) {
            console.error("Erreur création diagnostic:", err);
          }
        }
      } catch (error) {
        console.error("Erreur chargement:", error);
        setError("Impossible de charger le questionnaire");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const setReponse = (questionId: number, valeur: any) => {
    setReponses((prev) => ({ ...prev, [questionId]: valeur }));
  };

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const currentReponse = currentQuestion ? reponses[currentQuestion.id] : null;
  const canGoNext = currentReponse !== undefined && currentReponse !== null;
  const isLast = currentIndex === total - 1;

  const handleSubmit = async () => {
    if (!diagnostic) return;
    const manquantes = questions.filter(
      (q) => reponses[q.id] === undefined && q.obligatoire,
    );
    if (manquantes.length > 0) {
      setError(
        `Veuillez répondre à toutes les questions (${manquantes.length} restantes)`,
      );
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await diagnosticsApi.submit(diagnostic.id, { reponses });
      router.push(`/pme/diagnostic/resultat?id=${diagnostic.id}`);
    } catch (err: any) {
      setError("Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full px-8 py-6 max-w-[1440px] mx-auto">
        <div className="max-w-[880px] mx-auto flex flex-col gap-6">
          <div className="h-32 rounded-xl bg-surface-container-lowest animate-pulse" />
          <div className="h-96 rounded-xl bg-surface-container-lowest animate-pulse" />
        </div>
      </div>
    );
  }

  if (!entreprise) {
    return (
      <div className="w-full px-8 py-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Icon name="domain" size={48} className="text-primary" />
          <h1 className="text-headline-md text-primary">
            Aucune entreprise associée
          </h1>
          <Link
            href="/pme/dashboard"
            className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold"
          >
            Retour
          </Link>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="w-full px-8 py-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Icon name="assessment" size={48} className="text-primary" />
          <h1 className="text-headline-md text-primary">
            Aucune question disponible
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-8 py-6 max-w-[1440px] mx-auto">
      <div className="max-w-[880px] w-full mx-auto pb-10 flex flex-col gap-6">
        <header className="flex flex-col gap-1 pt-2">
          <nav className="flex items-center gap-1 text-label-sm text-outline">
            <Link href="/pme/dashboard" className="hover:text-primary">
              Dashboard
            </Link>
            <Icon name="chevron-right" size={14} />
            <span className="text-on-surface font-medium">
              Diagnostic 360°
            </span>
          </nav>
          <div className="flex items-center gap-1 mb-1">
            <span className="bg-primary-container text-on-primary text-label-sm px-2.5 py-0.5 rounded-full font-medium tracking-wide inline-flex items-center gap-1">
              <Icon name="verify" size={14} />
              Procédure Réglementaire
            </span>
            {diagnostic && (
              <span className="text-code-sm text-outline">
                Réf: {diagnostic.reference}
              </span>
            )}
          </div>
          <h1 className="text-headline-lg text-primary tracking-tight">
            Diagnostic de maturité
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-2xl mt-1">
            Évaluation stratégique certifiée CCI Haute Matsiatra — Exercice 2026
          </p>
        </header>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-error-container text-on-error-container">
            <Icon name="alert" size={20} className="shrink-0 mt-0.5" />
            <span className="text-body-sm">{error}</span>
          </div>
        )}

        <section className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary text-label-sm font-semibold">
                {currentIndex + 1}
              </span>
              <span className="text-title-md text-primary font-semibold">
                Question {currentIndex + 1} sur {total}
              </span>
            </div>
            <span className="text-code-sm font-semibold text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary-container h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-code-sm text-outline">
            <span>
              {Object.keys(reponses).length} / {total} répondues
            </span>
            <span>Catégorie : {currentQuestion?.categorie || "—"}</span>
          </div>
        </section>

        {currentQuestion && (
          <div className="bg-surface-container-lowest p-6 md:p-10 rounded-xl shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-container-low">
              <Icon name="chart" size={20} className="text-primary" />
              <span className="text-label-sm uppercase tracking-wider text-primary font-semibold">
                {currentQuestion.categorie}
              </span>
            </div>

            <fieldset className="flex flex-col gap-4">
              <legend className="text-title-lg text-primary flex items-start gap-2">
                <span className="w-6 h-6 rounded-md bg-surface-container text-primary text-code-sm font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  Q{currentIndex + 1}
                </span>
                <span>{currentQuestion.libelle}</span>
              </legend>

              {currentQuestion.typeReponse === "NOTE" && (
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {[
                    { v: 1, l: "Très faible" },
                    { v: 2, l: "Faible" },
                    { v: 3, l: "Moyen" },
                    { v: 4, l: "Bon" },
                    { v: 5, l: "Excellent" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setReponse(currentQuestion.id, opt.v)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${
                        currentReponse === opt.v
                          ? "bg-primary-container text-on-primary shadow-sm"
                          : "bg-surface hover:bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <span className="text-title-lg font-bold">{opt.v}</span>
                      <span className="text-label-sm mt-1 hidden sm:block">
                        {opt.l}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* ✅ DÉTECTION ROBUSTE OUI/NON */}
              {(() => {
                const type = (currentQuestion.typeReponse || "").toUpperCase();
                const options = (currentQuestion.options || []).map((o: any) => String(o).toUpperCase());
                const isOuiNon =
                  type.includes("OUI") ||
                  type.includes("NON") ||
                  type === "BOOLEAN" ||
                  type === "YES_NO" ||
                  (options.includes("OUI") && options.includes("NON"));
                
                if (!isOuiNon) return null;
                
                return (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      { v: true, l: "Oui", icon: "check" as const },
                      { v: false, l: "Non", icon: "close" as const },
                    ].map((opt) => (
                      <button
                        key={String(opt.v)}
                        type="button"
                        onClick={() => setReponse(currentQuestion.id, opt.v)}
                        className={`flex items-center justify-center gap-3 p-4 rounded-xl transition-all ${
                          currentReponse === opt.v
                            ? "bg-primary-container text-on-primary shadow-sm"
                            : "bg-surface hover:bg-surface-container text-on-surface"
                        }`}
                      >
                        <Icon name={opt.icon} size={28} />
                        <span className="text-title-md font-semibold">
                          {opt.l}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {currentQuestion.typeReponse === "TEXTE" && (
                <textarea
                  value={currentReponse || ""}
                  onChange={(e) =>
                    setReponse(currentQuestion.id, e.target.value)
                  }
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-outline"
                  placeholder="Votre réponse..."
                />
              )}
            </fieldset>
          </div>
        )}

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface text-on-surface hover:bg-surface-container text-label-md font-medium transition-colors disabled:opacity-40"
          >
            <Icon name="arrow-back" size={18} />
            <span>Précédent</span>
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((i) => Math.min(i + 1, total - 1))
              }
              disabled={!canGoNext}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-all shadow-sm disabled:opacity-40"
            >
              <span>Suivant</span>
              <Icon name="arrow-right" size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-secondary text-on-secondary text-label-md font-semibold hover:opacity-95 transition-opacity shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icon name="refresh" size={18} className="animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <Icon name="check" size={18} />
                  <span>Terminer et voir le résultat</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}