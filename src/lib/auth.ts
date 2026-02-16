import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const config: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials: Record<string, unknown> | undefined) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user) return null;

        const senhaValida = await compare(
          credentials.password as string,
          user.senha_hash
        );
        if (!senhaValida) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
        };
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }: { auth: any; request: any }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/api/auth")) return true;
      return true;
    },
    jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
