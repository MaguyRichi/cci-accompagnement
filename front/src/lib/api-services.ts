import api, { UPLOADS_URL } from "./api";
export { UPLOADS_URL } from "./api";

/* ============================================
   TYPES GÉNÉRIQUES
   ============================================ */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/* ============================================
   TYPES — ENTREPRISE
   ============================================ */
export interface Produit {
  nom: string;
  prix?: string;
  categorie?: string;
  image?: string;
}

export interface Avis {
  user_id: number;
  auteur_nom: string;
  auteur_photo?: string;
  note: number;
  commentaire: string;
  date: string;
}

export interface Entreprise {
  id: number;
  raisonSociale: string;
  sigle?: string;
  nif: string;
  stat: string;
  rcs?: string;
  formeJuridique?: string;
  secteur: string;
  sousSecteur?: string;
  taille?: string;
  effectif?: number;
  chiffreAffaires?: number;
  anneeCreation?: string;
  description?: string;
  produitPhare?: string;
  listeProduits?: Produit[];
  motsCles?: string[];
  adresse?: string;
  ville: string;
  region: string;
  latitude?: number;
  longitude?: number;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  logo?: string;
  photoCouverture?: string;
  galeriePhotos?: string[];
  dirigeantId?: number;
  mentorId?: number;
  statut: string;
  motifSuspension?: string;
  verifie: boolean;
  dateVerification?: string;
  noteMoyenne: number;
  nbAvis: number;
  avis?: Avis[];
  cotaMontant?: number;
  cotaStatut?: string;
  cotaEcheance?: string;
  cotaDatePaiement?: string;
  cotaReference?: string;
  cotaModePaiement?: string;
  cotaHistorique?: any[];
  numeroCarteMembre?: string;
  nbVues: number;
  nbPublications: number;
  nbCollaborations: number;
  createdAt?: string;
  updatedAt?: string;
  dirigeant?: any;
  mentor?: any;
}

export interface StatsEntreprises {
  totalPme: number;
  avecMentor: number;
  verifiees: number;
  noteMoyenneRegionale: number;
}

/* ============================================
   TYPES — MENTOR
   ============================================ */
export interface Mentor {
  id: number;
  nom: string;
  prenom: string;
  photoProfil?: string;
  domaineMentor: string;
  experienceMentor: number;
  bioMentor: string;
  disponibilite: string;
  agrementMentor: string;
  noteMoyenne: number;
  nbEvaluations: number;
  languesMentor: string[];
  nbPmeSuivies: number;
}

/* ============================================
   TYPES — DEMANDE / COLLABORATION
   ============================================ */
export interface CollaborationPublique {
  id: number;
  type: string;
  sousType: string;
  titre: string;
  description: string;
  besoinDetaille?: string;
  volume: string;
  localisationCible: string;
  secteurConcerne: string;
  dateSouhaitee: string;
  createdAt: string;
  statut: string;
  visiblePubliquement: boolean;
  entreprise?: {
    id: number;
    raisonSociale: string;
    sigle?: string;
    logo?: string;
  };
}

export interface Demande {
  id: number;
  type: string;
  sousType?: string;
  emetteurId?: number;
  entrepriseId?: number;
  cibleId?: number;
  cibleEntrepriseId?: number;
  titre?: string;
  description?: string;
  besoinDetaille?: string;
  volume?: string;
  localisationCible?: string;
  secteurConcerne?: string;
  dateSouhaitee?: string;
  dureeEstimee?: string;
  statut: string;
  motifRefus?: string;
  traiteParId?: number;
  dateTraitement?: string;
  note?: number;
  commentaireEvaluation?: string;
  dateEvaluation?: string;
  visiblePubliquement: boolean;
  datePublication?: string;
  dateCloture?: string;
  piecesJointes?: any[];
  createdAt: string;
  updatedAt?: string;
  emetteur?: any;
  entreprise?: any;
  cible?: any;
  cibleEntreprise?: any;
}

/* ============================================
   TYPES — DIAGNOSTIC
   ============================================ */
export interface Diagnostic {
  id: number;
  entrepriseId: number;
  conseillerId?: number;
  reference: string;
  type: string;
  scoreGlobal: number;
  niveau: string;
  statut: string;
  reponses?: Record<string, any>;
  scoresParCategorie?: Record<string, number>;
  recommandations?: any[];
  pointsForts?: string[];
  pointsAmeliorer?: string[];
  commentaire?: string;
  valideParId?: number;
  dateValidation?: string;
  createdAt: string;
  updatedAt?: string;
  entreprise?: any;
  conseiller?: any;
}

