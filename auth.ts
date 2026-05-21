import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow the configured admin email
      return user.email?.toLowerCase() === ADMIN_EMAIL;
    },
    authorized({ auth }) {
      return !!auth;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
