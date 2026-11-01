"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { fpdApi } from "@/lib/api-services";
import { generateCertificatFPD } from "@/lib/pdf";
import Icon from "@/components/ui/Icon";

const METIERS_LABEL: Record<string, string> = {
  HOTELLERIE_TOURISME: "Hôtellerie & Tourisme",
  SECRETARIAT: "Secrétariat",
  GESTION_COMPTABILITE: "Gestion & Comptabilité",
  ASSISTANT_BANCAIRE: "Assistant Bancaire",
};

export default function DirigeantFpdPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [mesInscriptions, setMesInscriptions] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeInscription, setActiveInscription] = useState<any | null>(null);

  const [currentQuiz, setCurrentQuiz] = useState<any | null>(null);
  const [selectedReponse, setSelectedReponse] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<{
    correct: boolean;
    progression: number;
  } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const sess = await fpdApi.getMesSessions();
      const insc = await fpdApi.getMesInscriptions();

      setSessions(Array.isArray(sess) ? sess : []);
      setMesInscriptions(Array.isArray(insc) ? insc : []);

      const active = (insc || []).find(
        (i: any) => i.statut === "EN_COURS" || i.statut === "TERMINEE",
      );

      if (active) {
        setActiveInscription(active);
        const mods = await fpdApi.getModules(active.sessionId);
        setModules(Array.isArray(mods) ? mods : []);
      } else {
        setActiveInscription(null);
        setModules([]);
      }
    } catch (err) {
      console.error("[loadData]", err);
      setSessions([]);
      setMesInscriptions([]);
      setActiveInscription(null);
      setModules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInscrire = async (sessionId: number) => {
    if (!confirm("Confirmez-vous votre inscription à cette formation ?")) return;
    try {
      await fpdApi.inscrire(sessionId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'inscription");
    }
  };

  const handleStartQuiz = (quiz: any) => {
    setCurrentQuiz(quiz);
    setSelectedReponse(null);
    setQuizFeedback(null);
  };

  const handleSubmitQuiz = async () => {
    if (!currentQuiz || selectedReponse === null || !activeInscription) return;
    setIsSubmitting(true);
    try {
      const res = await fpdApi.submitQuiz(
        activeInscription.id,
        currentQuiz.id,
        selectedReponse,
      );
      setQuizFeedback(res);
      if (res.completed) {
        await loadData();
      } else {
        setActiveInscription({
          ...activeInscription,
          progression: res.progression,
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseQuiz = () => {
    setCurrentQuiz(null);
    setSelectedReponse(null);
    setQuizFeedback(null);
  };

  /**
   * ✅ SIMPLIFIÉ : on passe directement l'objet `insc`.
   * `generateCertificatFPD` gère maintenant les 2 formats
   * (à plat OU avec `utilisateur` imbriqué) et affiche "—" au lieu de "undefined".
   */
  const handleDownloadCertificat = (insc: any) => {
    try {
      generateCertificatFPD(insc);
    } catch (err) {
      console.error("Erreur génération certificat:", err);
      alert("Impossible de générer le certificat PDF.");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        <div className="h-96 rounded-2xl bg-surface-container-lowest animate-pulse" />
      </div>
    );
  }

  const inscriptionsValidees = mesInscriptions.filter(
    (i) => i.statut === "VALIDEE_PAR_MENTOR",
  );

  const sessionsDisponibles = sessions.filter(
    (s) => s.id !== activeInscription?.sessionId,
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-code-sm text-outline uppercase tracking-wider">
            Espace Dirigeant
          </span>
          <h1 className="text-3xl sm:text-headline-lg text-primary font-bold tracking-tight">
            Ma formation FPD
          </h1>
        </div>

        {activeInscription && (
          <section className="rounded-[1.5rem] bg-gradient-to-br from-primary/10 via-surface-container-lowest to-secondary-container/20 p-6 shadow-sm border border-black/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                <Icon name="school" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-code-sm text-outline uppercase font-semibold">
                  {activeInscription.statut === "TERMINEE"
                    ? "En attente de validation"
                    : "Formation en cours"}
                </span>
                <span className="text-title-lg text-primary font-bold">
                  {activeInscription.session?.nom ?? "Formation"}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  {METIERS_LABEL[activeInscription.session?.metier] ?? ""}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-label-sm font-semibold text-on-surface">
                  Progression globale
                </span>
                <span
                  className={`text-label-md font-bold ${
                    activeInscription.progression === 100
                      ? "text-emerald-600"
                      : "text-primary"
                  }`}
                >
                  {activeInscription.progression ?? 0}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-container overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeInscription.progression === 100
                      ? "bg-emerald-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${activeInscription.progression ?? 0}%` }}
                />
              </div>
            </div>

            {activeInscription.progression === 100 && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <Icon
                  name="check_circle"
                  size={20}
                  className="text-emerald-600 shrink-0 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="text-label-md font-bold text-emerald-700">
                    Formation terminée !
                  </span>
                  <span className="text-body-sm text-emerald-600">
                    Votre mentor va valider votre parcours et vous attribuer votre badge.
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 mt-6">
              {modules.length === 0 ? (
                <div className="p-6 rounded-xl bg-surface-container-lowest/80 border border-black/5 text-center">
                  <p className="text-body-sm text-on-surface-variant italic">
                    Aucun module disponible pour le moment. Votre mentor doit encore ajouter
                    du contenu.
                  </p>
                </div>
              ) : (
                modules.map((mod, idx) => (
                  <div
                    key={mod.id}
                    className="rounded-xl bg-surface-container-lowest/80 p-4 border border-black/5"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-title-sm font-bold text-on-surface">
                          {mod.titre}
                        </h3>
                        {mod.description && (
                          <p className="text-code-sm text-on-surface-variant">
                            {mod.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {mod.quizzes && mod.quizzes.length > 0 ? (
                      <div className="flex flex-col gap-2 pl-11">
                        {mod.quizzes.map((q: any, i: number) => (
                          <button
                            key={q.id}
                            onClick={() => handleStartQuiz(q)}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-container-lowest border border-black/5 hover:border-primary-container/50 hover:bg-surface-container-low transition-colors text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-primary-container/20 text-primary text-code-sm font-bold flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <span className="text-body-sm text-on-surface truncate">
                                {q.question}
                              </span>
                            </div>
                            <Icon
                              name="chevron-right"
                              size={16}
                              className="text-outline shrink-0"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="pl-11 text-code-sm text-outline italic">
                        Aucun quiz pour ce module
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {inscriptionsValidees.length > 0 && (
          <section>
            <h2 className="text-title-lg text-primary font-bold mb-4 flex items-center gap-2">
              <Icon name="workspace_premium" size={20} className="text-emerald-500" />{" "}
              Mes formations validées
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inscriptionsValidees.map((insc) => (
                <div
                  key={insc.id}
                  className="p-5 rounded-[1.5rem] bg-surface-container-lowest border border-black/5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-title-md text-primary font-bold">
                      {insc.badgeObtenu}
                    </span>
                    <Icon name="verified" size={20} className="text-emerald-500" />
                  </div>
                  <span className="text-body-sm text-on-surface-variant">
                    {insc.session?.nom}
                  </span>
                  <button
                    onClick={() => handleDownloadCertificat(insc)}
                    className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 text-white text-label-md font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon name="download" size={18} /> Télécharger mon certificat
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {sessionsDisponibles.length > 0 && (
          <section>
            <h2 className="text-title-lg text-primary font-bold mb-4">
              {activeInscription
                ? "Autres sessions disponibles"
                : "Sessions disponibles"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sessionsDisponibles.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-[1.5rem] bg-surface-container-lowest border border-black/5 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-primary-container/20 text-primary text-[11px] font-bold uppercase tracking-wider">
                      {METIERS_LABEL[s.metier] || s.metier}
                    </span>
                    {s.estPrivee ? (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[11px] font-bold uppercase">
                        Privée
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          s.placesRestantes > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.placesRestantes} places
                      </span>
                    )}
                  </div>
                  <h3 className="text-title-md text-on-surface font-bold">{s.nom}</h3>
                  <div className="flex flex-col gap-1 text-body-sm text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <Icon name="calendar" size={14} className="text-outline" />
                      Du {new Date(s.dateDebut).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(s.dateFin).toLocaleDateString("fr-FR")}
                    </span>
                    {s.estPrivee && (
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <Icon name="lock" size={14} />
                        Réservée aux mentorés
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleInscrire(s.id)}
                    disabled={s.placesRestantes <= 0}
                    className="mt-2 w-full py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-bold hover:bg-primary-container transition-colors disabled:opacity-50"
                  >
                    S'inscrire
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {sessions.length === 0 && (
          <section>
            <h2 className="text-title-lg text-primary font-bold mb-4">
              Sessions disponibles
            </h2>
            <div className="p-12 rounded-[1.5rem] bg-surface-container-lowest border border-black/5 text-center">
              <Icon name="calendar" size={48} className="text-outline mx-auto mb-3" />
              <p className="text-body-md text-on-surface-variant">
                Aucune session ouverte pour le moment.
              </p>
            </div>
          </section>
        )}
      </div>

      {currentQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg text-primary">
                Question {currentQuiz.ordre}
              </h2>
              <button
                onClick={handleCloseQuiz}
                className="p-2 rounded-lg hover:bg-surface-container"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {!quizFeedback ? (
              <>
                <p className="text-body-lg text-on-surface font-medium">
                  {currentQuiz.question}
                </p>
                <div className="flex flex-col gap-2">
                  {currentQuiz.options.map((opt: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedReponse(i)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        selectedReponse === i
                          ? "border-primary bg-primary-container/10"
                          : "border-surface-container-low bg-surface-container-lowest hover:border-primary-container/40"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedReponse === i
                            ? "border-primary bg-primary"
                            : "border-outline"
                        }`}
                      >
                        {selectedReponse === i && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-body-md text-on-surface">{opt}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={selectedReponse === null || isSubmitting}
                  className="w-full py-3 rounded-xl bg-primary text-on-primary text-label-md font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Envoi..." : "Valider ma réponse"}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    quizFeedback.correct
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  <Icon
                    name={quizFeedback.correct ? "check" : "close"}
                    size={40}
                  />
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <h3 className="text-title-lg font-bold text-on-surface">
                    {quizFeedback.correct ? "Bonne réponse !" : "Mauvaise réponse"}
                  </h3>
                  <p className="text-body-md text-on-surface-variant">
                    Votre progression : <strong>{quizFeedback.progression}%</strong>
                  </p>
                </div>
                <button
                  onClick={handleCloseQuiz}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-bold"
                >
                  Continuer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}