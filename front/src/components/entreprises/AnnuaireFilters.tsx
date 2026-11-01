"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";

interface FilterValues {
  q: string;
  secteur: string;
  ville: string;
  taille: string;
  effectifMin: number | "";
  effectifMax: number | "";
  verifie: string;
  sort: string;
}

interface AnnuaireFiltersProps {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  secteurs: string[];
  villes: string[];
  total: number;
}

export default function AnnuaireFilters({
  values,
  onChange,
  secteurs,
  villes,
  total,
}: AnnuaireFiltersProps) {
  const [localSearch, setLocalSearch] = useState(values.q);

  // Debounce sur la recherche
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== values.q) {
        onChange({ ...values, q: localSearch });
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const update = (key: keyof FilterValues, value: any) => {
    onChange({ ...values, [key]: value });
  };

  const reset = () => {
    setLocalSearch("");
    onChange({
      q: "",
      secteur: "",
      ville: "",
      taille: "",
      effectifMin: "",
      effectifMax: "",
      verifie: "",
      sort: "recent",
    });
  };

  const hasActiveFilters =
    values.q ||
    values.secteur ||
    values.ville ||
    values.taille ||
    values.effectifMin !== "" ||
    values.effectifMax !== "" ||
    values.verifie;

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-black/5 flex flex-col gap-3">
      {/* Ligne 1 : recherche + tri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
            <Icon name="search" size={18} />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Rechercher une PME (nom, NIF, sigle, produit...)"
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl text-body-sm text-on-surface placeholder:text-outline border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 focus:bg-surface-container-lowest focus:border-black/5 transition-all"
          />
        </div>
        <select
          value={values.sort}
          onChange={(e) => update("sort", e.target.value)}
          className="px-3.5 py-2.5 bg-surface-container-low rounded-xl text-body-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer"
        >
          <option value="recent">Plus récentes</option>
          <option value="nom">Nom (A-Z)</option>
          <option value="note">Meilleures notes</option>
          <option value="vues">Plus vues</option>
          <option value="effectif">Effectif décroissant</option>
        </select>
      </div>

      {/* Ligne 2 : filtres avancés */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={values.secteur}
          onChange={(e) => update("secteur", e.target.value)}
          className="px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer"
        >
          <option value="">Tous les secteurs</option>
          {secteurs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={values.ville}
          onChange={(e) => update("ville", e.target.value)}
          className="px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer"
        >
          <option value="">Toutes les villes</option>
          {villes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={values.taille}
          onChange={(e) => update("taille", e.target.value)}
          className="px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer"
        >
          <option value="">Toutes tailles</option>
          <option value="TPE">TPE</option>
          <option value="PE">PE</option>
          <option value="ME">ME</option>
        </select>

        <select
          value={values.verifie}
          onChange={(e) => update("verifie", e.target.value)}
          className="px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container/60 cursor-pointer"
        >
          <option value="">Toutes</option>
          <option value="true">Vérifiées CCI</option>
          <option value="false">Non vérifiées</option>
        </select>

        {/* Effectif min/max */}
        <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-low rounded-lg">
          <span className="text-[10px] text-outline uppercase tracking-wider">
            Effectif
          </span>
          <input
            type="number"
            value={values.effectifMin}
            onChange={(e) =>
              update(
                "effectifMin",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            placeholder="Min"
            className="w-14 bg-transparent text-label-sm text-on-surface focus:outline-none"
          />
          <span className="text-outline">-</span>
          <input
            type="number"
            value={values.effectifMax}
            onChange={(e) =>
              update(
                "effectifMax",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            placeholder="Max"
            className="w-14 bg-transparent text-label-sm text-on-surface focus:outline-none"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-error-container text-on-error-container text-label-sm font-semibold hover:bg-error-container/80 transition-colors"
          >
            <Icon name="close" size={14} />
            Réinitialiser
          </button>
        )}

        <span className="ml-auto text-code-sm text-outline">
          <strong className="text-on-surface">{total}</strong> entreprise
          {total > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}