import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth
    ...(process.env.AUTH_GOOGLE_ID
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),

    // Credentials provider
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email as string;
        const password = credentials.password as string | undefined;
        const role = (credentials.role as string) || "PATIENT";

        try {
          let user = await prisma.user.findUnique({ where: { email } });

          if (user) {
            // Nếu user có password (đã đăng ký thật), cần validate
            if (user.password) {
              if (!password) return null;
              const valid = await bcrypt.compare(password, user.password);
              if (!valid) return null;
            }
            // user.password === null → demo mode, không cần password
          } else {
            // Tự động tạo demo user nếu chưa tồn tại
            user = await prisma.user.create({
              data: {
                email,
                name: email.split("@")[0],
                role: role === "DOCTOR" ? "DOCTOR" : "PATIENT",
              },
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (err) {
          console.error("[Auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],

  // JWT strategy: sessions stored in cookie, adapter handles OAuth user/account creation
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account }) {
      // Chạy lần đầu khi sign in (user có giá trị)
      if (user) {
        token.id = user.id;
      }

      // Với Google OAuth — lấy thêm thông tin từ DB
      if (account?.provider === "google" && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } catch (err) {
          console.error("[Auth] jwt google lookup error:", err);
        }
        return token;
      }

      // Với Credentials — lấy role từ DB theo token.id
      if (token.id && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          token.role = dbUser?.role ?? "PATIENT";
        } catch (err) {
          console.error("[Auth] jwt role lookup error:", err);
          token.role = "PATIENT";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "PATIENT";
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});

