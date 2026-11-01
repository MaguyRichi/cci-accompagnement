"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authApi } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api";
import Icon from "@/components/ui/Icon";

type VerifyState =
  | { status: "loading" }
  | { status: "invalid"; raison: string }
  | {
      status: "valid";
      email: string;
      nom: string;
      prenom: string;
      role: string;
    };

function ActivationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verify, setVerify] = useState<VerifyState>({ status: "loading" });

  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /* ============================================
     VÉRIFICATION DU TOKEN AU CHARGEMENT
     ============================================ */
  useEffect(() => {
    if (!token) {
      setVerify({
        status: "invalid",
        raison:
          "Token manquant. Vérifiez le lien reçu par email ou contactez la CCI.",
      });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await authApi.verifyToken(token);
        if (cancelled) return;

        if (!res.valide) {
          setVerify({
            status: "invalid",
            raison: res.raison || "Lien invalide ou expiré.",
          });
        } else {
          setVerify({
            status: "valid",
            email: res.email || "",
            nom: res.nom || "",
            prenom: res.prenom || "",
            role: res.role || "",
          });
        }
      } catch (err: any) {
        if (cancelled) return;
        setVerify({
          status: "invalid",
          raison:
            getErrorMessage(err) ||
            "Impossible de vérifier le lien. Réessayez plus tard.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  /* ============================================
     SOUMISSION DU FORMULAIRE
     ============================================ */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token manquant");
      return;
    }

    if (motDePasse.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (motDePasse !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.activate({ token, motDePasse });
      setSuccess(true);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  /* ============================================
     ÉCRAN 1 — SUCCÈS
     ============================================ */
  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-sm p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <Icon name="check" size={44} />
          </div>
          <h1 className="text-headline-lg text-primary tracking-tight">
            Mot de passe créé avec succès
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Votre compte est maintenant prêt. Vous pouvez vous connecter avec
            votre email et le mot de passe que vous venez de définir.
          </p>
          <Link
            href="/connexion"
            className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors mt-4"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  /* ============================================
     ÉCRAN 2 — CHARGEMENT
     ============================================ */
  if (verify.status === "loading") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Icon name="refresh" size={40} className="text-primary animate-spin" />
          <p className="text-body-md text-on-surface-variant">
            Vérification du lien…
          </p>
        </div>
      </div>
    );
  }

  /* ============================================
     ÉCRAN 3 — TOKEN INVALIDE
     ============================================ */
  if (verify.status === "invalid") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-sm p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center">
            <Icon name="alert" size={44} />
          </div>
          <h1 className="text-headline-lg text-primary tracking-tight">
            Lien invalide ou expiré
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {verify.raison}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
            <Link
              href="/connexion"
              className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors"
            >
              Aller à la connexion
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-label-md font-semibold hover:bg-surface-container transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================
     ÉCRAN 4 — FORMULAIRE (TOKEN VALIDE)
     ============================================ */
  const roleLabel =
    verify.role === "MENTOR"
      ? "Mentor"
      : verify.role === "DIRIGEANT"
        ? "Dirigeant de PME"
        : verify.role;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Colonne gauche */}
      <div className="hidden lg:flex flex-col justify-between bg-primary-container text-on-primary p-12 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-surface-container-low/5 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="relative w-14 h-14 bg-surface-container-lowest rounded-xl p-1">
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

        <div className="relative z-10 flex flex-col gap-6 max-w-md">
          <h1 className="text-headline-xl tracking-tight leading-tight">
            Créez votre mot de passe
          </h1>
          <p className="text-body-lg text-primary-fixed">
            Votre dossier a été validé par un agent consulaire. Il ne vous reste
            qu&apos;une étape pour accéder à votre espace personnel.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            {[
              "Choisissez un mot de passe sécurisé",
              "Minimum 6 caractères",
              "Confirmez votre mot de passe",
              "Connectez-vous ensuite",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon name="check" size={20} className="text-secondary-fixed" />
                <span className="text-body-md text-primary-fixed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-label-sm text-primary-fixed">
          <Icon name="lock" size={18} />
          <span>Connexion sécurisée — Conforme RGPD</span>
        </div>
      </div>

      {/* Colonne droite */}
      <div className="flex flex-col justify-center bg-surface p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto flex flex-col gap-6">
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

          {/* Bandeau d'identification */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary-container text-on-secondary-container">
            <Icon name="user" size={22} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-label-md font-semibold">
                {verify.prenom} {verify.nom}
              </span>
              <span className="text-body-sm opacity-90">{verify.email}</span>
              <span className="text-label-sm opacity-75 mt-0.5">
                Rôle : {roleLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-code-sm text-outline uppercase tracking-wider">
              Activation du compte
            </span>
            <h1 className="text-headline-lg text-primary tracking-tight">
              Créer votre mot de passe
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Choisissez un mot de passe sécurisé pour votre compte.
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
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  <Icon name="lock" size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-surface-container-low text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container transition-all disabled:opacity-50"
                  placeholder="Minimum 6 caractères"
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

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-semibold text-on-surface">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  <Icon name="lock" size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-surface-container-low text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container transition-all disabled:opacity-50"
                  placeholder="Répétez le mot de passe"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Icon name="refresh" size={20} className="animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Icon name="check" size={20} />
                  <span>Créer mon mot de passe</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 pt-2 text-label-sm text-outline">
            <Link
              href="/connexion"
              className="hover:text-primary flex items-center gap-1"
            >
              <Icon name="arrow-back" size={16} />
              <span>Retour à la connexion</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <Icon name="refresh" size={40} className="text-primary animate-spin" />
        </div>
      }
    >
      <ActivationContent />
    </Suspense>
  );
}