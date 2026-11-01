"use client";

import { useRef, useState, useEffect } from "react";
import { uploadApi } from "@/lib/api-services";
import { UPLOADS_URL } from "@/lib/api";

interface ImageUploadProps {
  currentImage?: string | null;
  categorie: "logo" | "couverture" | "produit" | "publication" | "document";
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "wide" | "auto";
}

/* Convertit une URL relative (/uploads/...) en URL absolue */
const toAbsoluteUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${UPLOADS_URL}${url}`;
};

export default function ImageUpload({
  currentImage,
  categorie,
  onUploadSuccess,
  onUploadError,
  label = "Changer l'image",
  className = "",
  aspectRatio = "square",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    toAbsoluteUrl(currentImage),
  );
  const [error, setError] = useState<string | null>(null);

  /* Synchronise l'aperçu si la prop change */
  useEffect(() => {
    setPreview(toAbsoluteUrl(currentImage));
  }, [currentImage]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 10 Mo)");
      onUploadError?.("Fichier trop volumineux");
      return;
    }

    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      setError("Seules les images sont acceptées");
      onUploadError?.("Format non supporté");
      return;
    }

    setError(null);
    setIsUploading(true);

    // Aperçu local immédiat
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const res = await uploadApi.upload(file, categorie);
      setPreview(toAbsoluteUrl(res.url));
      onUploadSuccess(res.url);
    } catch (err: any) {
      setError("Erreur lors de l'upload");
      setPreview(toAbsoluteUrl(currentImage));
      onUploadError?.("Erreur upload");
    } finally {
      setIsUploading(false);
      // Reset input pour pouvoir re-sélectionner le même fichier
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
        ? "aspect-video"
        : "";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Zone cliquable */}
      <div
        onClick={handleClick}
        className={`relative group cursor-pointer rounded-xl overflow-hidden bg-surface-container-low border-2 border-dashed border-outline-variant hover:border-primary-container transition-colors ${aspectClass}`}
      >
        {preview ? (
          <img
            src={preview}
            alt="Aperçu"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
            <span className="material-symbols-outlined text-outline text-[40px]">
              add_photo_alternate
            </span>
            <span className="text-label-sm text-outline">{label}</span>
          </div>
        )}

        {/* Overlay au hover */}
        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex flex-col items-center gap-1 text-on-primary">
            <span className="material-symbols-outlined text-[32px]">
              {isUploading ? "refresh" : "cloud_upload"}
            </span>
            <span className="text-label-sm font-semibold">
              {isUploading ? "Envoi..." : "Cliquer pour changer"}
            </span>
          </div>
        </div>

        {/* Spinner */}
        {isUploading && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary-container text-on-primary text-label-sm">
            <span className="material-symbols-outlined text-[16px] animate-spin">
              refresh
            </span>
          </div>
        )}
      </div>

      {/* Input caché */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-1 text-error text-label-sm">
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}