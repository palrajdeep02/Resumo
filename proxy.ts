import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const authHandler = NextAuth(authConfig).auth;

export default authHandler;

export const config = {
  // Protect /dashboard, /applications, /profile and subpaths, while ignoring public files/static routes
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
