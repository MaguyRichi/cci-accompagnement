"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { profileApi, getImageUrl, UPLOADS_URL } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

/* ============================================
   TYPES
   ============================================ */
interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  variant?: "admin" | "user";
}

/* ============================================
   COMPOSANT
   ============================================ */
export default function ProfileModal({
  open,
  onClose,
  variant = "user",
}: ProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [cciLogoUrl, setCciLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = variant === "admin";
  const initials = user
    ? `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase()
    : "?";

  /* ---------- Charger le logo CCI (admin) ---------- */
  useEffect(() => {
    if (!open || !isAdmin) return;
    (async () => {
      try {
        const res = await profileApi.getCciLogoUrl();
        setCciLogoUrl(res.url);
      } catch {
        /* silencieux */
      }
    })();
  }, [open, isAdmin]);

  /* ---------- Escape ferme ---------- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* ---------- Blocage scroll body ---------- */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* ---------- Reset à la fermeture ---------- */
  useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
      setPendingFile(null);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop volumineuse (max 5 Mo)");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Formats acceptés : JPG, PNG, WEBP, GIF");
      return;
    }

    setError(null);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  /* ---------- Enregistrer ---------- */
  const handleSave = async () => {
    if (!pendingFile) {
      onClose();
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (isAdmin) {
        const res = await profileApi.uploadCciLogo(pendingFile);
        setCciLogoUrl(res.url);
        window.dispatchEvent(new Event("cci-logo-updated"));
      } else {
        const upload = await profileApi.uploadAvatar(pendingFile);
        await profileApi.updateMe({ photoProfil: upload.url });
        await refreshUser();
      }

      onClose();
    } catch (err: any) {
      console.error("Erreur sauvegarde profil:", err);
      setError(
        err.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    } finally {
      setIsUploading(false);
    }
  };

  /* ---------- Image affichée ---------- */
  const currentImage = isAdmin
    ? cciLogoUrl
      ? `${UPLOADS_URL}${cciLogoUrl}`
      : "/logo.jpg"
    : getImageUrl(user?.photoProfil) || null;

  const displayImage = previewUrl || currentImage;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Informations du compte"
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="
          relative w-full max-w-md
          rounded-2xl
          bg-surface-container-lowest/95 backdrop-blur-xl
          border border-black/5
          shadow-[0_20px_60px_-12px_rgba(15,23,42,0.35)]
          overflow-hidden
          animate-[scaleIn_0.25s_ease-out]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Icon
              name={isAdmin ? "admin_panel_settings" : "badge"}
              size={18}
              className="text-primary"
            />
            <h2 className="text-title-md text-primary">
              {isAdmin ? "Informations du compte Admin" : "Mon profil"}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fermer"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-5">
          {/* Photo / Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div
                className={`
                  relative overflow-hidden
                  ${isAdmin ? "w-28 h-28 rounded-2xl bg-white ring-1 ring-black/5" : "w-28 h-28 rounded-2xl bg-primary-container ring-1 ring-black/5"}
                `}
              >
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-primary text-headline-lg font-bold">
                    {initials}
                  </div>
                )}
              </div>

              {/* Bouton caméra */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                className="
                  absolute -bottom-1 -right-1
                  w-9 h-9 rounded-xl
                  bg-primary text-on-primary
                  flex items-center justify-center
                  shadow-lg hover:bg-primary-container
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
                  disabled:opacity-50
                "
                aria-label="Changer l'image"
                title="Changer l'image"
              >
                {isUploading ? (
                  <Icon name="refresh" size={16} className="animate-spin" />
                ) : (
                  <Icon name="photo_camera" size={16} />
                )}
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            <p className="text-code-sm text-outline text-center max-w-xs">
              {isAdmin
                ? "Cliquez sur l'appareil photo pour changer le logo CCI"
                : "Cliquez sur l'appareil photo pour changer votre photo de profil"}
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-error-container text-on-error-container">
              <Icon name="alert" size={18} className="shrink-0 mt-0.5" />
              <span className="text-body-sm">{error}</span>
            </div>
          )}

          {/* Infos */}
          <div className="flex flex-col gap-2.5">
            <InfoRow
              icon="user"
              label="Nom complet"
              value={`${user?.prenom || ""} ${user?.nom || ""}`.trim()}
            />
            <InfoRow icon="mail" label="Email" value={user?.email || "—"} />
            {user?.telephone && (
              <InfoRow icon="phone" label="Téléphone" value={user.telephone} />
            )}
            <InfoRow
              icon="badge"
              label="Rôle"
              value={
                user?.role === "ADMIN"
                  ? "Administrateur"
                  : user?.role === "MENTOR"
                    ? "Mentor"
                    : "Dirigeant de PME"
              }
              badge
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-black/5 bg-surface-container/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-label-md font-medium hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUploading || !pendingFile}
            className="
              flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-primary text-on-primary text-label-md font-semibold
              hover:bg-primary-container transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60
            "
          >
            {isUploading ? (
              <>
                <Icon name="refresh" size={16} className="animate-spin" />
                <span>Enregistrement…</span>
              </>
            ) : (
              <>
                <Icon name="check" size={16} />
                <span>Enregistrer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   SOUS-COMPOSANT — LIGNE D'INFO
   ============================================ */
function InfoRow({
  icon,
  label,
  value,
  badge,
}: {
  icon: string;
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container/50">
      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0">
        <Icon name={icon as any} size={16} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-outline uppercase tracking-wider">
          {label}
        </span>
        {badge ? (
          <span className="text-label-md font-semibold text-primary truncate">
            {value}
          </span>
        ) : (
          <span className="text-label-md text-on-surface font-medium truncate">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}