"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";

/* ============================================
   COMPOSANT D'ANIMATION AU SCROLL
   ============================================ */
function AnimatedSection({ 
  children, 
  delay = 0, 
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Optionnel : arrêter d'observer une fois visible
          // observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ============================================
   PAGE PRINCIPALE
   ============================================ */
export default function HomePage() {
  const { user } = useAuth();

  const dashboardLink = user
    ? user.role === "ADMIN"
      ? "/admin/dashboard"
      : "/pme/dashboard"
    : "/connexion";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 overflow-hidden">
      
      {/* ================= HERO SECTION ================= */}
      {/* Le Hero s'anime au chargement (delay 0) */}
      <section className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-24 lg:pb-32">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Texte de gauche */}
          <AnimatedSection delay={100} className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-label-sm font-semibold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Plateforme Officielle CCI Haute Matsiatra
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Propulsez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">PME</span> vers l'excellence.
            </h1>

            <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
              Diagnostic 360°, mentorat personnalisé, formations FPD et opportunités de collaboration. 
              La CCI Haute Matsiatra digitalise l'accompagnement des entreprises malgaches.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-2">
              <Link
                href={dashboardLink}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white text-label-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 hover:bg-primary/90 transition-all duration-300"
              >
                {user ? "Accéder à mon espace" : "Rejoindre la plateforme"}
                <Icon name="arrow-right" size={20} />
              </Link>
              <Link
                href="/annuaire"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-700 text-label-lg font-bold border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-slate-50 transition-all duration-300"
              >
                Explorer l'annuaire
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-slate-200/60 w-full justify-center lg:justify-start">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900">500+</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">PME Accompagnées</span>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900">50+</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Mentors Experts</span>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900">1.2k</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Formations FPD</span>
              </div>
            </div>
          </AnimatedSection>

          {/* Image de droite */}
          <AnimatedSection delay={300} className="relative z-10 w-full max-w-lg mx-auto lg:max-w-none lg:ml-auto">
            <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
              <Image
                src="/images/hero-dashboard.jpg"
                alt="Tableau de bord CCI"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent mix-blend-overlay" />
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white flex items-center gap-4 animate-bounce-slow hidden sm:flex">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Icon name="check_circle" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800">Mentorat validé</span>
                <span className="text-xs text-slate-500">Il y a 2 minutes</span>
              </div>
            </div>
          </AnimatedSection>

        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section className="relative w-full bg-white border-y border-slate-200/60 py-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <AnimatedSection className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Tout ce dont votre PME a besoin, <br className="hidden sm:block" /> centralisé en un seul endroit.
            </h2>
            <p className="text-lg text-slate-600">
              Une suite d'outils conçus pour briser l'isolement des dirigeants et accélérer la croissance des entreprises de la région.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "chart",
                title: "Diagnostic 360°",
                desc: "Évaluez la maturité de votre entreprise sur 5 axes stratégiques et obtenez des recommandations personnalisées.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: "users",
                title: "Mentorat Expert",
                desc: "Connectez-vous avec des chefs d'entreprise expérimentés pour être guidé dans vos défis quotidiens.",
                color: "bg-purple-50 text-purple-600",
              },
              {
                icon: "school",
                title: "Formation FPD",
                desc: "Montez en compétences avec la Formation Professionnelle Duale et obtenez des badges certifiés par la CCI.",
                color: "bg-amber-50 text-amber-600",
              },
              {
                icon: "handshake",
                title: "Collaboration",
                desc: "Trouvez des partenaires commerciaux, échangez des bonnes pratiques et développez votre réseau.",
                color: "bg-emerald-50 text-emerald-600",
              }
            ].map((feature, i) => (
              <AnimatedSection key={i} delay={i * 150}>
                <div className="group h-full relative p-8 rounded-[1.5rem] bg-slate-50 border border-slate-200/60 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-2">
                  <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <Icon name={feature.icon as any} size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <AnimatedSection delay={200}>
          <div className="relative rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-10 sm:p-16 gap-10">
              <div className="flex flex-col gap-4 text-center lg:text-left max-w-2xl">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  Prêt à faire passer votre entreprise au niveau supérieur ?
                </h2>
                <p className="text-slate-300 text-lg">
                  Rejoignez des centaines de dirigeants qui ont déjà digitalisé leur accompagnement avec la CCI Haute Matsiatra.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <Link
                  href="/inscription"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors shadow-lg"
                >
                  S'inscrire maintenant
                </Link>
                <Link
                  href="/connexion"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-transparent text-white border border-slate-600 font-bold hover:bg-slate-800 transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

    </div>
  );
}