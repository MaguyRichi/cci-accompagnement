"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fpdApi } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

const METIERS_LABEL: Record<string, string> = {
  HOTELLERIE_TOURISME: "Hôtellerie & Tourisme",
  SECRETARIAT: "Secrétariat",
  GESTION_COMPTABILITE: "Gestion & Comptabilité",
  ASSISTANT_BANCAIRE: "Assistant Bancaire",
};

const STATUT_COLORS: Record<string, string> = {
  EN_COURS: "bg-amber-100 text-amber-700",
  TERMINEE: "bg-blue-100 text-blue-700",
  VALIDEE_PAR_MENTOR: "bg-emerald-100 text-emerald-700",
  ABANDON: "bg-red-100 text-red-700",
};

const STATUT_LABELS: Record<string, string> = {
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  VALIDEE_PAR_MENTOR: "Validée (mentor)",
  ABANDON: "Abandon",
};

export default function AdminFpdPage() {
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [tab, setTab] = useState<"inscriptions" | "sessions">("inscriptions");
  const [isLoading, setIsLoading] = useState(true);

  const [showModalSession, setShowModalSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    nom: "",
    metier: "HOTELLERIE_TOURISME",
    dateDebut: "",
    dateFin: "",
    placesTotales: 20,
    lieuFormation: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, sess, insc] = await Promise.all([
        fpdApi.getStats(),
        fpdApi.getAllSessions({ limit: 100 }),
        fpdApi.getAllInscriptions({ limit: 100 }),
      ]);
      setStats(s);
      setSessions(sess.data || []);
      setInscriptions(insc.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSession = async () => {
    if (!sessionForm.nom || !sessionForm.dateDebut || !sessionForm.dateFin) {
      setError("Remplissez tous les champs obligatoires.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await fpdApi.createSession(sessionForm);
      setShowModalSession(false);
      setSessionForm({
        nom: "",
        metier: "HOTELLERIE_TOURISME",
        dateDebut: "",
        dateFin: "",
        placesTotales: 20,
        lieuFormation: "",
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur");
    } finally {
      setIsSaving(false);
    }
  };

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-code-sm text-outline uppercase tracking-wider">Administration</span>
            <h1 className="text-headline-lg text-primary tracking-tight">
              Formation FPD
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Gérez les sessions et les inscriptions des dirigeants.
            </p>
          </div>
          <Link
            href="/fpd"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-label-md font-medium hover:bg-surface-container transition-colors"
          >
            <Icon name="eye" size={18} /> Vue publique
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon="calendar"
              label="Sessions"
              value={stats.totalSessions}
              accent="primary"
            />
            <StatCard
              icon="groups"
              label="Inscriptions totales"
              value={stats.totalInscriptions}
              accent="primary"
            />
            <StatCard
              icon="pending_actions"
              label="En cours"
              value={stats.totalEnCours}
              accent="amber"
            />
            <StatCard
              icon="workspace_premium"
              label="Validées"
              value={stats.totalValidees}
              accent="emerald"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-container-lowest p-1.5 rounded-xl w-fit border border-black/5">
          <button
            onClick={() => setTab("inscriptions")}
            className={`px-5 py-2 rounded-lg text-label-md font-semibold transition-all ${
              tab === "inscriptions"
                ? "bg-surface-container-high text-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            Inscriptions ({inscriptions.length})
          </button>
          <button
            onClick={() => setTab("sessions")}
            className={`px-5 py-2 rounded-lg text-label-md font-semibold transition-all ${
              tab === "sessions"
                ? "bg-surface-container-high text-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            Sessions ({sessions.length})
          </button>
        </div>

        {/* TAB INSCRIPTIONS */}
        {tab === "inscriptions" && (
          <div className="bg-surface-container-lowest rounded-2xl border border-black/5 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-[10px] uppercase tracking-wider text-outline font-bold">
                  <tr>
                    <th className="px-5 py-3">Dirigeant</th>
                    <th className="px-5 py-3">Entreprise</th>
                    <th className="px-5 py-3">Formation</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Mentor validateur</th>
                    <th className="px-5 py-3 text-right">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {inscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-on-surface-variant">
                        Aucune inscription pour l'instant.
                      </td>
                    </tr>
                  ) : (
                    inscriptions.map((i) => (
                      <tr key={i.id} className="hover:bg-surface-container-low/50">
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <span className="text-label-md text-on-surface font-semibold">
                              {i.utilisateur?.prenom} {i.utilisateur?.nom}
                            </span>
                            <span className="text-code-sm text-outline">
                              {i.utilisateur?.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-body-sm">
                          {i.entreprise?.raisonSociale || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <span className="text-body-sm text-on-surface font-medium">
                              {METIERS_LABEL[i.session?.metier] || i.session?.metier || "—"}
                            </span>
                            <span className="text-code-sm text-outline">
                              {i.session?.nom}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              STATUT_COLORS[i.statut] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {STATUT_LABELS[i.statut] || i.statut}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-body-sm text-on-surface-variant">
                          {i.mentorValidateur
                            ? `${i.mentorValidateur.prenom} ${i.mentorValidateur.nom}`
                            : "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {i.noteMentor ? (
                            <span className="text-body-sm font-bold text-emerald-600">
                              {i.noteMentor}/20
                            </span>
                          ) : (
                            <span className="text-code-sm text-outline">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB SESSIONS */}
        {tab === "sessions" && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setShowModalSession(true)}
              className="self-end flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm"
            >
              <Icon name="plus" size={18} /> Nouvelle session
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-black/5 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary text-[10px] font-bold uppercase">
                      {METIERS_LABEL[s.metier] || s.metier}
                    </span>
                    <span className="text-code-sm text-outline font-semibold">
                      {s.placesRestantes}/{s.placesTotales} places
                    </span>
                  </div>
                  <h3 className="text-title-md text-on-surface font-semibold">{s.nom}</h3>
                  <div className="flex flex-col gap-1 text-code-sm text-outline">
                    <span>Du {new Date(s.dateDebut).toLocaleDateString("fr-FR")} au {new Date(s.dateFin).toLocaleDateString("fr-FR")}</span>
                    <span>{s.lieuFormation || "CCI Haute Matsiatra"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Nouvelle Session */}
      {showModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg text-primary">Nouvelle session FPD</h2>
              <button
                onClick={() => setShowModalSession(false)}
                className="p-2 rounded-lg hover:bg-surface-container"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error-container text-on-error-container text-body-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Nom de la session *"
                value={sessionForm.nom}
                onChange={(v) => setSessionForm({ ...sessionForm, nom: v })}
                placeholder="Ex: Promotion 2026 - Hôtellerie"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm font-semibold">Métier</label>
                <select
                  value={sessionForm.metier}
                  onChange={(e) => setSessionForm({ ...sessionForm, metier: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-body-sm"
                >
                  {Object.entries(METIERS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date début *"
                  type="date"
                  value={sessionForm.dateDebut}
                  onChange={(v) => setSessionForm({ ...sessionForm, dateDebut: v })}
                />
                <Input
                  label="Date fin *"
                  type="date"
                  value={sessionForm.dateFin}
                  onChange={(v) => setSessionForm({ ...sessionForm, dateFin: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Places"
                  type="number"
                  value={sessionForm.placesTotales}
                  onChange={(v) => setSessionForm({ ...sessionForm, placesTotales: Number(v) })}
                />
                <Input
                  label="Lieu"
                  value={sessionForm.lieuFormation}
                  onChange={(v) => setSessionForm({ ...sessionForm, lieuFormation: v })}
                  placeholder="CCI Fianarantsoa"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModalSession(false)}
                className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateSession}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold disabled:opacity-50"
              >
                {isSaving ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent }: any) {
  const colors: any = {
    primary: "text-primary bg-primary/10",
    amber: "text-amber-700 bg-amber-100",
    emerald: "text-emerald-700 bg-emerald-100",
  };
  return (
    <div className="p-4 rounded-2xl bg-surface-container-lowest border border-black/5 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[accent]}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-outline uppercase tracking-wider font-bold">{label}</span>
        <span className="text-title-lg text-on-surface font-bold">{value}</span>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-sm font-semibold text-on-surface">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-body-sm focus:ring-2 focus:ring-primary/20 outline-none"
      />
    </div>
  );
}