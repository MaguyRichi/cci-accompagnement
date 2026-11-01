/* ============================================
   ENUMS DU MODULE FPD
   ============================================ */

export enum MetierFPDEnum {
  HOTELLERIE_TOURISME = 'HOTELLERIE_TOURISME',
  SECRETARIAT = 'SECRETARIAT',
  GESTION_COMPTABILITE = 'GESTION_COMPTABILITE',
  ASSISTANT_BANCAIRE = 'ASSISTANT_BANCAIRE',
}

export enum StatutSessionEnum {
  PLANIFIEE = 'PLANIFIEE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE',
}

export enum StatutApprentiEnum {
  CANDIDAT = 'CANDIDAT',
  ACCEPTE = 'ACCEPTE',
  EN_COURS = 'EN_COURS',
  DIPLOME = 'DIPLOME',
  ABANDON = 'ABANDON',
  REFUSE = 'REFUSE',
}

export enum NiveauEtudeEnum {
  CEPE = 'CEPE',
  BEPC = 'BEPC',
  BAC = 'BAC',
  BAC_PLUS_2 = 'BAC_PLUS_2',
  LICENCE = 'LICENCE',
  AUTRE = 'AUTRE',
}

export enum GenreEnum {
  M = 'M',
  F = 'F',
}

export enum StatutConventionEnum {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDEE = 'VALIDEE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE',
}