export interface QuestionDiagnostic {
  id: number;
  categorie: string;
  sousCategorie?: string;
  libelle: string;
  description?: string;
  typeReponse: string;
  options?: string[];
  poids: number;
  ordre: number;
  obligatoire: boolean;
  actif: boolean;
}

export interface RepartitionDiagnostics {
  debutant: { count: number; pourcentage: number };
  intermediaire: { count: number; pourcentage: number };
  avance: { count: number; pourcentage: number };
  excellence: { count: number; pourcentage: number };
  total: number;
}

export interface ComparaisonDiagnostic {
  current: {
    id: number;
    scoreGlobal: number;
    niveau: string;
    scoresParCategorie: Record<string, number>;
    date: string;
  };
  previous: {
    id: number;
    scoreGlobal: number;
    niveau: string;
    scoresParCategorie: Record<string, number>;
    date: string;
  } | null;
  evolution: Record<string, number> | null;
  evolutionGlobale: number | null;
  message?: string;
}

/* ============================================
   TYPES — PUBLICATION
   ============================================ */
export interface Commentaire {
  id: number;
  auteur_id: number;
  auteur_nom: string;
  auteur_photo?: string;
  contenu: string;
  date: string;
}

export interface Publication {
  id: number;
  entrepriseId: number;
  auteurId?: number;
  type: string;
  titre?: string;
  contenu?: string;
  fichier?: string;
  image?: string;
  visibilite: string;
  epingle: boolean;
  likes: number[];
  commentaires: Commentaire[];
  nbLikes: number;
  nbCommentaires: number;
  nbVues: number;
  createdAt: string;
  updatedAt?: string;
  entreprise?: any;
  auteur?: any;
}

/* ============================================
   TYPES — CONVERSATION
   ============================================ */
export interface Conversation {
  id: number;
  type: string;
  demandeurId?: number;
  destinataireId?: number;
  entrepriseAId?: number;
  entrepriseBId?: number;
  demandeId?: number;
  sujet?: string;
  dernierMessage?: string;
  dernierMessageAt?: string;
  nbNonLusA: number;
  nbNonLusB: number;
  statut: string;
  createdAt: string;
  updatedAt?: string;
  demandeur?: any;
  destinataire?: any;
  entrepriseA?: any;
  entrepriseB?: any;
}

export interface Message {
  id: number;
  conversationId: number;
  expediteurId?: number;
  type: string;
  contenu?: string;
  fichier?: string;
  image?: string;
  dateRdv?: string;
  lieuRdv?: string;
  rdvStatut?: string;
  lu: boolean;
  luAt?: string;
  createdAt: string;
  expediteur?: any;
}

/* ============================================
   TYPES — NOTIFICATION
   ============================================ */
export interface Notification {
  id: number;
  utilisateurId: number;
  titre?: string;
  message?: string;
  type: string;
  lien?: string;
  icone?: string;
  emailEnvoye: boolean;
  emailEnvoyeAt?: string;
  smsEnvoye: boolean;
  smsEnvoyeAt?: string;
  lu: boolean;
  luAt?: string;
  createdAt: string;
}

/* ============================================
   HELPERS
   ============================================ */
const toNumber = (value: any): number => Number(value || 0);

