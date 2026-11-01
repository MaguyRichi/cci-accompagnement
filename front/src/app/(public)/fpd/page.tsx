"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fpdApi } from "@/lib/api-services";
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

const METIERS_LABEL: Record<string, string> = {
  HOTELLERIE_TOURISME: "Hôtellerie & Tourisme",
  SECRETARIAT: "Secrétariat",
  GESTION_COMPTABILITE: "Gestion & Comptabilité",
  ASSISTANT_BANCAIRE: "Assistant Bancaire",
};

export default function FpdPublicPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await fpdApi.getSessionsPublic();
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur chargement sessions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSessions();
  }, []);

  return (
    // ✅ LE FOND DE LA PAGE RESTE CLAIR
    <div className="flex flex-col min-h-screen bg-slate-50 relative overflow-hidden py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      
      {/* ================= BACKGROUND PREMIUM (MESH GRADIENT CLAIR) ================= */}
      <div className="absolute inset-0 top-0 h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* ================= LAYOUT FLOTTANT SOMBRE ================= */}
      {/* C'est CE conteneur qui est sombre, pas le fond de la page */}
      <div className="w-full max-w-[1440px] mx-auto bg-slate-900 border border-slate-700/50 rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-slate-900/20 flex flex-col overflow-hidden text-slate-300">
        
        {/* ================= HEADER IMMERSIF ================= */}
        <section className="relative w-full px-6 sm:px-12 lg:px-16 pt-16 pb-12 lg:pt-24 lg:pb-16 border-b border-white/10">
          <AnimatedSection className="flex flex-col items-center text-center max-w-4xl mx-auto gap-6">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold tracking-wide shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Catalogue Officiel 2026
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.05]">
              L'excellence <br className="hidden sm:block" />
              <span className="font-light italic text-slate-500">par la</span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-primary">Formation.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed font-light">
              Découvrez les formations professionnelles duales certifiées par la CCI Haute Matsiatra. 
              Montez en compétences et obtenez des badges officiels reconnus par les entreprises.
            </p>

          </AnimatedSection>
        </section>

        {/* ================= GRILLE DES FORMATIONS ================= */}
        <section className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-12 lg:py-16">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 rounded-[2rem] bg-white/5 animate-pulse border border-white/5" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <AnimatedSection className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-[2rem] border border-white/10 text-center">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Icon name="school" size={48} className="text-slate-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">Aucune formation ouverte</h3>
              <p className="text-slate-400 max-w-md text-lg">Le catalogue est actuellement vide. Revenez bientôt pour découvrir de nouvelles opportunités.</p>
            </AnimatedSection>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sessions.map((s, i) => (
                <AnimatedSection key={s.id} delay={i * 100}>
                  {/* ✅ CARTES EN VERRE TRANSPARENT AVEC REFLET BLANC */}
                  <div className="group h-full flex flex-col bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgb(255,255,255,0.03)] hover:shadow-[0_8px_30px_rgb(255,255,255,0.1)] hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                    
                    <div className="p-8 pb-6 border-b border-white/10 relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full pointer-events-none" />
                      
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-widest border border-white/5">
                          {METIERS_LABEL[s.metier] || s.metier}
                        </span>
                        {s.placesRestantes > 0 ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md ring-1 ring-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ouvert
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md ring-1 ring-red-500/20">
                            Complet
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-extrabold text-white leading-tight group-hover:text-primary transition-colors">
                        {s.nom}
                      </h3>
                    </div>

                    <div className="p-8 flex-1 flex flex-col gap-6">
                      {s.description && (
                        <p className="text-base text-slate-400 line-clamp-3 leading-relaxed">
                          {s.description}
                        </p>
                      )}
                      
                      <div className="flex flex-col gap-4 mt-auto">
                        <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                            <Icon name="calendar" size={18} className="text-primary" />
                          </div>
                          <span>
                            Du <strong className="text-white">{new Date(s.dateDebut).toLocaleDateString("fr-FR")}</strong> <br />
                            au <strong className="text-white">{new Date(s.dateFin).toLocaleDateString("fr-FR")}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                            <Icon name="groups" size={18} className="text-primary" />
                          </div>
                          <span><strong className="text-white">{s.placesRestantes}</strong> places restantes sur {s.placesTotales}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white/[0.02] border-t border-white/10">
                      <Link
                        href="/connexion"
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/10 text-white text-sm font-bold shadow-sm hover:bg-primary hover:text-white transition-all duration-300 border border-white/5 hover:border-primary"
                      >
                        S'inscrire à cette formation
                        <Icon name="arrow-right" size={18} />
                      </Link>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}