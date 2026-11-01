"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { annuaireApi, getImageUrl } from "@/lib/api-services";
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

export default function AnnuairePage() {
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await annuaireApi.get({ q: search });
        setEntreprises(res.data || []);
      } catch (err) {
        console.error("Erreur annuaire:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      loadData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  return (
    // ✅ LE FOND DE LA PAGE RESTE CLAIR
    <div className="flex flex-col min-h-screen bg-slate-50 relative overflow-hidden py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      
      {/* ================= BACKGROUND PREMIUM (MESH GRADIENT CLAIR) ================= */}
      <div className="absolute inset-0 top-0 h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* ================= LAYOUT FLOTTANT SOMBRE ================= */}
      <div className="w-full max-w-[1440px] mx-auto bg-slate-900 border border-slate-700/50 rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-slate-900/20 flex flex-col overflow-hidden text-slate-300">
        
        {/* ================= HEADER IMMERSIF & RECHERCHE ================= */}
        <section className="relative w-full px-6 sm:px-12 lg:px-16 pt-16 pb-12 lg:pt-24 lg:pb-16 border-b border-white/10">
          <AnimatedSection className="flex flex-col items-center text-center max-w-4xl mx-auto gap-6">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold tracking-wide shadow-sm">
              <Icon name="building" size={16} className="text-primary" />
              Répertoire Officiel des PME
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.05]">
              Découvrez <span className="font-light italic text-slate-500">les</span> <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-300 to-blue-400">Pépites Locales.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed font-light">
              Explorez l'écosystème des entreprises accompagnées par la CCI Haute Matsiatra. 
              Trouvez des partenaires, des fournisseurs ou des clients potentiels.
            </p>

            {/* Barre de recherche Premium (Glassmorphism sombre) */}
            <div className="relative w-full max-w-2xl mt-4 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-indigo-500/30 rounded-2xl blur-lg opacity-40 group-hover:opacity-100 transition duration-500" />
              <div className="relative flex items-center bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                <div className="pl-6 text-slate-400">
                  <Icon name="search" size={24} />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une entreprise, un secteur, une ville..."
                  className="w-full pl-4 pr-6 py-5 bg-transparent text-white text-lg focus:outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

          </AnimatedSection>
        </section>

        {/* ================= GRILLE DES ENTREPRISES ================= */}
        <section className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-12 lg:py-16">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-80 rounded-[2rem] bg-white/5 animate-pulse border border-white/5" />
              ))}
            </div>
          ) : entreprises.length === 0 ? (
            <AnimatedSection className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-[2rem] border border-white/10 text-center">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Icon name="search" size={48} className="text-slate-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">Aucun résultat</h3>
              <p className="text-slate-400 max-w-md text-lg">Nous n'avons trouvé aucune entreprise correspondant à votre recherche.</p>
            </AnimatedSection>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {entreprises.map((ent, i) => (
                <AnimatedSection key={ent.id} delay={(i % 8) * 50}>
                  <Link href={`/entreprise/${ent.id}`} className="group block h-full">
                    {/* ✅ CARTE EN VERRE TRANSPARENT AVEC REFLET BLANC */}
                    <div className="h-full flex flex-col bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgb(255,255,255,0.03)] hover:shadow-[0_8px_30px_rgb(255,255,255,0.1)] hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                      
                      <div className="relative h-36 bg-slate-800 overflow-hidden">
                        {ent.photoCouverture ? (
                          <img src={getImageUrl(ent.photoCouverture) || ""} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-slate-800 via-slate-700 to-slate-800" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                        
                        {ent.verifie && (
                          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider border border-emerald-500/30">
                            <Icon name="verified" size={14} /> Vérifié
                          </div>
                        )}
                      </div>

                      <div className="relative px-6 -mt-10 mb-4">
                        <div className="w-20 h-20 rounded-2xl bg-slate-800/80 backdrop-blur-md p-1.5 shadow-xl ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                          {ent.logo ? (
                            <img src={getImageUrl(ent.logo) || ""} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center text-primary font-black text-2xl">
                              {ent.raisonSociale?.[0]}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-6 pb-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-1 mb-1">
                          {ent.raisonSociale}
                        </h3>
                        <span className="text-sm text-slate-400 font-medium mb-4 line-clamp-1">{ent.secteur}</span>
                        
                        <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2.5 text-sm text-slate-400 font-medium">
                            <Icon name="location" size={18} className="text-slate-500 shrink-0" />
                            <span className="truncate">{ent.ville}, {ent.region}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm text-slate-400 font-medium">
                            <Icon name="users" size={18} className="text-slate-500 shrink-0" />
                            <span>{ent.effectif ? `${ent.effectif} employés` : "Effectif non renseigné"}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}