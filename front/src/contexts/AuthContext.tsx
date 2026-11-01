"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, LoginResponse } from "@/lib/auth";
import { tokenStorage, userStorage, User } from "@/lib/api";

/* ============================================
   TYPES DU CONTEXTE
   ============================================ */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, motDePasse: string) => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

/* ============================================
   HELPERS — COOKIE (pour le middleware Next.js)
   ============================================ */
const COOKIE_NAME = "cci_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 jours

function setTokenCookie(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

/* ============================================
   PROVIDER
   ============================================ */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /* ---------- Charger l'utilisateur au démarrage ---------- */
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.get();
      const cachedUser = userStorage.get();

      if (token && cachedUser) {
        // Synchroniser le cookie avec le localStorage
        setTokenCookie(token);
        setUser(cachedUser);

        // Vérifier que le token est toujours valide
        try {
          const freshUser = await authApi.me();
          setUser(freshUser);
        } catch {
          // Token invalide → déconnexion
          tokenStorage.remove();
          userStorage.remove();
          clearTokenCookie();
          setUser(null);
        }
      } else {
        // Pas de token → s'assurer qu'il n'y a pas de cookie résiduel
        clearTokenCookie();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /* ---------- CONNEXION ---------- */
  const login = useCallback(
    async (email: string, motDePasse: string): Promise<LoginResponse> => {
      const response = await authApi.login(email, motDePasse);
      // authApi.login a déjà mis le token dans le localStorage
      // → on synchronise le cookie
      const token = tokenStorage.get();
      if (token) setTokenCookie(token);
      setUser(response.user);
      return response;
    },
    [],
  );

  /* ---------- DÉCONNEXION ---------- */
  const logout = useCallback(() => {
    tokenStorage.remove();
    userStorage.remove();
    clearTokenCookie();
    setUser(null);
    router.push("/connexion");
  }, [router]);

  /* ---------- RAFRAÎCHIR L'UTILISATEUR ---------- */
  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authApi.me();
      setUser(freshUser);
    } catch {
      tokenStorage.remove();
      userStorage.remove();
      clearTokenCookie();
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}