export const getImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${UPLOADS_URL}${url}`;
};

const parseEntreprise = (e: any): Entreprise => ({
  ...e,
  noteMoyenne: toNumber(e.noteMoyenne),
  nbAvis: toNumber(e.nbAvis),
  nbVues: toNumber(e.nbVues),
  nbPublications: toNumber(e.nbPublications),
  nbCollaborations: toNumber(e.nbCollaborations),
  effectif: e.effectif ? toNumber(e.effectif) : undefined,
  chiffreAffaires: e.chiffreAffaires ? toNumber(e.chiffreAffaires) : undefined,
  cotaMontant: e.cotaMontant ? toNumber(e.cotaMontant) : undefined,
  latitude: e.latitude ? toNumber(e.latitude) : undefined,
  longitude: e.longitude ? toNumber(e.longitude) : undefined,
});

const parseMentor = (m: any): Mentor => ({
  ...m,
  noteMoyenne: toNumber(m.noteMoyenne),
  nbEvaluations: toNumber(m.nbEvaluations),
  experienceMentor: toNumber(m.experienceMentor),
  nbPmeSuivies: toNumber(m.nbPmeSuivies),
});

const parseDiagnostic = (d: any): Diagnostic => ({
  ...d,
  scoreGlobal: toNumber(d.scoreGlobal),
});

const parsePublication = (p: any): Publication => ({
  ...p,
  nbLikes: toNumber(p.nbLikes),
  nbCommentaires: toNumber(p.nbCommentaires),
  nbVues: toNumber(p.nbVues),
  likes: p.likes || [],
  commentaires: p.commentaires || [],
});

/* ============================================
   API ENTREPRISES
   ============================================ */
export const entreprisesApi = {
  async getPublic(params?: {
    page?: number;
    limit?: number;
    q?: string;
    secteur?: string;
    ville?: string;
    region?: string;
    taille?: string;
    statut?: string;
    verifie?: string;
    hasMentor?: string;
    sort?: string;
  }): Promise<PaginatedResponse<Entreprise>> {
    const { data } = await api.get("/entreprises/public", { params });
    return {
      ...data,
      data: (data.data || []).map(parseEntreprise),
    };
  },

  async getStats(): Promise<StatsEntreprises> {
    const { data } = await api.get("/entreprises/public/stats");
    return {
      totalPme: toNumber(data.totalPme),
      avecMentor: toNumber(data.avecMentor),
      verifiees: toNumber(data.verifiees),
      noteMoyenneRegionale: toNumber(data.noteMoyenneRegionale),
    };
  },

  async getTop(limit = 6): Promise<Entreprise[]> {
    const { data } = await api.get("/entreprises/public/top", {
      params: { limit },
    });
    return (data || []).map(parseEntreprise);
  },

  async getById(id: number): Promise<Entreprise> {
    const { data } = await api.get(`/entreprises/public/${id}`);
    return parseEntreprise(data);
  },

  async getMyEntreprise(): Promise<Entreprise | null> {
    try {
      const { data } = await api.get("/entreprises/me");
      if (!data) return null;
      return parseEntreprise(data);
    } catch {
      return null;
    }
  },

  async update(id: number, payload: Partial<Entreprise>): Promise<Entreprise> {
    const { data } = await api.patch(`/entreprises/${id}`, payload);
    return parseEntreprise(data);
  },

  async ajouterAvis(
    id: number,
    payload: { note: number; commentaire: string },
  ): Promise<Entreprise> {
    const { data } = await api.post(`/entreprises/${id}/avis`, payload);
    return parseEntreprise(data);
  },

  async ajouterProduit(
    id: number,
    payload: Produit,
  ): Promise<Entreprise> {
    const { data } = await api.post(`/entreprises/${id}/produits`, payload);
    return parseEntreprise(data);
  },

  // ✅ NOUVEAU : modification d'un produit
  async modifierProduit(
    id: number,
    index: number,
    payload: Produit,
  ): Promise<Entreprise> {
    const { data } = await api.patch(`/entreprises/${id}/produits/${index}`, payload);
    return parseEntreprise(data);
  },

  async supprimerProduit(id: number, index: number): Promise<Entreprise> {
    const { data } = await api.delete(`/entreprises/${id}/produits/${index}`);
    return parseEntreprise(data);
  },

  async verifier(id: number): Promise<Entreprise> {
    const { data } = await api.patch(`/entreprises/${id}/verifier`);
    return parseEntreprise(data);
  },

  async suspendre(id: number, motif: string): Promise<Entreprise> {
    const { data } = await api.patch(`/entreprises/${id}/suspendre`, { motif });
    return parseEntreprise(data);
  },

  async reactiver(id: number): Promise<Entreprise> {
    const { data } = await api.patch(`/entreprises/${id}/reactiver`);
    return parseEntreprise(data);
  },

  async assignerMentor(id: number, mentorId: number): Promise<Entreprise> {
    const { data } = await api.patch(`/entreprises/${id}/mentor`, { mentorId });
    return parseEntreprise(data);
  },

  async retirerMentor(id: number): Promise<Entreprise> {
    const { data } = await api.delete(`/entreprises/${id}/mentor`);
    return parseEntreprise(data);
  },
};

/* ============================================
   API MENTORS
   ============================================ */
export const mentorsApi = {
  async getAll(): Promise<Mentor[]> {
    const { data } = await api.get("/users/mentors");
    return (data || []).map(parseMentor);
  },
};

/* ============================================
   API USERS (chat, contacts)
   ============================================ */
export interface ChatContact {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  photoProfil?: string;
  domaineMentor?: string;
  telephone?: string;
}

export const usersApi = {
  async getContacts(): Promise<ChatContact[]> {
    const { data } = await api.get("/users/chat/contacts");
    return data;
  },

  async getById(id: number): Promise<ChatContact> {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  async getAll(role?: string): Promise<any[]> {
    const { data } = await api.get("/users", { params: { role } });
    return data;
  },

  async ban(id: number, motif: string): Promise<{ message: string }> {
    const { data } = await api.patch(`/users/${id}/ban`, { motif });
    return data;
  },

  async unban(id: number): Promise<{ message: string }> {
    const { data } = await api.patch(`/users/${id}/unban`);
    return data;
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};

/* ============================================
   API DEMANDES
   ============================================ */
export const demandesApi = {
  async getCollaborationsPubliques(params?: {
    page?: number;
    limit?: number;
    secteur?: string;
    q?: string;
  }): Promise<PaginatedResponse<CollaborationPublique>> {
    const { data } = await api.get("/demandes/collaborations-publiques", {
      params,
    });
    return data;
  },

  async getMesDemandes(params?: {
    page?: number;
    limit?: number;
    type?: string;
    statut?: string;
  }): Promise<PaginatedResponse<Demande>> {
    const { data } = await api.get("/demandes/mes-demandes", { params });
    return data;
  },

  async getRecues(params?: {
    page?: number;
    limit?: number;
    type?: string;
    statut?: string;
  }): Promise<PaginatedResponse<Demande>> {
    const { data } = await api.get("/demandes/recues", { params });
    return data;
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    type?: string;
    statut?: string;
    q?: string;
  }): Promise<PaginatedResponse<Demande>> {
    const { data } = await api.get("/demandes", { params });
    return data;
  },

  async getById(id: number): Promise<Demande> {
    const { data } = await api.get(`/demandes/${id}`);
    return data;
  },

  async createMentorat(payload: {
    cibleId: number;
    titre?: string;
    description?: string;
  }): Promise<Demande> {
    const { data } = await api.post("/demandes/mentorat", {
      type: "MENTORAT",
      ...payload,
    });
    return data;
  },

  async createCollaboration(payload: {
    titre: string;
    description: string;
    besoinDetaille?: string;
    volume?: string;
    localisationCible?: string;
    secteurConcerne?: string;
    sousType?: string;
    visiblePubliquement?: boolean;
    entrepriseId?: number;        // ✅ AJOUT ESSENTIEL
    cibleEntrepriseId?: number;   // ✅ AJOUT ESSENTIEL
  }): Promise<Demande> {
    const { data } = await api.post("/demandes/collaboration", {
      type: "COLLABORATION",
      ...payload,
    });
    return data;
  },

  async createRdv(payload: {
    titre?: string;
    description?: string;
    dateSouhaitee?: string;
  }): Promise<Demande> {
    const { data } = await api.post("/demandes/rdv", {
      type: "RDV",
      ...payload,
    });
    return data;
  },

  async valider(id: number): Promise<Demande> {
    const { data } = await api.patch(`/demandes/${id}/valider`);
    return data;
  },

  async refuser(id: number, motifRefus: string): Promise<Demande> {
    const { data } = await api.patch(`/demandes/${id}/refuser`, { motifRefus });
    return data;
  },

  async demanderRdv(id: number, dateSouhaitee?: string): Promise<Demande> {
    const { data } = await api.patch(`/demandes/${id}/rdv`, { dateSouhaitee });
    return data;
  },

  async accepter(id: number): Promise<Demande> {
    const { data } = await api.patch(`/demandes/${id}/accepter`);
    return data;
  },

  async refuserCible(id: number, motifRefus: string): Promise<Demande> {
    const { data } = await api.patch(`/demandes/${id}/refuser-cible`, {
      motifRefus,
    });
    return data;
  },

  async annuler(id: number): Promise<Demande> {
    const { data } = await api.patch(`/demandes/${id}/annuler`);
    return data;
  },

  async terminer(id: number): Promise<Demande> {
    const { data } = await api.patch(`/demandes/${id}/terminer`);
    return data;
  },

  async evaluer(
    id: number,
    payload: { note: number; commentaireEvaluation?: string },
  ): Promise<Demande> {
    const { data } = await api.post(`/demandes/${id}/evaluer`, payload);
    return data;
  },
};

/* ============================================
   API DIAGNOSTICS
   ============================================ */
export const diagnosticsApi = {
  async getQuestions(): Promise<QuestionDiagnostic[]> {
    const { data } = await api.get("/diagnostics/questions");
    return data;
  },

  async getRepartition(): Promise<RepartitionDiagnostics> {
    const { data } = await api.get("/diagnostics/repartition");
    return data;
  },

  async getMesDiagnostics(params?: {
    page?: number;
    limit?: number;
    niveau?: string;
    statut?: string;
  }): Promise<PaginatedResponse<Diagnostic>> {
    const { data } = await api.get("/diagnostics/mes-diagnostics", { params });
    return {
      ...data,
      data: (data.data || []).map(parseDiagnostic),
    };
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    niveau?: string;
    statut?: string;
  }): Promise<PaginatedResponse<Diagnostic>> {
    const { data } = await api.get("/diagnostics", { params });
    return {
      ...data,
      data: (data.data || []).map(parseDiagnostic),
    };
  },

  async getById(id: number): Promise<Diagnostic> {
    const { data } = await api.get(`/diagnostics/${id}`);
    return parseDiagnostic(data);
  },

  async comparer(id: number): Promise<ComparaisonDiagnostic> {
    const { data } = await api.get(`/diagnostics/${id}/comparer`);
    return data;
  },

  async create(payload: {
    entrepriseId: number;
    autoEvaluation?: boolean;
  }): Promise<Diagnostic> {
    const { data } = await api.post("/diagnostics", payload);
    return parseDiagnostic(data);
  },

  async submit(
    id: number,
    payload: { reponses: Record<string, any>; commentaire?: string },
  ): Promise<Diagnostic> {
    const { data } = await api.post(`/diagnostics/${id}/soumettre`, payload);
    return parseDiagnostic(data);
  },

  async valider(id: number): Promise<Diagnostic> {
    const { data } = await api.patch(`/diagnostics/${id}/valider`);
    return parseDiagnostic(data);
  },

  async getStats(): Promise<any> {
    const { data } = await api.get("/diagnostics/stats");
    return data;
  },
};

/* ============================================
   API PUBLICATIONS
   ============================================ */
export const publicationsApi = {
  async getFluxPublic(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<Publication>> {
    const { data } = await api.get("/publications/flux-public", { params });
    return {
      ...data,
      data: (data.data || []).map(parsePublication),
    };
  },

  async getMurEntreprise(
    entrepriseId: number,
    params?: { page?: number; limit?: number; type?: string },
  ): Promise<PaginatedResponse<Publication>> {
    const { data } = await api.get(`/publications/mur/${entrepriseId}`, {
      params,
    });
    return {
      ...data,
      data: (data.data || []).map(parsePublication),
    };
  },

  async getMesPublications(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<Publication>> {
    const { data } = await api.get("/publications/mes-publications", {
      params,
    });
    return {
      ...data,
      data: (data.data || []).map(parsePublication),
    };
  },

  async getById(id: number): Promise<Publication> {
    const { data } = await api.get(`/publications/${id}`);
    return parsePublication(data);
  },

  async create(payload: {
    entrepriseId: number;
    type?: string;
    titre?: string;
    contenu: string;
    image?: string;
    fichier?: string;
    visibilite?: string;
  }): Promise<Publication> {
    const { data } = await api.post("/publications", payload);
    return parsePublication(data);
  },

  async update(
    id: number,
    payload: Partial<Publication>,
  ): Promise<Publication> {
    const { data } = await api.patch(`/publications/${id}`, payload);
    return parsePublication(data);
  },

  async remove(id: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/publications/${id}`);
    return data;
  },

  async toggleLike(id: number): Promise<{ liked: boolean; nbLikes: number }> {
    const { data } = await api.post(`/publications/${id}/like`);
    return data;
  },

  async ajouterCommentaire(id: number, contenu: string): Promise<Commentaire> {
    const { data } = await api.post(`/publications/${id}/commentaires`, {
      contenu,
    });
    return data;
  },

  async supprimerCommentaire(
    id: number,
    commentId: number,
  ): Promise<{ message: string }> {
    const { data } = await api.delete(
      `/publications/${id}/commentaires/${commentId}`,
    );
    return data;
  },

  async toggleEpingle(
    id: number,
  ): Promise<{ epingle: boolean; message: string }> {
    const { data } = await api.patch(`/publications/${id}/epingler`);
    return data;
  },

  async incrementVues(id: number): Promise<{ message: string }> {
    const { data } = await api.post(`/publications/${id}/vue`);
    return data;
  },
};

