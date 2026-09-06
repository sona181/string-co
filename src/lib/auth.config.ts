import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    // Runs in proxy.ts (edge middleware) — no DB access here, JWT only.
    // The session callback below maps token.role → session.user.role so
    // the authorized callback can read it. auth.ts overrides session with
    // its own richer version; this one is only used by the proxy instance.
    session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.role = token.role;
        u.id   = token.sub;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn     = !!auth?.user;
      const isAdminRoute   = nextUrl.pathname.startsWith("/admin");
      const isAccountRoute = nextUrl.pathname.startsWith("/account");

      if (isAdminRoute)   return isLoggedIn && (auth?.user as Record<string, unknown> | undefined)?.role === "ADMIN";
      if (isAccountRoute) return isLoggedIn;
      return true;
    },
  },
};
