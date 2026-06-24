import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

// Inicializa ou reutiliza o Prisma (para evitar multiplas conexoes em dev)
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Dados de login inválidos");
        }
        
        let user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Automação para Demonstração: Criar usuário se não existir
        if (!user) {
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const role = credentials.email.toLowerCase().includes("gerente") ? "GERENTE" : "CORRETOR";
          const name = role === "GERENTE" ? "Gerente Principal" : "Corretor";
          
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              name: name,
              role: role,
            }
          });
        } else {
          // Se existir, checa a senha
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            throw new Error("Senha incorreta");
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Criaremos esta pagina a seguir
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
