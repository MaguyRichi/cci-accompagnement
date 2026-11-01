import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ============================================
   ROUTES PROTÉGÉES
   ============================================ */
const protectedRoutes = ["/admin", "/pme"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Le token est posé en cookie "cci_token" par AuthContext (en plus du localStorage)
  const token = request.cookies.get("cci_token")?.value;

  // Route protégée + pas de token → redirection vers /connexion
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  if (isProtected && !token) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ⚠️ On ne redirige PLUS les utilisateurs connectés depuis /connexion
  // → c'est le rôle de l'useEffect de la page /connexion
  // (ça évite les boucles si le cookie n'est pas synchronisé)

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - api
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - uploads
     */
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};