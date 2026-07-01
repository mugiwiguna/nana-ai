import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const foundUsers = await query("SELECT * FROM users WHERE email = $1", [
          email,
        ]);
        const user = foundUsers.rows[0];
        if (!user || !user.password_hash) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          balance: user.balance,
          status: user.status,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const email = user.email!;
          const name = user.name ?? email.split("@")[0];
          const image = user.image;
          const googleId = account.providerAccountId;

          const existing = await query("SELECT * FROM users WHERE email = $1", [
            email,
          ]);

          if (existing.rows[0]) {
            const dbUser = existing.rows[0];
            if (!dbUser.google_id) {
              await query(
                "UPDATE users SET google_id = $1, image = $2 WHERE email = $3",
                [googleId, image ?? null, email]
              );
            }
            user.id = dbUser.id;
            (user as any).balance = dbUser.balance;
            (user as any).status = dbUser.status;
          } else {
            const res = await query(
              `INSERT INTO users (email, name, google_id, image, password_hash, balance)
               VALUES ($1, $2, $3, $4, '', 0) RETURNING id, balance`,
              [email, name, googleId, image ?? null]
            );
            const newUser = res.rows[0];
            user.id = newUser.id;
            (user as any).balance = 0;
          }
          return true;
        } catch (e) {
          console.error("Google signIn error:", e);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.balance = (user as any).balance ?? 0;
        token.status = (user as any).status ?? "active";
        token.role = (user as any).role ?? "user";
      } else {
        const res = await query("SELECT balance, status, role FROM users WHERE id = $1", [
          token.id,
        ]);
        if (res.rows[0]) {
          token.balance = res.rows[0].balance;
          token.status = res.rows[0].status;
          token.role = res.rows[0].role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).balance = token.balance;
        (session.user as any).status = token.status;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
