import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      registrationComplete: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    registrationComplete?: boolean;
    googleAccessToken?: string;
    googleRefreshToken?: string;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        const role =
          profile.email === process.env.TEACHER_EMAIL ? "TEACHER" : "GUARDIAN";
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role,
        };
      },
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            passwordHash: true,
            registrationComplete: true,
          },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role, registrationComplete: user.registrationComplete };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        const u = user as { role?: string; registrationComplete?: boolean };
        token.role = u.role ?? "GUARDIAN";
        token.registrationComplete = u.registrationComplete ?? false;
      }
      if (account?.provider === "google") {
        token.googleAccessToken = account.access_token ?? undefined;
        token.googleRefreshToken = account.refresh_token ?? undefined;
      }
      if (trigger === "update" || (!user && token.id)) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, registrationComplete: true },
          });
          console.log("[JWT] db sync:", dbUser);
          if (dbUser) {
            token.role = dbUser.role;
            token.registrationComplete = dbUser.registrationComplete;
          }
        } catch (err) {
          console.error("[JWT] db sync failed, keeping existing token values:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      session.user.registrationComplete = token.registrationComplete ?? false;
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