/* ============================================
   API CONVERSATIONS
   ============================================ */
export const conversationsApi = {
  async getMesConversations(params?: {
    page?: number;
    limit?: number;
    type?: string;
    statut?: string;
  }): Promise<PaginatedResponse<Conversation>> {
    const { data } = await api.get("/conversations", { params });
    return data;
  },

  async getById(id: number): Promise<Conversation> {
    const { data } = await api.get(`/conversations/${id}`);
    return data;
  },

  async create(payload: {
    type: string;
    destinataireId: number;
    entrepriseAId?: number;
    entrepriseBId?: number;
    demandeId?: number;
    sujet?: string;
    premierMessage?: string;
  }): Promise<Conversation> {
    const { data } = await api.post("/conversations", payload);
    return data;
  },

  async archiver(id: number): Promise<Conversation> {
    const { data } = await api.patch(`/conversations/${id}/archiver`);
    return data;
  },

  async getMessages(
    id: number,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedResponse<Message>> {
    const { data } = await api.get(`/conversations/${id}/messages`, {
      params,
    });
    return data;
  },

  async envoyerMessage(
    id: number,
    payload: {
      type?: string;
      contenu?: string;
      fichier?: string;
      image?: string;
    },
  ): Promise<Message> {
    const { data } = await api.post(`/conversations/${id}/messages`, payload);
    return data;
  },

  async marquerCommeLu(id: number): Promise<{ message: string }> {
    const { data } = await api.patch(`/conversations/${id}/lu`);
    return data;
  },

  async supprimerMessage(
    id: number,
    messageId: number,
  ): Promise<{ message: string }> {
    const { data } = await api.delete(
      `/conversations/${id}/messages/${messageId}`,
    );
    return data;
  },

  async proposerRdv(
    id: number,
    payload: { dateRdv: string; lieuRdv?: string; contenu?: string },
  ): Promise<Message> {
    const { data } = await api.post(`/conversations/${id}/rdv`, payload);
    return data;
  },

  async repondreRdv(
    id: number,
    messageId: number,
    statut: "ACCEPTE" | "REFUSE",
  ): Promise<Message> {
    const { data } = await api.patch(`/conversations/${id}/rdv/${messageId}`, {
      statut,
    });
    return data;
  },
};

/* ============================================
   API NOTIFICATIONS
   ============================================ */
export const notificationsApi = {
  async getMesNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    lu?: string;
  }): Promise<PaginatedResponse<Notification>> {
    const { data } = await api.get("/notifications", { params });
    return data;
  },

  async getCountNonLues(): Promise<{ count: number }> {
    const { data } = await api.get("/notifications/non-lues/count");
    return data;
  },

  async getById(id: number): Promise<Notification> {
    const { data } = await api.get(`/notifications/${id}`);
    return data;
  },

  async marquerCommeLue(id: number): Promise<Notification> {
    const { data } = await api.patch(`/notifications/${id}/lu`);
    return data;
  },

  async toutMarquerCommeLu(): Promise<{ message: string }> {
    const { data } = await api.patch("/notifications/tout-lu");
    return data;
  },

  async remove(id: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },

  async toutSupprimer(): Promise<{ message: string }> {
    const { data } = await api.delete("/notifications");
    return data;
  },

  async create(payload: {
    utilisateurId: number;
    titre?: string;
    message?: string;
    type?: string;
    lien?: string;
    icone?: string;
  }): Promise<Notification> {
    const { data } = await api.post("/notifications", payload);
    return data;
  },

  async broadcast(payload: {
    utilisateurIds: number[];
    titre: string;
    message: string;
    type?: string;
    lien?: string;
    icone?: string;
  }): Promise<{ message: string; count: number }> {
    const { data } = await api.post("/notifications/broadcast", payload);
    return data;
  },

  async broadcastByRole(payload: {
    role: string;
    titre: string;
    message: string;
    type?: string;
    lien?: string;
  }): Promise<{ message: string; count: number }> {
    const { data } = await api.post("/notifications/broadcast-role", payload);
    return data;
  },
};

