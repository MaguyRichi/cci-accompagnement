"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  entreprisesApi,
  mentorsApi,
  demandesApi,
  getImageUrl,
  Entreprise,
  Mentor,
  Demande,
} from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

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
      className={`transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function MentoratPage() {
  const { user } = useAuth();

  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mesDemandes, setMesDemandes] = useState<Demande[]>([]);
  const [demandesRecues, setDemandesRecues] = useState<Demande[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [objet, setObjet] = useState("");
  const [description, setDescription] = useState("");

  const isMentor = user?.role === "MENTOR";
  const isDirigeant = user?.role === "DIRIGEANT";

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        if (isDirigeant) {
          const results = await Promise.allSettled([
            entreprisesApi.getMyEntreprise().catch(() => null),
            mentorsApi.getAll(),
            demandesApi.getMesDemandes({ type: "MENTORAT", limit: 50 }).catch(() => ({ data: [] })),
          ]);

          if (results[0].status === "fulfilled") setEntreprise(results[0].value);
          if (results[1].status === "fulfilled") setMentors((results[1].value as any) || []);
          if (results[2].status === "fulfilled") setMesDemandes((results[2].value as any)?.data || []);
        } else if (isMentor) {
          const results = await Promise.allSettled([
            demandesApi.getRecues({ limit: 100 }).catch(() => ({ data: [] })),
          ]);

          if (results[0].status === "fulfilled") setDemandesRecues((results[0].value as any)?.data || []);
        }
      } catch (error) {
        console.error("Erreur mentorat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isDirigeant, isMentor]);

  const handleDemanderMentorat = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setObjet("");
    setDescription("");
    setError(null);
    setModalOpen(true);
  };

  const handleSubmitDemande = async () => {
    if (!selectedMentor) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await demandesApi.createMentorat({
        cibleId: selectedMentor.id,
        titre: objet || `Demande de mentorat avec ${selectedMentor.prenom} ${selectedMentor.nom}`,
        description,
      });
      const dems = await demandesApi.getMesDemandes({ type: "MENTORAT", limit: 50 });
      setMesDemandes(dems.data);
      setSuccessMessage(`Votre demande a été envoyée à ${selectedMentor.prenom} ${selectedMentor.nom}.`);
      setModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError("Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnnulerDemande = async (id: number) => {
    if (!confirm("Confirmez-vous l'annulation ?")) return;
    try {
      await demandesApi.annuler(id);
      setMesDemandes((prev) => prev.map((d) => (d.id === id ? { ...d, statut: "ANNULEE" } : d)));
    } catch (error) {
      console.error("Erreur annulation:", error);
    }
  };

  const handleAccepterDemande = async (id: number) => {
    try {
      await demandesApi.accepter(id);
      setDemandesRecues((prev) => prev.map((d) => (d.id === id ? { ...d, statut: "ACCEPTEE" } : d)));
      setSuccessMessage("Demande acceptée. Un échange peut démarrer.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert("Erreur : " + (err.response?.data?.message || err.message));
    }
  };

  const handleRefuserDemande = async (id: number) => {
    const motif = prompt("Motif du refus (optionnel) :");
    if (motif === null) return;
    try {
      await demandesApi.refuserCible(id, motif || "Refusée");
      setDemandesRecues((prev) => prev.map((d) => (d.id === id ? { ...d, statut: "REFUSEE_PAR_CIBLE", motifRefus: motif } : d)));
      setSuccessMessage("Demande refusée.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert("Erreur : " + (err.response?.data?.message || err.message));
    }
  };

  const getInitials = (text: string) => text.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE": return "bg-amber-50 text-amber-700 border-amber-200";
      case "VALIDEE":
      case "ACCEPTEE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REFUSEE":
      case "REFUSEE_PAR_CIBLE": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-surface-container text-on-surface-variant border-black/5";
    }
  };

  const getStatutLabel = (statut: string) => {
    const map: Record<string, string> = {
      EN_ATTENTE: "En attente",
      VALIDEE: "Validée",
      ACCEPTEE: "Acceptée",
      REFUSEE: "Refusée",
      REFUSEE_PAR_CIBLE: "Refusée par le mentor",
      TERMINEE: "Terminée",
      ANNULEE: "Annulée",
    };
    return map[statut] || statut;
  };

  const demandesEnCours = mesDemandes.filter((d) => d.statut === "EN_ATTENTE" || d.statut === "VALIDEE" || d.statut === "ACCEPTEE");
  const mentorActif = entreprise?.mentor;
  const mentorActifId = entreprise?.mentorId;
  const mentorPhoto = getImageUrl(mentorActif?.photoProfil);

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto relative overflow-hidden">
        {/* On garde le fond premium même pendant le chargement */}
        <div className="absolute inset-0 top-0 h-[80vh] -z-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="flex flex-col w-full gap-8 z-10 relative">
          {/* Header skeleton */}
          <AnimatedSection>
            <div className="flex flex-col gap-3">
              <div className="h-6 w-32 rounded-md bg-slate-200/60 animate-pulse" />
              <div className="h-10 w-3/4 sm:w-1/2 rounded-xl bg-slate-200/60 animate-pulse" />
              <div className="h-5 w-2/3 sm:w-1/3 rounded-md bg-slate-200/60 animate-pulse" />
            </div>
          </AnimatedSection>

          {/* Stats skeleton */}
          <AnimatedSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-[1.5rem] bg-white/40 backdrop-blur-xl border border-slate-200/50 shadow-sm flex flex-col justify-center p-6 gap-3">
                  <div className="flex justify-between items-center w-full">
                    <div className="h-4 w-1/2 rounded-md bg-slate-200/60 animate-pulse" />
                    <div className="h-10 w-10 rounded-xl bg-slate-200/60 animate-pulse" />
                  </div>
                  <div className="h-8 w-1/3 rounded-lg bg-slate-200/60 animate-pulse mt-2" />
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Liste skeleton */}
          <AnimatedSection delay={200}>
            <div className="flex flex-col gap-5 mt-4">
              <div className="h-8 w-48 rounded-lg bg-slate-200/60 animate-pulse mb-2" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 w-full rounded-[1.5rem] bg-white/40 backdrop-blur-xl border border-slate-200/50 shadow-sm p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200/60 animate-pulse shrink-0" />
                    <div className="flex flex-col gap-2 w-full">
                      <div className="h-5 w-1/3 rounded-md bg-slate-200/60 animate-pulse" />
                      <div className="h-4 w-1/4 rounded-md bg-slate-200/60 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-2/3 rounded-md bg-slate-200/60 animate-pulse ml-[4.5rem]" />
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    );
  }
  const BackgroundMesh = () => (
    <div className="absolute inset-0 top-0 h-[80vh] -z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] opacity-60" />
    </div>
  );

  /* ============================================
     ÉCRAN MENTOR
     ============================================ */
  if (isMentor) {
    const enAttente = demandesRecues.filter((d) => d.statut === "EN_ATTENTE" || d.statut === "VALIDEE");
    const acceptees = demandesRecues.filter((d) => d.statut === "ACCEPTEE");

    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto relative overflow-hidden">
        <BackgroundMesh />
        
        <div className="flex flex-col w-full gap-8 z-10 relative">
          <AnimatedSection>
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md border border-slate-200/80 text-slate-700 text-xs font-bold uppercase tracking-wider self-start shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Espace Mentor
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Mes demandes de mentorat</h1>
                <p className="text-lg text-slate-500 font-light">Gérez les demandes d'accompagnement des PME.</p>
              </div>
            </header>
          </AnimatedSection>

          {successMessage && (
            <AnimatedSection>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/80 backdrop-blur-md border border-emerald-200 text-emerald-700 shadow-sm">
                <Icon name="check_circle" size={20} className="shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{successMessage}</span>
              </div>
            </AnimatedSection>
          )}

              {/* Stats */}
          <AnimatedSection delay={100}>
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                { label: "Demandes reçues", value: demandesRecues.length, icon: "folder", color: "text-blue-600 bg-blue-50" },
                { label: "En attente", value: enAttente.length, icon: "schedule", color: "text-amber-600 bg-amber-50" },
                { label: "Acceptées", value: acceptees.length, icon: "check_circle", color: "text-emerald-600 bg-emerald-50" },
                { label: "Ma note", value: `${Number(user?.noteMoyenne || 0).toFixed(1)}/5`, icon: "star", color: "text-yellow-600 bg-yellow-50" },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">{stat.label}</span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                      <Icon name={stat.icon as any} size={20} />
                    </div>
                  </div>
                  <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                </div>
              ))}
            </section>
          </AnimatedSection>

          {/* Liste des demandes reçues */}
          <section className="flex flex-col gap-5">
            <AnimatedSection delay={200}>
              <h2 className="text-2xl font-bold text-slate-900">Demandes reçues ({demandesRecues.length})</h2>
            </AnimatedSection>
            
            {demandesRecues.length === 0 ? (
              <AnimatedSection delay={300}>
                <div className="text-center py-24 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-slate-200/80 shadow-sm">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <Icon name="mentor" size={40} className="text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-700">Aucune demande pour le moment</p>
                  <p className="text-sm text-slate-500 mt-1">Les nouvelles demandes de mentorat apparaîtront ici.</p>
                </div>
              </AnimatedSection>
            ) : (
              <div className="flex flex-col gap-4">
                {demandesRecues.map((d, i) => (
                  <AnimatedSection key={d.id} delay={300 + i * 50}>
                    <div className="p-6 rounded-[1.5rem] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary border border-primary/10 flex items-center justify-center font-bold shrink-0 text-lg shadow-inner">
                            {getInitials(d.emetteur ? `${d.emetteur.prenom} ${d.emetteur.nom}` : d.entreprise?.sigle || d.entreprise?.raisonSociale || "PME")}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                              <span className="text-lg font-bold text-slate-900 truncate">
                                {d.titre || "Demande de mentorat"}
                              </span>
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getStatutColor(d.statut)}`}>
                                {getStatutLabel(d.statut)}
                              </span>
                            </div>
                            <span className="text-sm text-slate-500 font-medium">
                              <strong className="text-slate-800">{d.emetteur ? `${d.emetteur.prenom} ${d.emetteur.nom}` : d.entreprise?.raisonSociale || "PME"}</strong>
                              {" • "}
                              {new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                            </span>
                            {d.entreprise && (
                              <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <Icon name="building" size={12} /> {d.entreprise.raisonSociale || d.entreprise.sigle}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {d.description && (
                        <p className="text-sm text-slate-600 line-clamp-3 mt-4 pl-[4.5rem] leading-relaxed">
                          {d.description}
                        </p>
                      )}

                      {(d.statut === "EN_ATTENTE" || d.statut === "VALIDEE") && (
                        <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-slate-100">
                          <button onClick={() => handleAccepterDemande(d.id)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                            <Icon name="check" size={18} /> Accepter
                          </button>
                          <button onClick={() => handleRefuserDemande(d.id)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-bold hover:bg-red-100 transition-colors">
                            <Icon name="block" size={18} /> Refuser
                          </button>
                        </div>
                      )}

                      {d.statut === "ACCEPTEE" && (
                        <div className="flex items-center gap-4 pt-4 mt-4 border-t border-slate-100">
                          <Link href="/pme/messages" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
                            <Icon name="chat" size={18} /> Ouvrir la discussion
                          </Link>
                          <span className="text-xs text-slate-500">Un échange avec {d.emetteur ? `${d.emetteur.prenom} ${d.emetteur.nom}` : "la PME"} est possible</span>
                        </div>
                      )}
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            )}
          </section>

          <AnimatedSection delay={400}>
            <div className="p-6 sm:p-8 rounded-[2rem] bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl shadow-slate-900/20 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <Icon name="chat" size={28} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold">Discuter avec vos mentorés</span>
                  <span className="text-sm text-slate-400">Ouvrez la messagerie pour échanger directement</span>
                </div>
              </div>
              <Link href="/pme/messages" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-colors shrink-0 shadow-lg">
                Ouvrir la messagerie <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    );
  }

  /* ============================================
     ÉCRAN DIRIGEANT
     ============================================ */
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto relative overflow-hidden">
      <BackgroundMesh />

      <div className="flex flex-col w-full gap-8 z-10 relative">
        <AnimatedSection>
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-white/60 backdrop-blur-md border border-slate-200/80 text-slate-700 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                  Programme APME-HM 2026
                </span>
                {mentorActif ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Mentorat Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Aucun mentor actif
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Mon mentorat consulaire</h1>
              <p className="text-lg text-slate-500 font-light">Accompagnement personnalisé par un expert agréé CCI — 2026</p>
            </div>
          </header>
        </AnimatedSection>

        {successMessage && (
          <AnimatedSection>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/80 backdrop-blur-md border border-emerald-200 text-emerald-700 shadow-sm">
              <Icon name="check_circle" size={20} className="shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </AnimatedSection>
        )}

        {mentorActif && (
          <AnimatedSection delay={100}>
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary/10 via-white/60 to-secondary/10 backdrop-blur-xl border border-slate-200/80 shadow-lg">
              <div className="p-6 md:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative shrink-0">
                    {mentorPhoto ? (
                      <img src={mentorPhoto} alt="Mentor" className="w-24 h-24 rounded-[1.5rem] object-cover shadow-md ring-4 ring-white" />
                    ) : (
                      <div className="w-24 h-24 rounded-[1.5rem] bg-primary text-white flex items-center justify-center text-3xl font-black shadow-md ring-4 ring-white">
                        {getInitials(`${mentorActif.prenom} ${mentorActif.nom}`)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="px-2.5 py-1 rounded-md bg-white text-primary text-[11px] font-bold uppercase tracking-wider self-start shadow-sm border border-slate-100">
                      Tuteur Consulaire Référent
                    </span>
                    <h2 className="text-3xl font-black text-slate-900">{mentorActif.prenom} {mentorActif.nom}</h2>
                    <p className="text-base text-slate-600 font-medium">{mentorActif.domaineMentor || "Expert consulaire"}</p>
                  </div>
                </div>
                <Link href="/pme/messages" className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg">
                  <Icon name="chat" size={20} />
                  <span>Ouvrir la discussion</span>
                </Link>
              </div>
            </section>
          </AnimatedSection>
        )}

        <AnimatedSection delay={200}>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              { label: "Demandes en cours", value: demandesEnCours.length, icon: "chart", color: "text-blue-600 bg-blue-50" },
              { label: "Mentor actif", value: mentorActif ? "Oui" : "Non", icon: "mentor", color: "text-purple-600 bg-purple-50" },
              { label: "Mentors disponibles", value: mentors.length, icon: "users", color: "text-emerald-600 bg-emerald-50" },
              { label: "Satisfaction", value: mentorActif ? `${Number(mentorActif.noteMoyenne || 0).toFixed(1)}/5` : "—", icon: "star", color: "text-yellow-600 bg-yellow-50" },
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">{stat.label}</span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <Icon name={stat.icon as any} size={20} />
                  </div>
                </div>
                <span className="text-3xl font-black text-slate-900">{stat.value}</span>
              </div>
            ))}
          </section>
        </AnimatedSection>

        {mesDemandes.length > 0 && (
          <section className="flex flex-col gap-5">
            <AnimatedSection delay={250}>
              <h2 className="text-2xl font-bold text-slate-900">Mes demandes ({mesDemandes.length})</h2>
            </AnimatedSection>
            <div className="flex flex-col gap-4">
              {mesDemandes.map((d, i) => (
                <AnimatedSection key={d.id} delay={300 + i * 50}>
                  <div className="p-5 rounded-[1.5rem] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-primary flex items-center justify-center font-bold shrink-0">
                        {getInitials(d.cible ? `${d.cible.prenom} ${d.cible.nom}` : "Mentor")}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-base font-bold text-slate-900 truncate">{d.titre || "Demande de mentorat"}</span>
                        <span className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {d.cible ? `${d.cible.prenom} ${d.cible.nom}` : "Mentor"} • {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${getStatutColor(d.statut)}`}>
                        {getStatutLabel(d.statut)}
                      </span>
                      {(d.statut === "EN_ATTENTE" || d.statut === "VALIDEE") && (
                        <button onClick={() => handleAnnulerDemande(d.id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-xl border border-red-100 transition-colors" title="Annuler">
                          <Icon name="close" size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-6">
          <AnimatedSection delay={300}>
            <h2 className="text-2xl font-bold text-slate-900">Mentors consulaires disponibles</h2>
          </AnimatedSection>
          
          {mentors.length === 0 ? (
            <AnimatedSection delay={350}>
              <div className="text-center py-24 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-slate-200/80 shadow-sm">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <Icon name="mentor" size={40} className="text-slate-300" />
                </div>
                <p className="text-lg font-bold text-slate-700">Aucun mentor disponible</p>
              </div>
            </AnimatedSection>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((m, i) => {
                const isMyMentor = m.id === mentorActifId;
                const dejaDemande = mesDemandes.some((d) => d.cibleId === m.id && (d.statut === "EN_ATTENTE" || d.statut === "ACCEPTEE"));
                const photo = getImageUrl(m.photoProfil);
                
                return (
                  <AnimatedSection key={m.id} delay={350 + i * 50}>
                    <div className={`group rounded-[2rem] bg-white/80 backdrop-blur-xl p-6 border shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between gap-6 ${isMyMentor ? "border-emerald-500/50 ring-2 ring-emerald-500/20" : "border-slate-200/80"}`}>
                      <div className="flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                          {photo ? (
                            <img src={photo} alt={m.nom} className="w-16 h-16 rounded-[1rem] object-cover shadow-sm ring-2 ring-white" />
                          ) : (
                            <div className="w-16 h-16 rounded-[1rem] bg-primary/10 text-primary flex items-center justify-center font-black text-xl shadow-inner ring-2 ring-white">
                              {getInitials(`${m.prenom} ${m.nom}`)}
                            </div>
                          )}
                          {isMyMentor ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest">
                              <Icon name="check_circle" size={12} /> Mon mentor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Disponible
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <h3 className="text-xl font-bold text-slate-900">{m.prenom} {m.nom}</h3>
                          <p className="text-sm font-semibold text-primary">{m.domaineMentor}</p>
                          <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mt-1">{m.bioMentor}</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">{m.experienceMentor} ans d'exp.</span>
                          <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                            <Icon name="star" size={14} className="text-yellow-500" />
                            <span className="text-xs font-bold text-yellow-700">{Number(m.noteMoyenne || 0).toFixed(1)}/5</span>
                          </div>
                        </div>
                      </div>
                      
                      {isMyMentor ? (
                        <Link href="/pme/messages" className="w-full py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-bold text-center flex items-center justify-center gap-2 shadow-sm">
                          <Icon name="chat" size={18} /> Contacter
                        </Link>
                      ) : dejaDemande ? (
                        <button disabled className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 text-sm font-bold cursor-not-allowed border border-slate-200">
                          Demande en cours
                        </button>
                      ) : (
                        <button onClick={() => handleDemanderMentorat(m)} className="w-full py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-bold text-center flex items-center justify-center gap-2 shadow-md">
                                                    <Icon name="mentor" size={18} /> Demander un mentorat
                        </button>
                      )}
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal */}
        {modalOpen && selectedMentor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <span className="px-3 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider self-start border border-primary/20">
                    Formulaire Officiel CCI-F-32
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">
                    Demande de mentorat <br className="hidden sm:block" />
                    <span className="text-primary">{selectedMentor.prenom} {selectedMentor.nom}</span>
                  </h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
                  <Icon name="alert" size={20} className="shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Objet de la mission</label>
                  <input
                    type="text"
                    value={objet}
                    onChange={(e) => setObjet(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Ex: Accompagnement sur l'exportation"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Description du besoin</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    placeholder="Détaillez votre besoin pour que le mentor comprenne bien votre situation..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitDemande}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="refresh" size={18} className="animate-spin" />
                      <span>Envoi en cours...</span>
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
      </div>
    </div>
  );
}