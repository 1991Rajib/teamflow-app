import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = [
        '/dashboard',
        '/projects',
        '/tasks',
        '/team',
        '/billing',
        '/settings',
        '/admin',
      ];
      
      const isProtected = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      ) && nextUrl.pathname !== '/admin' && nextUrl.pathname !== '/admin/';

      if (isProtected) {
        if (isLoggedIn) return true;
        return false; // Redirect to /login
      }

      // Allow root path to render landing page
      if (nextUrl.pathname === '/') {
        return true;
      }

      if (
        isLoggedIn &&
        (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')
      ) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Defined in auth.ts
} satisfies NextAuthConfig;
