"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { conversationsApi, getImageUrl, Entreprise } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

interface MessageModalProps {
  open: boolean;
  onClose: () => void;
  entreprise: Entreprise | null;
}

export default function MessageModal({
  open,
  onClose,
  entreprise,
}: MessageModalProps) {
  const { user } = useAuth();
  const [contenu, setContenu] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open || !entreprise) return null;

  // ✅ DEBUG : Vérifier ce qui est reçu
  console.log("[MessageModal] entreprise reçue:", entreprise);

  const logoUrl = getImageUrl(entreprise.logo);
  const initials = (entreprise.sigle || entreprise.raisonSociale || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSend = async () => {
    if (!contenu.trim()) return;
    if (!user) return;

    const destinataireId = entreprise.dirigeantId;
    
    if (!destinataireId) {
      console.error("[MessageModal] destinataireId manquant dans l'objet entreprise");
      setError("Impossible de contacter cette entreprise (ID du dirigeant introuvable). Veuillez rafraîchir la page.");
      return;
    }

    if (destinataireId === user.id) {
      setError("Vous ne pouvez pas vous envoyer un message à vous-même.");
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      await conversationsApi.create({
        type: "COLLABORATION",
        destinataireId,
        entrepriseBId: entreprise.id,
        sujet: `Message de ${user.prenom} ${user.nom}`,
        premierMessage: contenu.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setContenu("");
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'envoi du message",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-black/5 overflow-hidden flex items-center justify-center shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-label-sm text-outline uppercase tracking-wider">
                Nouveau message
              </span>
              <span className="text-title-md text-on-surface font-semibold truncate">
                {entreprise.raisonSociale}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-outline hover:bg-surface-container transition-colors"
            aria-label="Fermer"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <Icon name="check" size={28} />
              </div>
              <p className="text-title-md text-primary text-center">
                Message envoyé avec succès
              </p>
              <p className="text-body-sm text-on-surface-variant text-center">
                Votre message a été transmis à {entreprise.raisonSociale}.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-error-container text-on-error-container">
                  <Icon name="alert" size={18} className="shrink-0 mt-0.5" />
                  <span className="text-body-sm">{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-semibold text-on-surface">
                  Votre message
                </label>
                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  rows={5}
                  disabled={isSending}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-outline resize-none disabled:opacity-50"
                  placeholder={`Bonjour, je souhaite échanger avec ${
                    entreprise.sigle || entreprise.raisonSociale
                  } au sujet de...`}
                />
                <span className="text-code-sm text-outline text-right">
                  {contenu.length} caractères
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-2 p-5 pt-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md font-medium hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || !contenu.trim()}
              className="
                flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-primary text-on-primary text-label-md font-semibold
                hover:bg-primary-container transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
              "
            >
              {isSending ? (
                <>
                  <Icon name="refresh" size={16} className="animate-spin" />
                  <span>Envoi…</span>
                </>
              ) : (
                <>
                  <Icon name="send" size={16} />
                  <span>Envoyer</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}