/* ============================================
   API UPLOAD
   ============================================ */
export const uploadApi = {
  async upload(
    file: File,
    categorie?: "logo" | "couverture" | "produit" | "document" | "publication",
  ): Promise<{ url: string; filename: string; size: number; mime: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const url = categorie ? `/upload/${categorie}` : "/upload";

    const { data } = await api.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async uploadLogo(file: File) {
    return this.upload(file, "logo");
  },

  async uploadCouverture(file: File) {
    return this.upload(file, "couverture");
  },

  async uploadProduit(file: File) {
    return this.upload(file, "produit");
  },

  async uploadDocument(file: File) {
    return this.upload(file, "document");
  },

  async uploadPublication(file: File) {
    return this.upload(file, "publication");
  },
};

/* ============================================
   API DOCUMENTS
   ============================================ */
export const documentsApi = {
  async getByEntreprise(entrepriseId: number): Promise<any[]> {
    const { data } = await api.get(`/documents/entreprise/${entrepriseId}`);
    return data;
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    categorie?: string;
    entrepriseId?: number;
    valide?: string;
  }): Promise<PaginatedResponse<any>> {
    const { data } = await api.get("/documents", { params });
    return data;
  },

  async getById(id: number): Promise<any> {
    const { data } = await api.get(`/documents/${id}`);
    return data;
  },

  async create(payload: {
    nom: string;
    chemin: string;
    typeMime?: string;
    taille?: number;
    categorie?: string;
    description?: string;
    demandeId?: number;
    entrepriseId?: number;
  }): Promise<any> {
    const { data } = await api.post("/documents", payload);
    return data;
  },

  async valider(id: number): Promise<any> {
    const { data } = await api.patch(`/documents/${id}/valider`);
    return data;
  },

  async rejeter(id: number, motif: string): Promise<any> {
    const { data } = await api.patch(`/documents/${id}/rejeter`, { motif });
    return data;
  },

  async remove(id: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/documents/${id}`);
    return data;
  },

  async deleteDocument(id: number): Promise<{ message: string }> {
    const { data } = await api.delete(`/documents/${id}`);
    return data;
  },
};

/* ============================================
   API SEARCH (recherche globale admin)
   ============================================ */
export interface SearchResults {
  utilisateurs: any[];
  entreprises: any[];
  demandes: any[];
  documents: any[];
  total: number;
}

export const searchApi = {
  async global(q: string, limit = 5): Promise<SearchResults> {
    const { data } = await api.get("/search", {
      params: { q, limit },
    });
    return data;
  },
};

/* ============================================
   API UPLOAD — extensions (avatar + logo CCI)
   ============================================ */
export const profileApi = {
  async uploadAvatar(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/upload/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async uploadCciLogo(
    file: File,
  ): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/upload/cci-logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async getCciLogoUrl(): Promise<{ url: string | null }> {
    const { data } = await api.get("/upload/cci-logo-url");
    return data;
  },

  async updateMe(payload: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    photoProfil?: string;
    bioCourte?: string;
  }): Promise<any> {
    const { data } = await api.patch("/users/me", payload);
    return data;
  },
};

/* ============================================
   API ADMIN STATS
   ============================================ */
export interface AdminStatsKpis {
  totalUsers: number;
  totalEntreprises: number;
  entreprisesActives: number;
  totalDemandes: number;
  demandesEnAttente: number;
  documentsAValider: number;
  totalDiagnostics: number;
  mentorsActifs: number;
}

export interface AdminStats {
  kpis: AdminStatsKpis;
  inscriptionsParMois: {
    mois: string;
    label: string;
    utilisateurs: number;
    entreprises: number;
  }[];
  entreprisesParSecteur: { secteur: string; count: number }[];
  topVilles: { ville: string; count: number }[];
  usersParRole: { role: string; label: string; count: number }[];
  diagnosticsParNiveau: { niveau: string; label: string; count: number }[];
  demandesParType: { type: string; label: string; count: number }[];
  dernieresInscriptions: any[];
  demandesEnAttente: any[];
}

export const adminStatsApi = {
  async get(): Promise<AdminStats> {
    const { data } = await api.get('/admin-stats');
    return data;
  },
};

/* ============================================
   API ANNUAIRE DES RESSORTISSANTS
   ============================================ */
export interface AnnuaireStats {
  total: number;
  verifiees: number;
  parSecteur: { secteur: string; count: number }[];
  parVille: { ville: string; count: number }[];
  parTaille: { taille: string; count: number }[];
}

export const annuaireApi = {
  async get(params?: {
    page?: number;
    limit?: number;
    q?: string;
    secteur?: string;
    ville?: string;
    region?: string;
    district?: string;
    taille?: string;
    effectifMin?: number;
    effectifMax?: number;
    verifie?: string;
    sort?: string;
  }): Promise<PaginatedResponse<Entreprise>> {
    const { data } = await api.get("/entreprises/annuaire", { params });
    return {
      ...data,
      data: (data.data || []).map(parseEntreprise),
    };
  },

  async getStats(): Promise<AnnuaireStats> {
    const { data } = await api.get("/entreprises/annuaire/stats");
    return data;
  },

  async exportCsv(): Promise<Blob> {
    const { data } = await api.get("/entreprises/annuaire/export.csv", {
      responseType: "blob",
    });
    return data;
  },
};

/* ============================================
   API FPD (Formation Professionnelle Duale) — V2
   ============================================ */
export const fpdApi = {
  async getSessionsPublic() {
    try {
      const { data } = await api.get("/fpd/sessions/public");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("[fpdApi.getSessionsPublic] error:", e);
      return [];
    }
  },

  async getAllSessions(params?: any) {
    const { data } = await api.get("/fpd/sessions", { params });
    return data;
  },

  async createSession(payload: any) {
    const { data } = await api.post("/fpd/sessions", payload);
    return data;
  },

  async updateSession(id: number, payload: any) {
    const { data } = await api.patch(`/fpd/sessions/${id}`, payload);
    return data;
  },

  async deleteSession(id: number) {
    const { data } = await api.delete(`/fpd/sessions/${id}`);
    return data;
  },

  async inscrire(sessionId: number) {
    const { data } = await api.post(`/fpd/inscriptions/${sessionId}`);
    return data;
  },

  async getMesInscriptions() {
    try {
      const { data } = await api.get("/fpd/mes-inscriptions");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("[fpdApi.getMesInscriptions] error:", e);
      return [];
    }
  },

  async getMentorats() {
    try {
      const { data } = await api.get("/fpd/mentorats");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("[fpdApi.getMentorats] error:", e);
      return [];
    }
  },

  async validerParMentor(id: number, payload: { note: number; commentaire?: string }) {
    const { data } = await api.patch(`/fpd/inscriptions/${id}/valider`, payload);
    return data;
  },

  async getAllInscriptions(params?: any) {
    const { data } = await api.get("/fpd/inscriptions", { params });
    return data;
  },

  async getStats() {
    const { data } = await api.get("/fpd/stats");
    return data;
  },

  async createModule(sessionId: number, payload: { titre: string; description?: string; ordre?: number }) {
    const { data } = await api.post(`/fpd/modules/${sessionId}`, payload);
    return data;
  },

  async getModules(sessionId: number) {
    if (!sessionId || !Number.isFinite(Number(sessionId))) {
      console.warn("[fpdApi.getModules] invalid sessionId:", sessionId);
      return [];
    }
    try {
      const { data } = await api.get(`/fpd/modules/${sessionId}`);
      return Array.isArray(data) ? data : [];
    } catch (e: any) {
      console.error(
        `[fpdApi.getModules] session ${sessionId} → ${e?.response?.status} ${e?.response?.statusText}`,
        e?.response?.data || e.message,
      );
      return [];
    }
  },

  async createQuiz(moduleId: number, payload: { question: string; options: string[]; bonneReponse: number; ordre?: number }) {
    const { data } = await api.post(`/fpd/quizzes/${moduleId}`, payload);
    return data;
  },

  async updateQuiz(quizId: number, payload: { question?: string; options?: string[]; bonneReponse?: number; ordre?: number }) {
    const { data } = await api.patch(`/fpd/quizzes/${quizId}`, payload);
    return data;
  },

  async deleteQuiz(quizId: number) {
    const { data } = await api.delete(`/fpd/quizzes/${quizId}`);
    return data;
  },

  async submitQuiz(inscriptionId: number, quizId: number, reponseIndex: number) {
    const { data } = await api.post(`/fpd/inscriptions/${inscriptionId}/quiz/${quizId}`, { reponseIndex });
    return data;
  },

  async getMesSessions() {
    try {
      const { data } = await api.get("/fpd/sessions/mes-sessions");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("[fpdApi.getMesSessions] error:", e);
      return [];
    }
  },

  async getSessionsMentor() {
    try {
      const { data } = await api.get("/fpd/sessions/mentor");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("[fpdApi.getSessionsMentor] error:", e);
      return [];
    }
  },

  async createCandidature(payload: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    dateNaissance: string;
    genre: string;
    adresse: string;
    niveauEtude: string;
    sessionId?: number;
    motivation?: string;
  }) {
    const { data } = await api.post("/fpd/candidatures", payload);
    return data;
  },
};

/* ============================================
   EXPORT PAR DÉFAUT
   ============================================ */
export default {
  entreprises: entreprisesApi,
  mentors: mentorsApi,
  demandes: demandesApi,
  diagnostics: diagnosticsApi,
  publications: publicationsApi,
  conversations: conversationsApi,
  notifications: notificationsApi,
  upload: uploadApi,
  documents: documentsApi,
  search: searchApi,
  profile: profileApi,
  adminStats: adminStatsApi,
  annuaire: annuaireApi,
  fpd: fpdApi,
};