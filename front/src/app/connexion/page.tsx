"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
import Icon from "@/components/ui/Icon";

export default function ConnexionPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (user.role === "MENTOR") {
        router.push("/pme/mentorat");
      } else {
        router.push("/pme/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login(email, motDePasse);

      if (response.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (response.user.role === "MENTOR") {
        router.push("/pme/mentorat");
      } else {
        router.push("/pme/dashboard");
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* ============================================
          COLONNE GAUCHE — IMAGE connex.jpg
          ============================================ */}
      <div className="hidden lg:flex relative overflow-hidden">
        {/* Image de fond */}
        <Image
          src="/images/connex.jpg"
          alt="CCI Haute Matsiatra — Accompagnement des PME"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />

        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40"></div>

        {/* Motif décoratif */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('/images/pattern-bg.png')",
            backgroundSize: "300px",
            backgroundRepeat: "repeat",
          }}
        ></div>

        {/* Contenu par-dessus */}
        <div className="relative z-10 flex flex-col justify-between text-on-primary p-12 w-full">
          {/* Logo en haut */}
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 bg-surface-container-lowest rounded-xl p-1 shadow-lg">
              <Image
                src="/logo.jpg"
                alt="CCI Haute Matsiatra"
                fill
                sizes="56px"
                className="object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-title-lg tracking-tight">
                CCI Haute Matsiatra
              </span>
              <span className="text-label-sm text-primary-fixed">
                Matsiatra Ambony
              </span>
            </div>
          </div>

          {/* Message central */}
          <div className="flex flex-col gap-6 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest/20 backdrop-blur-sm self-start">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed"></span>
              <span className="text-label-sm font-medium">
                Portail officiel sécurisé
              </span>
            </div>

            <h1 className="text-headline-xl tracking-tight leading-tight">
              Bienvenue sur la plateforme d&apos;accompagnement
            </h1>
            <p className="text-body-lg text-primary-fixed">
              Accédez à votre espace personnel pour piloter le diagnostic, le
              mentorat et la croissance de votre PME.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              {[
                "Diagnostic 360° personnalisé",
                "Mentorat par des experts agréés",
                "Suivi administratif et cotisations",
                "Collaborations inter-entreprises",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary-fixed/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon
                      name="check"
                      size={14}
                      className="text-secondary-fixed"
                    />
                  </div>
                  <span className="text-body-md text-primary-fixed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-label-sm text-primary-fixed">
            <Icon name="verify" size={18} />
            <span>
              Conforme aux décrets consulaires 2023-145 — Exercice 2026
            </span>
          </div>
        </div>
      </div>

      {/* ============================================
          COLONNE DROITE — FORMULAIRE
          ============================================ */}
      <div className="flex flex-col justify-center bg-surface p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto flex flex-col gap-8">
          <Link href="/" className="flex lg:hidden items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/logo.jpg"
                alt="CCI Haute Matsiatra"
                fill
                sizes="48px"
                className="object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-title-md text-primary">CCI Matsiatra</span>
              <span className="text-label-sm text-on-surface-variant">
                Matsiatra Ambony
              </span>
            </div>
          </Link>

          <div className="flex flex-col gap-2">
            <span className="text-code-sm text-outline uppercase tracking-wider">
              Accès sécurisé
            </span>
            <h1 className="text-headline-lg text-primary tracking-tight">
              Connexion à votre espace
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Saisissez vos identifiants pour accéder à votre tableau de bord.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-error-container text-on-error-container">
              <Icon name="alert" size={20} className="shrink-0 mt-0.5" />
              <span className="text-body-sm">{error}</span>
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  <Icon name="mail" size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  // ✅ Contrôle strict : bloque les espaces
                  onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container-low text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container transition-all disabled:opacity-50"
                  placeholder="vous@entreprise.mg"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-label-md font-semibold text-on-surface">
                  Mot de passe
                </label>
                <a
                  href="#"
                  className="text-label-sm text-primary hover:underline font-medium"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  <Icon name="lock" size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-surface-container-low text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container transition-all disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <Icon name="eye" size={20} />
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-primary-container"
              />
              <span className="text-body-sm text-on-surface-variant">
                Se souvenir de moi sur cet appareil
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Icon name="refresh" size={20} className="animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <Icon name="lock" size={20} />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-container-low"></div>
            <span className="text-label-sm text-outline">
              Première visite ?
            </span>
            <div className="flex-1 h-px bg-surface-container-low"></div>
          </div>

          <Link
            href="/inscription"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-low text-on-surface text-label-md font-medium hover:bg-surface-container-high transition-colors"
          >
            <Icon name="plus" size={20} />
            <span>Créer un compte adhérent</span>
          </Link>

          <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-2">
            <Icon
              name="help"
              size={20}
              className="text-primary shrink-0 mt-0.5"
            />
            <div className="flex flex-col gap-1">
              <span className="text-label-sm font-semibold text-on-surface">
                Besoin d&apos;assistance ?
              </span>
              <span className="text-body-sm text-on-surface-variant">
                Contactez le Guichet Unique :{" "}
                <a
                  href="mailto:appui-pme@cci-matsiatra.mg"
                  className="text-primary hover:underline"
                >
                  appui-pme@cci-matsiatra.mg
                </a>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 text-label-sm text-outline">
            <Link
              href="/"
              className="hover:text-primary flex items-center gap-1"
            >
              <Icon name="arrow-back" size={16} />
              <span>Retour à l&apos;accueil</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}