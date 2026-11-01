"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fpdApi } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

interface Quiz {
  id?: number;
  question: string;
  options: string[];
  bonneReponse: number;
  ordre?: number; // ✅ AJOUTÉ
}

interface Module {
  id: number;
  titre: string;
  description?: string;
  ordre: number;
  quizzes: Quiz[];
}

export default function CreerFormationPage() {
  const params = useParams();
  const router = useRouter();
  const rawSessionId = params?.sessionId;
  const sessionId = Number(rawSessionId);
  const sessionIdValid = Number.isFinite(sessionId) && sessionId > 0;

  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModalModule, setShowModalModule] = useState(false);
  const [moduleTitre, setModuleTitre] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");
  const [isSavingModule, setIsSavingModule] = useState(false);

  const [showModalQuiz, setShowModalQuiz] = useState<Module | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [quizBonne, setQuizBonne] = useState(0);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  const loadModules = async () => {
    if (!sessionIdValid) {
      setModules([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fpdApi.getModules(sessionId);
      setModules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[loadModules]", err);
      setModules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionIdValid) {
      router.replace("/pme/fpd/mentorats");
      return;
    }
    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sessionIdValid]);

  const handleCreateModule = async () => {
    if (!moduleTitre.trim() || !sessionIdValid) return;
    setIsSavingModule(true);
    try {
      await fpdApi.createModule(sessionId, {
        titre: moduleTitre,
        description: moduleDesc,
        ordre: modules.length + 1,
      });
      setShowModalModule(false);
      setModuleTitre("");
      setModuleDesc("");
      await loadModules();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur");
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleOpenCreateQuiz = (mod: Module) => {
    setEditingQuiz(null);
    setQuizQuestion("");
    setQuizOptions(["", "", "", ""]);
    setQuizBonne(0);
    setShowModalQuiz(mod);
  };

  const handleOpenEditQuiz = (mod: Module, quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizQuestion(quiz.question);
    setQuizOptions([...quiz.options]);
    setQuizBonne(quiz.bonneReponse);
    setShowModalQuiz(mod);
  };

  const handleSaveQuiz = async () => {
    if (!showModalQuiz?.id) return;
    if (!quizQuestion.trim() || quizOptions.some((o) => !o.trim())) {
      alert("Remplissez tous les champs (question + 4 options).");
      return;
    }
    setIsSavingQuiz(true);
    try {
      if (editingQuiz?.id) {
        await fpdApi.updateQuiz(editingQuiz.id, {
          question: quizQuestion,
          options: quizOptions,
          bonneReponse: quizBonne,
          ordre: editingQuiz.ordre ?? 1,
        });
      } else {
        await fpdApi.createQuiz(showModalQuiz.id, {
          question: quizQuestion,
          options: quizOptions,
          bonneReponse: quizBonne,
          ordre: (showModalQuiz.quizzes?.length || 0) + 1,
        });
      }
      handleCloseQuiz();
      await loadModules();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur");
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!quiz.id) return;
    if (
      !confirm(
        "Supprimer ce quiz ? Les dirigeants devront refaire les quiz restants. Cette action est irréversible.",
      )
    )
      return;
    try {
      await fpdApi.deleteQuiz(quiz.id);
      await loadModules();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur");
    }
  };

  const handleCloseQuiz = () => {
    setShowModalQuiz(null);
    setEditingQuiz(null);
    setQuizQuestion("");
    setQuizOptions(["", "", "", ""]);
    setQuizBonne(0);
  };

  if (!sessionIdValid) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        <div className="p-12 rounded-2xl bg-surface-container-lowest border border-black/5 text-center">
          <Icon name="error" size={48} className="text-error mx-auto mb-3" />
          <h3 className="text-title-lg font-bold text-primary mb-1">Session invalide</h3>
          <p className="text-body-md text-on-surface-variant mb-4">
            L'identifiant de session est manquant ou invalide.
          </p>
          <Link
            href="/pme/fpd/mentorats"
            className="inline-block px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold"
          >
            Retour aux formations
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        <div className="h-96 rounded-2xl bg-surface-container-lowest animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-6">
        <nav className="flex items-center gap-2 text-label-sm text-outline">
          <Link
            href="/pme/fpd/mentorats"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <Icon name="arrow-back" size={16} /> Mes formations privées
          </Link>
          <Icon name="chevron-right" size={14} />
          <span className="text-on-surface font-semibold">Contenu de la formation</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-code-sm text-outline uppercase tracking-wider">Espace Formateur</span>
            <h1 className="text-3xl sm:text-headline-lg text-primary font-bold tracking-tight">
              Contenu de la formation
            </h1>
            <p className="text-body-md text-on-surface-variant max-w-2xl">
              Ajoutez les modules et les quiz que vos apprentis devront valider.
            </p>
          </div>
          <button
            onClick={() => setShowModalModule(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm"
          >
            <Icon name="plus" size={18} /> Ajouter un module
          </button>
        </div>

        {modules.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface-container-lowest border border-black/5 text-center">
            <Icon name="article" size={48} className="text-outline mx-auto mb-3" />
            <h3 className="text-title-lg font-bold text-primary mb-1">Aucun module pour l'instant</h3>
            <p className="text-body-md text-on-surface-variant mb-4">
              Commencez par créer le premier module de votre formation.
            </p>
            <button
              onClick={() => setShowModalModule(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold"
            >
              Créer le premier module
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {modules.map((mod, idx) => (
              <div
                key={mod.id}
                className="rounded-2xl bg-surface-container-lowest border border-black/5 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-title-md font-bold text-on-surface">{mod.titre}</h3>
                      {mod.description && (
                        <p className="text-body-sm text-on-surface-variant line-clamp-2">
                          {mod.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenCreateQuiz(mod)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-container text-label-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
                  >
                    <Icon name="plus" size={14} /> Quiz
                  </button>
                </div>

                {mod.quizzes && mod.quizzes.length > 0 ? (
                  <div className="flex flex-col gap-2 pl-13">
                    {mod.quizzes.map((q, i) => (
                      <div
                        key={q.id ?? i}
                        className="p-3 rounded-xl bg-surface-container-low flex items-start justify-between gap-2"
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="text-code-sm font-bold text-primary shrink-0 mt-0.5">
                            Q{i + 1}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-body-sm text-on-surface font-medium">
                              {q.question}
                            </span>
                            <span className="text-code-sm text-emerald-600 mt-1">
                              Réponse : {q.options?.[q.bonneReponse] ?? "—"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditQuiz(mod, q)}
                            title="Modifier ce quiz"
                            className="p-1.5 rounded-lg hover:bg-surface-container text-primary transition-colors"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(q)}
                            title="Supprimer ce quiz"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          >
                            {/* ✅ Icône corrigée */}
                            <Icon name="close" size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pl-13 text-code-sm text-outline italic">Aucun quiz dans ce module</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Module */}
      {showModalModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg text-primary">Nouveau module</h2>
              <button
                onClick={() => setShowModalModule(false)}
                className="p-2 rounded-lg hover:bg-surface-container"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-semibold">Titre du module *</label>
              <input
                value={moduleTitre}
                onChange={(e) => setModuleTitre(e.target.value)}
                placeholder="Ex: Introduction à l'hôtellerie"
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-body-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-semibold">Description (optionnelle)</label>
              <textarea
                value={moduleDesc}
                onChange={(e) => setModuleDesc(e.target.value)}
                rows={3}
                placeholder="Décrivez ce que les apprenants vont découvrir..."
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-body-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModalModule(false)}
                className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateModule}
                disabled={isSavingModule || !moduleTitre.trim()}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold disabled:opacity-50"
              >
                {isSavingModule ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quiz (création OU édition) */}
      {showModalQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg text-primary">
                {editingQuiz ? "Modifier le quiz" : "Nouveau quiz"}
              </h2>
              <button
                onClick={handleCloseQuiz}
                className="p-2 rounded-lg hover:bg-surface-container"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {editingQuiz && (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-body-sm flex items-start gap-2">
                {/* ✅ Icône corrigée */}
                <Icon name="info" size={16} className="shrink-0 mt-0.5" />
                <span>
                  ⚠️ En modifiant ce quiz, tous les résultats précédents seront effacés. Les
                  dirigeants devront le refaire.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-semibold">Question *</label>
              <input
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
                placeholder="Ex: Qu'est-ce que le yield management ?"
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-body-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-label-sm font-semibold">Options (4 réponses) *</label>
              {quizOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={quizBonne === i}
                    onChange={() => setQuizBonne(i)}
                    className="accent-emerald-600"
                  />
                  <input
                    value={opt}
                    onChange={(e) => {
                      const copy = [...quizOptions];
                      copy[i] = e.target.value;
                      setQuizOptions(copy);
                    }}
                    placeholder={`Réponse ${i + 1}`}
                    className="flex-1 px-4 py-2 rounded-lg bg-surface-container-low text-body-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  {quizBonne === i && (
                    <span className="text-code-sm font-bold text-emerald-600 shrink-0">✓</span>
                  )}
                </div>
              ))}
              <span className="text-code-sm text-outline">
                Cochez le bouton radio à gauche de la bonne réponse.
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseQuiz}
                className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveQuiz}
                disabled={isSavingQuiz}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold disabled:opacity-50"
              >
                {isSavingQuiz
                  ? "Enregistrement..."
                  : editingQuiz
                  ? "Enregistrer les modifications"
                  : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}