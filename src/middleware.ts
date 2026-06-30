import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // Protect /dashboard routes — no session cookie means redirect to login
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (session && (pathname === "/login" || pathname === "/register")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  // Redirect from homepage to dashboard if logged in
  if (session && pathname === "/") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
