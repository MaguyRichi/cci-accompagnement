"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fpdApi } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

const METIERS_LABEL: Record<string, string> = {
  HOTELLERIE_TOURISME: "Hôtellerie & Tourisme",
  SECRETARIAT: "Secrétariat",
  GESTION_COMPTABILITE: "Gestion & Comptabilité",
  ASSISTANT_BANCAIRE: "Assistant Bancaire",
};

function InscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSession = searchParams.get("session") || "";

  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    dateNaissance: "",
    genre: "M",
    adresse: "",
    niveauEtude: "BAC",
    sessionId: initialSession,
    motivation: "",
  });

  useEffect(() => {
    fpdApi.getSessionsPublic().then(setSessions).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await fpdApi.createCandidature({
        ...form,
        sessionId: form.sessionId ? Number(form.sessionId) : undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi de la candidature.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-[2rem] shadow-xl p-8 flex flex-col items-center text-center gap-5 border border-black/5">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Icon name="check" size={40} />
          </div>
          <h1 className="text-headline-md text-primary font-bold">Candidature envoyée !</h1>
          <p className="text-body-md text-on-surface-variant">
            Votre dossier a bien été enregistré. La CCI Haute Matsiatra vous contactera très prochainement par email ou par téléphone pour la suite.
          </p>
          <div className="flex flex-col w-full gap-2 mt-2">
            <Link href="/fpd" className="w-full px-6 py-3 rounded-xl bg-primary-container text-on-primary text-label-md font-bold hover:bg-primary transition-colors">
              Retour au programme
            </Link>
            <Link href="/" className="w-full px-6 py-3 rounded-xl bg-surface-container-low text-on-surface text-label-md font-medium hover:bg-surface-container-high transition-colors">
              Aller à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <Link href="/fpd" className="inline-flex items-center gap-1 text-label-sm text-outline hover:text-primary mb-6 transition-colors">
        <Icon name="arrow-back" size={16} /> Retour au programme
      </Link>

      <div className="bg-surface-container-lowest rounded-[2rem] shadow-xl border border-black/5 p-6 sm:p-10">
        <div className="flex flex-col gap-2 mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container text-label-sm font-semibold self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Formulaire officiel
          </span>
          <h1 className="text-headline-lg text-primary font-bold">Candidature FPD</h1>
          <p className="text-body-md text-on-surface-variant">
            Remplissez ce formulaire pour postuler à la Formation Professionnelle Duale de la CCIHM.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-body-sm flex gap-2">
            <Icon name="alert" size={20} className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nom *" value={form.nom} onChange={(v: string) => setForm({ ...form, nom: v })} required />
            <Input label="Prénom *" value={form.prenom} onChange={(v: string) => setForm({ ...form, prenom: v })} required />
            <Input label="Email *" type="email" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} required />
            <Input label="Téléphone *" value={form.telephone} onChange={(v: string) => setForm({ ...form, telephone: v })} required />
            <Input label="Date de naissance *" type="date" value={form.dateNaissance} onChange={(v: string) => setForm({ ...form, dateNaissance: v })} required />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-semibold text-on-surface">Genre *</label>
              <select value={form.genre} onChange={(e: any) => setForm({ ...form, genre: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-body-sm">
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          <Input label="Adresse *" value={form.adresse} onChange={(v: string) => setForm({ ...form, adresse: v })} required />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-semibold text-on-surface">Niveau d'étude *</label>
              <select value={form.niveauEtude} onChange={(e: any) => setForm({ ...form, niveauEtude: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-body-sm">
                <option value="CEPE">CEPE</option>
                <option value="BEPC">BEPC</option>
                <option value="BAC">BAC</option>
                <option value="BAC_PLUS_2">BAC+2</option>
                <option value="LICENCE">Licence</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-semibold text-on-surface">Session visée</label>
              <select value={form.sessionId} onChange={(e: any) => setForm({ ...form, sessionId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-body-sm">
                <option value="">Je ne sais pas encore</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom} ({METIERS_LABEL[s.metier]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-semibold text-on-surface">Motivation (optionnel)</label>
            <textarea
              value={form.motivation}
              onChange={(e: any) => setForm({ ...form, motivation: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-body-sm resize-none"
              placeholder="Pourquoi souhaitez-vous rejoindre cette formation ?"
            />
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3 mt-2">
            <Icon name="info" size={20} className="text-primary shrink-0 mt-0.5" />
            <p className="text-body-sm text-on-surface-variant">
              Aucun compte n'est requis pour candidater. La CCI vous contactera par email si votre dossier est retenu.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-4 rounded-xl bg-primary text-on-primary text-label-lg font-bold hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {isLoading ? <Icon name="refresh" size={20} className="animate-spin" /> : <Icon name="send" size={20} />}
            {isLoading ? "Envoi en cours..." : "Envoyer ma candidature"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string, value: string, onChange: (v: string) => void, type?: string, required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-sm font-semibold text-on-surface">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-body-sm"
      />
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Icon name="refresh" size={40} className="animate-spin text-primary" /></div>}>
      <InscriptionContent />
    </Suspense>
  );
}