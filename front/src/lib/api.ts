import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

/* ============================================
   CONFIG
   ============================================ */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const UPLOADS_URL =
  process.env.NEXT_PUBLIC_UPLOADS_URL || "http://localhost:3001";

/* ============================================
   TYPES
   ============================================ */
export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  photoProfil?: string | null;
  bioCourte?: string | null;
  role: "ADMIN" | "MENTOR" | "DIRIGEANT" | string;
  actif?: boolean;
  emailVerifie?: boolean;
  derniereConnexion?: string | null;
  // Mentor
  domaineMentor?: string | null;
  experienceMentor?: number | null;
  bioMentor?: string | null;
  disponibilite?: string | null;
  agrementMentor?: string | null;
  noteMoyenne?: number;
  nbEvaluations?: number;
  languesMentor?: string[];
  // Préférences
  langue?: string;
  theme?: string;
  notifEmail?: boolean;
  notifSms?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/* ============================================
   STORAGE HELPERS
   ============================================ */
export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },
  set(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("access_token", token);
  },
  remove() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
  },
};

export const userStorage = {
  get(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  set(user: User) {
    if (typeof window === "undefined") return;
    localStorage.setItem("user", JSON.stringify(user));
  },
  remove() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
  },
};

/* ============================================
   AXIOS INSTANCE
   ============================================ */
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/* ---------- Intercepteur requête ---------- */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---------- Intercepteur réponse ---------- */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expiré
      tokenStorage.remove();
      userStorage.remove();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/connexion")) {
        window.location.href = "/connexion";
      }
    }
    return Promise.reject(error);
  },
);

/* ============================================
   HELPERS
   ============================================ */
export function getErrorMessage(err: any): string {
  if (err?.response?.data?.message) {
    const msg = err.response.data.message;
    if (Array.isArray(msg)) return msg.join(", ");
    return msg;
  }
  if (err?.message) return err.message;
  return "Une erreur est survenue";
}

export default api;