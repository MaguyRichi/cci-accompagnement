import api, { tokenStorage, userStorage, User } from "./api";

/* ============================================
   TYPES
   ============================================ */
export interface LoginResponse {
  message: string;
  access_token: string;
  user: User;
}

export interface RegisterDirigeantPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  raisonSociale: string;
  sigle?: string;
  nif: string;
  stat: string;
  rcs?: string;
  formeJuridique?: string;
  secteur: string;
  taille?: string;
  effectif?: number;
  adresse?: string;
  ville?: string;
  description?: string;
}

export interface RegisterMentorPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  domaineMentor: string;
  experienceMentor: number;
  bioMentor: string;
  disponibilite?: string;
  agrementMentor?: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  token?: string;
}

export interface ActivatePayload {
  token: string;
  motDePasse: string;
}

export interface VerifyTokenResponse {
  valide: boolean;
  raison?: string;
  email?: string;
  nom?: string;
  prenom?: string;
  role?: string;
}

/* ============================================
   AUTHENTIFICATION
   ============================================ */
export const authApi = {
  /* ---------- CONNEXION ---------- */
  async login(email: string, motDePasse: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", {
      email,
      motDePasse,
    });

    tokenStorage.set(data.access_token);
    userStorage.set(data.user);

    return data;
  },

  /* ---------- INSCRIPTION DIRIGEANT ---------- */
  async registerDirigeant(
    payload: RegisterDirigeantPayload,
  ): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>(
      "/auth/register-dirigeant",
      payload,
    );
    return data;
  },

  /* ---------- INSCRIPTION MENTOR ---------- */
  async registerMentor(
    payload: RegisterMentorPayload,
  ): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>(
      "/auth/register-mentor",
      payload,
    );
    return data;
  },

  /* ---------- VÉRIFIER UN TOKEN D'ACTIVATION (NOUVEAU) ---------- */
  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    const { data } = await api.get<VerifyTokenResponse>("/auth/verify-token", {
      params: { token },
    });
    return data;
  },

  /* ---------- ACTIVATION (création mot de passe) ---------- */
  async activate(
    payload: ActivatePayload,
  ): Promise<{ message: string; email?: string; role?: string }> {
    const { data } = await api.post("/auth/activate", payload);
    return data;
  },

  /* ---------- MOT DE PASSE OUBLIÉ ---------- */
  async forgotPassword(email: string) {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },

  /* ---------- RÉINITIALISER MOT DE PASSE ---------- */
  async resetPassword(token: string, nouveauMotDePasse: string) {
    const { data } = await api.post("/auth/reset-password", {
      token,
      nouveauMotDePasse,
    });
    return data;
  },

  /* ---------- PROFIL CONNECTÉ ---------- */
  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    userStorage.set(data);
    return data;
  },

  /* ---------- DÉCONNEXION ---------- */
  logout() {
    tokenStorage.remove();
    userStorage.remove();
    if (typeof window !== "undefined") {
      window.location.href = "/connexion";
    }
  },

  /* ---------- UTILITAIRES ---------- */
  isAuthenticated(): boolean {
    return !!tokenStorage.get();
  },

  getCurrentUser(): User | null {
    return userStorage.get();
  },
};