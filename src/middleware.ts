import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth((req: any) => {
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/registro");

  // Redireciona para login se não autenticado
  if (!req.auth && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redireciona para dashboard se já autenticado
  if (req.auth && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
