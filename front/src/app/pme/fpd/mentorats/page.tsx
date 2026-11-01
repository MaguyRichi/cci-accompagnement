"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fpdApi } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

const METIERS_LABEL: Record<string, string> = {
  HOTELLERIE_TOURISME: "Hôtellerie & Tourisme",
  SECRETARIAT: "Secrétariat",
  GESTION_COMPTABILITE: "Gestion & Comptabilité",
  ASSISTANT_BANCAIRE: "Assistant Bancaire",
};

const SEUIL_VALIDATION_MIN = 50;

/* ============================================
   COMPOSANT D'ANIMATION AU SCROLL
   ============================================ */
function AnimatedSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setIsVisible(true);
      });
    }, { threshold: 0.1 });

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function MentorFpdPage() {
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [validTarget, setValidTarget] = useState<any>(null);
  const [note, setNote] = useState(15);
  const [commentaire, setCommentaire] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showPrivees, setShowPrivees] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    metier: "HOTELLERIE_TOURISME",
    description: "",
    dateDebut: "",
    dateFin: "",
    placesTotales: 10,
    lieuFormation: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fpdApi.getMentorats();
      setInscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setInscriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await fpdApi.getSessionsMentor();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[loadSessions]", err);
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleOpenPrivees = async () => {
    setShowPrivees(true);
    await loadSessions();
  };

  const handleValider = async () => {
    if (!validTarget) return;
    setIsSubmitting(true);
    try {
      await fpdApi.validerParMentor(validTarget.id, { note, commentaire });
      setSuccessMsg(`Formation validée ! Badge attribué à ${validTarget.utilisateur?.prenom ?? ""}.`);
      setValidTarget(null);
      setNote(15);
      setCommentaire("");
      loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!form.nom || !form.dateDebut || !form.dateFin) {
      setFormError("Remplissez tous les champs obligatoires.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      await fpdApi.createSession({ ...form, estPrivee: true });
      setShowCreateForm(false);
      setForm({
        nom: "",
        metier: "HOTELLERIE_TOURISME",
        description: "",
        dateDebut: "",
        dateFin: "",
        placesTotales: 10,
        lieuFormation: "",
      });
      await loadSessions();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Erreur");
    } finally {
      setIsSaving(false);
    }
  };

  const aValider = inscriptions.filter(
    (i) => i.statut === "EN_COURS" || i.statut === "TERMINEE"
  );
  const validees = inscriptions.filter((i) => i.statut === "VALIDEE_PAR_MENTOR");

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto relative overflow-hidden h-[calc(100vh-80px)] flex flex-col">
        <div className="absolute inset-0 top-0 h-full -z-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] opacity-60" />
        </div>
        <div className="w-full flex-1 min-h-0 bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-2xl shadow-slate-300/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto relative overflow-hidden min-h-screen flex flex-col">
      
      {/* ================= BACKGROUND PREMIUM ================= */}
      <div className="absolute inset-0 top-0 h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] opacity-60" />
      </div>

      {/* ================= LAYOUT CONTENEUR FLOTTANT ================= */}
      <div className="w-full flex-1 bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-2xl shadow-slate-300/30 flex flex-col overflow-hidden z-10 p-6 sm:p-8">
        
        {/* En-tête */}
        <AnimatedSection>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-md self-start">
                Espace Formateur
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Validations FPD
              </h1>
              <p className="text-sm text-slate-500 font-medium max-w-2xl">
                Suivez la progression de vos mentorés et validez leur parcours (à partir de {SEUIL_VALIDATION_MIN}% de progression).
              </p>
            </div>

            <button
              onClick={handleOpenPrivees}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm self-start md:self-auto shrink-0"
            >
              <Icon name="school" size={16} />
              Mes formations privées
            </button>
          </div>
        </AnimatedSection>

        {successMsg && (
          <AnimatedSection className="mt-5">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Icon name="check_circle" size={18} className="shrink-0 mt-0.5" />
              <span className="text-sm font-semibold">{successMsg}</span>
            </div>
          </AnimatedSection>
        )}

        {/* Formations à valider */}
        <section className="mt-6 flex-1">
          <AnimatedSection delay={100}>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Icon name="pending_actions" size={20} className="text-amber-500" />
              Formations à valider ({aValider.length})
            </h2>
          </AnimatedSection>

          {aValider.length === 0 ? (
            <AnimatedSection delay={200}>
              <div className="p-10 rounded-2xl bg-white/50 border border-slate-200/60 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Icon name="check" size={32} className="text-slate-300" />
                </div>
                <p className="text-base font-bold text-slate-800 mb-1">Aucune formation en cours</p>
                <p className="text-sm text-slate-500">Tous vos mentorés sont à jour.</p>
              </div>
            </AnimatedSection>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {aValider.map((insc, i) => {
                const progression = insc.progression ?? 0;
                const peutValider = progression >= SEUIL_VALIDATION_MIN;
                const isReady = progression === 100;
                
                return (
                  <AnimatedSection key={insc.id} delay={200 + i * 50}>
                    <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        
                        {/* Infos Mentoré */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary border border-primary/10 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
                            {insc.utilisateur?.prenom?.[0]}{insc.utilisateur?.nom?.[0]}
                          </div>
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <span className="text-base font-bold text-slate-900 truncate">
                              {insc.utilisateur?.prenom} {insc.utilisateur?.nom}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {insc.entreprise?.raisonSociale}
                            </span>
                            <span className="text-[11px] font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-md w-fit mt-0.5">
                              {METIERS_LABEL[insc.session?.metier] || insc.session?.metier} — {insc.session?.nom}
                            </span>

                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-[150px]">
                                <div
                                  className={`h-full rounded-full ${
                                    isReady ? "bg-emerald-500" : peutValider ? "bg-amber-500" : "bg-red-400"
                                  }`}
                                  style={{ width: `${progression}%` }}
                                />
                              </div>
                              <span className={`text-[11px] font-bold ${isReady ? "text-emerald-600" : peutValider ? "text-amber-600" : "text-red-600"}`}>
                                {progression}%
                              </span>
                              
                              {isReady && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
                                  Prêt
                                </span>
                              )}
                              {!isReady && peutValider && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
                                  Validable
                                </span>
                              )}
                              {!peutValider && (
                                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-bold uppercase tracking-wider">
                                  Min {SEUIL_VALIDATION_MIN}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap mt-2 lg:mt-0">
                          <Link
                            href={`/pme/fpd/creer/${insc.sessionId}`}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            <Icon name="edit" size={14} />
                            Contenu
                          </Link>

                          <button
                            onClick={() => setValidTarget(insc)}
                            disabled={!peutValider}
                            title={!peutValider ? `Minimum ${SEUIL_VALIDATION_MIN}% requis` : "Valider la formation"}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Icon name="verified" size={14} />
                            Valider
                          </button>
                        </div>

                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          )}
        </section>

        {/* Formations validées */}
        <section className="mt-8">
          <AnimatedSection delay={300}>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Icon name="workspace_premium" size={20} className="text-emerald-500" />
              Formations validées ({validees.length})
            </h2>
          </AnimatedSection>

          {validees.length === 0 ? (
            <AnimatedSection delay={350}>
              <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-200/60 text-center">
                <p className="text-xs text-slate-500 font-medium">Aucune formation validée pour l'instant.</p>
              </div>
            </AnimatedSection>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {validees.map((insc, i) => (
                <AnimatedSection key={insc.id} delay={350 + i * 50}>
                  <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                      <Icon name="verified" size={20} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {insc.utilisateur?.prenom} {insc.utilisateur?.nom}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                        {insc.badgeObtenu} — {insc.progression}%
                      </span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-base font-bold text-emerald-600">
                        {insc.noteMentor ?? "—"}<span className="text-[11px] text-emerald-500">/20</span>
                      </span>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ===== Carte flottante : formations privées ===== */}
      {showPrivees && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon name="school" size={20} />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-slate-900">Mes formations privées</h2>
                  <p className="text-xs text-slate-500 font-medium">Visibles uniquement par vos mentorés.</p>
                </div>
              </div>
              <button onClick={() => setShowPrivees(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4">
              <button
                onClick={() => {
                  setFormError(null);
                  setShowCreateForm(true);
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Icon name="plus" size={16} />
                Nouvelle formation privée
              </button>

              {isLoadingSessions ? (
                <div className="p-8 text-center">
                  <Icon name="refresh" size={28} className="text-primary animate-spin mx-auto" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                  <Icon name="school" size={40} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Aucune formation privée</p>
                  <p className="text-xs text-slate-500 mt-1">Créez-en une pour commencer.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {sessions.map((s) => (
                    <div key={s.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wider border border-amber-200">
                          Privée
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[9px] font-bold uppercase tracking-wider border border-slate-200">
                          {METIERS_LABEL[s.metier] || s.metier}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{s.nom}</h3>
                      <div className="flex flex-wrap gap-3 text-[11px] font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Icon name="calendar" size={12} className="text-slate-400" />
                          {new Date(s.dateDebut).toLocaleDateString("fr-FR")} → {new Date(s.dateFin).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="groups" size={12} className="text-slate-400" />
                          {s.placesRestantes}/{s.placesTotales} places
                        </span>
                      </div>
                      <Link
                        href={`/pme/fpd/creer/${s.id}`}
                        onClick={() => setShowPrivees(false)}
                        className="mt-2 w-full py-2 rounded-lg bg-slate-50 text-slate-700 text-xs font-bold text-center hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Icon name="edit" size={14} />
                        Gérer le contenu
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Carte flottante : création formation ===== */}
      {showCreateForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white shadow-2xl p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Nouvelle formation</h2>
              <button onClick={() => setShowCreateForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <Icon name="close" size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Titre *</label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Accompagnement à l'export"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Métier</label>
              <select
                value={form.metier}
                onChange={(e) => setForm({ ...form, metier: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {Object.entries(METIERS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Début *</label>
                <input
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Fin *</label>
                <input
                  type="date"
                  value={form.dateFin}
                  onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Places</label>
                <input
                  type="number"
                  value={form.placesTotales}
                  onChange={(e) => setForm({ ...form, placesTotales: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Lieu</label>
                <input
                  value={form.lieuFormation}
                  onChange={(e) => setForm({ ...form, lieuFormation: e.target.value })}
                  placeholder="CCI Fianarantsoa"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-start gap-2 mt-1">
              <Icon name="info" size={14} className="shrink-0 mt-0.5" />
              <span>Cette formation sera privée : seuls vos mentorés y auront accès.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Création..." : "Créer la formation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Carte flottante : validation ===== */}
      {validTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white shadow-2xl p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <Icon name="workspace_premium" size={20} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-slate-900">Valider la formation</h2>
                <p className="text-xs font-medium text-slate-500">
                  {validTarget.utilisateur?.prenom} {validTarget.utilisateur?.nom}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Progression actuelle</span>
              <span className={`text-base font-bold ${(validTarget.progression ?? 0) >= SEUIL_VALIDATION_MIN ? "text-amber-600" : "text-red-600"}`}>
                {validTarget.progression ?? 0}%
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Note finale (sur 20)</label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={note}
                onChange={(e) => setNote(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Commentaire (optionnel)</label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={2}
                placeholder="Ex: Bonne progression..."
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            {(validTarget.progression ?? 0) < 100 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-start gap-2">
                <Icon name="info" size={14} className="shrink-0 mt-0.5" />
                <span>
                  La progression est de <strong>{validTarget.progression ?? 0}%</strong> (minimum : {SEUIL_VALIDATION_MIN}%). Vous pouvez tout de même valider.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setValidTarget(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">
                Annuler
              </button>
              <button
                onClick={handleValider}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <><Icon name="refresh" size={14} className="animate-spin" /> Validation...</>
                ) : (
                  <><Icon name="check" size={14} /> Confirmer</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}