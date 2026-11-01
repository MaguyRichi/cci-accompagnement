"use client";

import { useRef, useState } from "react";
import { uploadApi, documentsApi, getImageUrl } from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

interface DocumentUploadProps {
  categorie:
    | "NIF"
    | "STAT"
    | "RCS"
    | "CNaPS"
    | "CV_MENTOR"
    | "DIPLOME"
    | "AUTRE";
  entrepriseId?: number;
  demandeId?: number;
  label: string;
  description?: string;
  existingDoc?: any;
  onUploadSuccess?: (doc: any) => void;
  onDelete?: (id: number) => void;
  required?: boolean;
}

export default function DocumentUpload({
  categorie,
  entrepriseId,
  demandeId,
  label,
  description,
  existingDoc,
  onUploadSuccess,
  onDelete,
  required = false,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{
    id?: number;
    nom: string;
    url: string;
    valide?: boolean;
    motifRejet?: string | null;
  } | null>(
    existingDoc
      ? {
          id: existingDoc.id,
          nom: existingDoc.nom,
          url: existingDoc.chemin,
          valide: existingDoc.valide,
          motifRejet: existingDoc.motifRejet,
        }
      : null,
  );
  const [error, setError] = useState<string | null>(null);

  const isRejected = uploaded && !uploaded.valide && uploaded.motifRejet;
  const isPending = uploaded && !uploaded.valide && !uploaded.motifRejet;
  const isValidated = uploaded && uploaded.valide;

  const handleClick = () => {
    if (!isUploading) inputRef.current?.click();
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    inputRef.current?.click();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!uploaded?.id) return;
    if (!confirm(`Supprimer le document "${uploaded.nom}" ?`)) return;

    try {
      await documentsApi.remove(uploaded.id);
      onDelete?.(uploaded.id);
      setUploaded(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur suppression");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 10 Mo)");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Format accepté : PDF, JPG, PNG");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Si on remplace, on supprime l'ancien
      if (uploaded?.id) {
        try {
          await documentsApi.remove(uploaded.id);
          onDelete?.(uploaded.id);
        } catch {
          // silencieux
        }
      }

      const uploadRes = await uploadApi.uploadDocument(file);

      const doc = await documentsApi.create({
        nom: file.name,
        chemin: uploadRes.url,
        typeMime: file.type,
        taille: file.size,
        categorie,
        entrepriseId,
        demandeId,
      });

      setUploaded({
        id: doc.id,
        nom: file.name,
        url: uploadRes.url,
        valide: false,
        motifRejet: null,
      });
      onUploadSuccess?.(doc);
    } catch (err: any) {
      console.error("Erreur upload:", err);
      setError(
        err.response?.data?.message || "Erreur lors du téléversement",
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const fullUrl = uploaded?.url
    ? uploaded.url.startsWith("http")
      ? uploaded.url
      : getImageUrl(uploaded.url)
    : null;

  return (
    <div className="flex flex-col gap-2">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-label-md font-semibold text-on-surface">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
          {description && (
            <span className="text-body-sm text-on-surface-variant">
              {description}
            </span>
          )}
        </div>
        {isValidated && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-semibold">
            <Icon name="check" size={14} />
            Validé
          </span>
        )}
        {isPending && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-semibold">
            <Icon name="schedule" size={14} />
            En attente
          </span>
        )}
        {isRejected && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-label-sm font-semibold">
            <Icon name="alert" size={14} />
            Rejeté
          </span>
        )}
      </div>

      {/* Motif de rejet */}
      {isRejected && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-error-container/60 text-on-error-container text-body-sm">
          <Icon name="alert" size={18} className="shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-semibold">Motif du rejet :</span>
            <span>{uploaded!.motifRejet}</span>
          </div>
        </div>
      )}

      {/* Zone de téléversement */}
      <div
        onClick={!uploaded ? handleClick : undefined}
        className={`flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-dashed transition-colors text-left ${
          isValidated
            ? "bg-secondary-container/20 border-secondary cursor-default"
            : isRejected
              ? "bg-error-container/20 border-error"
              : isPending
                ? "bg-tertiary-fixed/20 border-tertiary cursor-default"
                : "bg-surface-container-low border-outline-variant hover:border-primary-container hover:bg-surface-container cursor-pointer"
        } ${isUploading ? "opacity-50" : ""}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isValidated
                ? "bg-secondary-container text-on-secondary-container"
                : isRejected
                  ? "bg-error-container text-on-error-container"
                  : "bg-surface-container-lowest text-primary"
            }`}
          >
            {isUploading ? (
              <Icon name="refresh" size={22} className="animate-spin" />
            ) : uploaded ? (
              <Icon name="description" size={22} />
            ) : (
              <Icon name="upload" size={22} />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-label-md font-semibold text-on-surface truncate">
              {isUploading
                ? "Envoi en cours..."
                : uploaded
                  ? uploaded.nom
                  : "Cliquer pour téléverser"}
            </span>
            <span className="text-code-sm text-outline">
              {uploaded ? "Document enregistré" : "PDF, JPG, PNG • Max 10 Mo"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {uploaded && fullUrl && (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg text-primary hover:bg-surface-container-high transition-colors"
              title="Voir le document"
            >
              <Icon name="eye" size={20} />
            </a>
          )}

          {uploaded && !isValidated && (
            <>
              <button
                type="button"
                onClick={handleReplace}
                className="p-2 rounded-lg text-primary hover:bg-surface-container-high transition-colors"
                title="Remplacer le document"
              >
                <Icon name="refresh" size={20} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-lg text-error hover:bg-error-container/40 transition-colors"
                title="Supprimer"
              >
                <Icon name="trash" size={20} />
              </button>
            </>
          )}

          {!uploaded && (
            <Icon name="chevron-right" size={20} className="text-outline" />
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-1 text-error text-label-sm">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}