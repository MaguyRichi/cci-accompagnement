"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  authApi,
  RegisterDirigeantPayload,
  RegisterMentorPayload,
} from "@/lib/auth";
import { getErrorMessage } from "@/lib/api";
import Icon from "@/components/ui/Icon";

type ProfileType = "dirigeant" | "mentor";
type Step = 1 | 2 | 3 | 4;

export default function InscriptionPage() {
  const [profile, setProfile] = useState<ProfileType>("dirigeant");
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");

  const [raisonSociale, setRaisonSociale] = useState("");
  const [nif, setNif] = useState("");
  const [stat, setStat] = useState("");
  const [formeJuridique, setFormeJuridique] = useState("SARL");
  const [secteur, setSecteur] = useState("");
  const [taille, setTaille] = useState("TPE");
  const [effectif, setEffectif] = useState<number | "">("");
  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [description, setDescription] = useState("");

  const [domaineMentor, setDomaineMentor] = useState("");
  const [experienceMentor, setExperienceMentor] = useState<number | "">("");
  const [bioMentor, setBioMentor] = useState("");
  const [disponibilite, setDisponibilite] = useState("TEMPS_PARTIEL");

  // ✅ Fonctions de contrôle strict avant saisie
  const handleTextOnly = (value: string, setter: (val: string) => void) => {
    // Autorise uniquement les lettres (accents inclus) et les tirets/espaces
    const filtered = value.replace(/[^a-zA-ZÀ-ÿ\s-]/g, "");
    setter(filtered);
  };

  const handlePhone = (value: string) => {
    // Autorise les chiffres, +, espaces et tirets
    const filtered = value.replace(/[^0-9+\s-]/g, "");
    setTelephone(filtered);
  };

  const handleNumberOnly = (value: string, setter: (val: number | "") => void) => {
    if (value === "") {
      setter("");
      return;
    }
    // Autorise uniquement les chiffres
    const filtered = value.replace(/[^0-9]/g, "");
    if (filtered !== "") {
      setter(Number(filtered));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (profile === "dirigeant") {
        const payload: RegisterDirigeantPayload = {
          nom,
          prenom,
          email,
          telephone,
          raisonSociale,
          nif,
          stat,
          formeJuridique,
          secteur,
          taille,
          effectif: effectif ? Number(effectif) : undefined,
          adresse,
          ville,
          description,
        };
        const res = await authApi.registerDirigeant(payload);
        setSuccessRef(`CCI-HM-2026-${res.email.slice(0, 4).toUpperCase()}`);
      } else {
        const payload: RegisterMentorPayload = {
          nom,
          prenom,
          email,
          telephone,
          domaineMentor,
          experienceMentor: experienceMentor ? Number(experienceMentor) : 0,
          bioMentor,
          disponibilite,
        };
        await authApi.registerMentor(payload);
        setSuccessRef(`MENTOR-2026-${email.slice(0, 4).toUpperCase()}`);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-sm p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <Icon name="check" size={44} />
          </div>
          <h1 className="text-headline-lg text-primary tracking-tight">
            Dossier transmis avec succès
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Votre demande a été enregistrée sous la référence{" "}
            <strong className="font-code-sm text-on-surface">
              {successRef}
            </strong>
            . Un agent consulaire va examiner votre dossier sous 48 heures
            ouvrées.
          </p>
          <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-2 text-left w-full">
            <Icon
              name="mail"
              size={20}
              className="text-primary shrink-0 mt-0.5"
            />
            <p className="text-body-sm text-on-surface-variant">
              Un email d&apos;activation vous sera envoyé dès validation de
              votre dossier pour créer votre mot de passe personnel.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-label-md hover:bg-surface-container-high transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/connexion"
              className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors"
            >
              Connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-40 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1440px] mx-auto h-full px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
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
          <Link
            href="/connexion"
            className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-label-md hover:bg-surface-container-high transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ============================================
            BANNIÈRE IMAGE
            ============================================ */}
        <div className="relative w-full h-48 lg:h-64 overflow-hidden">
          <Image
            src="/images/hero-dashboard.jpg"
            alt="Inscription CCI Haute Matsiatra"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-primary/30"></div>
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="flex flex-col items-center text-center gap-2 max-w-2xl">
              <span className="px-3 py-1 rounded-full bg-surface-container-lowest/20 backdrop-blur-sm text-label-sm text-on-primary font-medium">
                Formulaire Officiel CCI-F-31 — 2026
              </span>
              <h1 className="text-headline-lg lg:text-headline-xl text-on-primary tracking-tight">
                Inscription à la plateforme consulaire
              </h1>
              <p className="text-body-md lg:text-body-lg text-primary-fixed">
                Créez votre compte adhérent auprès de la CCI Haute Matsiatra
              </p>
            </div>
          </div>
        </div>

        {/* ============================================
            CONTENU FORMULAIRE
            ============================================ */}
        <div className="py-12">
          <div className="max-w-4xl mx-auto px-8">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-error-container text-on-error-container mb-6">
                <Icon name="alert" size={20} className="shrink-0 mt-0.5" />
                <span className="text-body-sm">{error}</span>
              </div>
            )}

            {step === 1 && (
              <div className="mb-8">
                <h2 className="text-title-lg text-primary mb-3">
                  Je m&apos;inscris en tant que
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setProfile("dirigeant")}
                    className={`flex items-start gap-4 p-5 rounded-xl text-left transition-all ${
                      profile === "dirigeant"
                        ? "bg-surface-container-low shadow-md ring-2 ring-primary-container"
                        : "bg-surface-container-lowest shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        profile === "dirigeant"
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container text-primary"
                      }`}
                    >
                      <Icon name="domain" size={26} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-title-md text-on-surface font-semibold">
                        Dirigeant de PME
                      </span>
                      <span className="text-body-sm text-on-surface-variant">
                        Inscrivez votre entreprise et accédez aux services
                        consulaires.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfile("mentor")}
                    className={`flex items-start gap-4 p-5 rounded-xl text-left transition-all ${
                      profile === "mentor"
                        ? "bg-surface-container-low shadow-md ring-2 ring-primary-container"
                        : "bg-surface-container-lowest shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        profile === "mentor"
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container text-primary"
                      }`}
                    >
                      <Icon name="mentor" size={26} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-title-md text-on-surface font-semibold">
                        Mentor / Expert
                      </span>
                      <span className="text-body-sm text-on-surface-variant">
                        Proposez votre expertise et accompagnez les PME.
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6 bg-surface-container-low/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-md font-semibold text-primary">
                    Étape {step} sur 4
                  </span>
                  <span className="text-code-sm text-outline">
                    {step === 1 && "Informations personnelles"}
                    {step === 2 &&
                      (profile === "mentor"
                        ? "Profil expert"
                        : "Informations entreprise")}
                    {step === 3 && "Pièces justificatives"}
                    {step === 4 && "Confirmation"}
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-container rounded-full transition-all duration-500"
                    style={{ width: `${(step / 4) * 100}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[
                    { n: 1, l: "Identité" },
                    {
                      n: 2,
                      l: profile === "mentor" ? "Expertise" : "Entreprise",
                    },
                    { n: 3, l: "Documents" },
                    { n: 4, l: "Validation" },
                  ].map((s) => (
                    <div
                      key={s.n}
                      className={`flex items-center gap-1.5 text-label-sm ${
                        step >= s.n ? "text-primary font-semibold" : "text-outline"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                          step > s.n
                            ? "bg-secondary text-on-secondary"
                            : step === s.n
                              ? "bg-primary-container text-on-primary"
                              : "bg-surface-container text-outline"
                        }`}
                      >
                        {step > s.n ? "✓" : s.n}
                      </span>
                      <span className="hidden sm:block truncate">{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 flex flex-col gap-6">
                {step === 1 && (
                  <>
                    <h2 className="text-title-lg text-primary">
                      Informations personnelles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Nom *
                        </label>
                        <input
                          type="text"
                          value={nom}
                          // ✅ Contrôle strict
                          onChange={(e) => handleTextOnly(e.target.value, setNom)}
                          required
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="Ex: Rakoto"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Prénom *
                        </label>
                        <input
                          type="text"
                          value={prenom}
                          // ✅ Contrôle strict
                          onChange={(e) => handleTextOnly(e.target.value, setPrenom)}
                          required
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="Ex: Jean"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Adresse email *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="Ex: jean.rakoto@email.mg"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Téléphone *
                        </label>
                        <input
                          type="tel"
                          value={telephone}
                          // ✅ Contrôle strict
                          onChange={(e) => handlePhone(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="+261 34 12 345 67"
                        />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-container-low flex items-start gap-2">
                      <Icon
                        name="info"
                        size={20}
                        className="text-primary shrink-0 mt-0.5"
                      />
                      <p className="text-body-sm text-on-surface-variant">
                        Ces informations permettront de créer votre compte.
                        Votre mot de passe sera défini après validation du
                        dossier par un agent consulaire.
                      </p>
                    </div>
                  </>
                )}

                {step === 2 && profile === "dirigeant" && (
                  <>
                    <h2 className="text-title-lg text-primary">
                      Informations de l&apos;entreprise
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-label-md font-semibold text-on-surface">
                          Raison sociale *
                        </label>
                        <input
                          type="text"
                          value={raisonSociale}
                          onChange={(e) => setRaisonSociale(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="Ex: Matsiatra Craft & Tissage"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          NIF *
                        </label>
                        <input
                          type="text"
                          value={nif}
                          onChange={(e) => setNif(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container font-code-sm"
                          placeholder="3001849201"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          STAT *
                        </label>
                        <input
                          type="text"
                          value={stat}
                          onChange={(e) => setStat(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container font-code-sm"
                          placeholder="13211-31-2018-0-00452"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Forme juridique
                        </label>
                        <select
                          value={formeJuridique}
                          onChange={(e) => setFormeJuridique(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                        >
                          <option>SARL</option>
                          <option>SA</option>
                          <option>EURL</option>
                          <option>Entreprise Individuelle</option>
                          <option>Coopérative</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Taille
                        </label>
                        <select
                          value={taille}
                          onChange={(e) => setTaille(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                        >
                          <option value="TPE">
                            TPE (moins de 10 employés)
                          </option>
                          <option value="PE">PE (10-49 employés)</option>
                          <option value="ME">ME (50-249 employés)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Secteur *
                        </label>
                        <select
                          value={secteur}
                          onChange={(e) => setSecteur(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                        >
                          <option value="">-- Sélectionner --</option>
                          <option>Agroalimentaire</option>
                          <option>Artisanat & Textile</option>
                          <option>Numérique & IT</option>
                          <option>BTP & Construction</option>
                          <option>Commerce & Distribution</option>
                          <option>Services</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Effectif
                        </label>
                        <input
                          type="number"
                          value={effectif}
                          // ✅ Contrôle strict (chiffres uniquement)
                          onChange={(e) => handleNumberOnly(e.target.value, setEffectif)}
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="14"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-label-md font-semibold text-on-surface">
                          Adresse du siège
                        </label>
                        <input
                          type="text"
                          value={adresse}
                          onChange={(e) => setAdresse(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="Ex: Lot VA 12 Ampasambazaha"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Ville
                        </label>
                        <input
                          type="text"
                          value={ville}
                          onChange={(e) => setVille(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="Fianarantsoa"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Région
                        </label>
                        <input
                          type="text"
                          value="Haute Matsiatra"
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-on-surface-variant text-body-md cursor-not-allowed"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-label-md font-semibold text-on-surface">
                          Description de l&apos;activité
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-outline"
                          placeholder="Présentez votre entreprise, vos produits, votre savoir-faire..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && profile === "mentor" && (
                  <>
                    <h2 className="text-title-lg text-primary">Profil expert</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-label-md font-semibold text-on-surface">
                          Domaine d&apos;expertise *
                        </label>
                        <input
                          type="text"
                          value={domaineMentor}
                          onChange={(e) => setDomaineMentor(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="Ex: Export & Normes APE"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Années d&apos;expérience *
                        </label>
                        <input
                          type="number"
                          value={experienceMentor}
                          // ✅ Contrôle strict (chiffres uniquement)
                          onChange={(e) => handleNumberOnly(e.target.value, setExperienceMentor)}
                          required
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                          placeholder="15"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md font-semibold text-on-surface">
                          Disponibilité
                        </label>
                        <select
                          value={disponibilite}
                          onChange={(e) => setDisponibilite(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                        >
                          <option value="TEMPS_PLEIN">Temps plein</option>
                          <option value="TEMPS_PARTIEL">Temps partiel</option>
                          <option value="OCCASIONNEL">Occasionnel</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-label-md font-semibold text-on-surface">
                          Biographie professionnelle *
                        </label>
                        <textarea
                          value={bioMentor}
                          onChange={(e) => setBioMentor(e.target.value)}
                          required
                          rows={4}
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-outline"
                          placeholder="Décrivez votre parcours, vos compétences et votre approche du mentorat..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2 className="text-title-lg text-primary">
                      Pièces justificatives
                    </h2>
                    <p className="text-body-sm text-on-surface-variant">
                      Vous pourrez téléverser vos documents après validation du
                      dossier depuis votre espace personnel.
                    </p>
                    <div className="p-4 rounded-lg bg-surface-container-low flex items-start gap-2">
                      <Icon
                        name="info"
                        size={20}
                        className="text-primary shrink-0 mt-0.5"
                      />
                      <p className="text-body-sm text-on-surface-variant">
                        {profile === "dirigeant"
                          ? "Documents requis : NIF, STAT, RCS, attestation CNaPS."
                          : "Documents requis : CV, diplômes / certifications, pièce d'identité."}
                      </p>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <h2 className="text-title-lg text-primary">
                      Récapitulatif et validation
                    </h2>
                    <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-label-md text-outline">
                          Type de compte
                        </span>
                        <span className="text-label-md font-semibold text-on-surface">
                          {profile === "dirigeant"
                            ? "Dirigeant de PME"
                            : "Mentor / Expert"}
                        </span>
                      </div>
                      <div className="h-px bg-surface-container-high"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-md text-outline">Email</span>
                        <span className="text-label-md font-semibold text-on-surface">
                          {email}
                        </span>
                      </div>
                      <div className="h-px bg-surface-container-high"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-md text-outline">
                          Nom complet
                        </span>
                        <span className="text-label-md font-semibold text-on-surface">
                          {prenom} {nom}
                        </span>
                      </div>
                      <div className="h-px bg-surface-container-high"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-md text-outline">
                          Exercice
                        </span>
                        <span className="text-label-md font-semibold text-secondary">
                          2026
                        </span>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        className="mt-1 w-4 h-4 accent-primary-container"
                      />
                      <span className="text-body-sm text-on-surface-variant">
                        Je certifie l&apos;exactitude des informations fournies
                        et j&apos;accepte les conditions générales
                        d&apos;utilisation de la plateforme consulaire.
                        <span className="text-error ml-1">*</span>
                      </span>
                    </label>
                  </>
                )}
              </div>

              <div className="p-6 bg-surface-container-low/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
                  disabled={step === 1}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-label-md hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="arrow-back" size={18} />
                  <span>Précédent</span>
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(4, s + 1) as Step)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md font-semibold hover:bg-primary transition-colors shadow-sm"
                  >
                    <span>Suivant</span>
                    <Icon name="arrow-right" size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-secondary text-on-secondary text-label-md font-semibold hover:opacity-95 transition-opacity shadow-sm disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Icon name="refresh" size={18} className="animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="check" size={18} />
                        <span>Valider mon inscription</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}