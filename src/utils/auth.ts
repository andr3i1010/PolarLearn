import NextAuth, { CredentialsSignin, User, Session } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

declare module "next-auth" {
    interface Session {
        user: User & {
            role?: string;
        };
    }
}
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/utils/prisma"
import { AppUser } from "./types"
import { account as dbUser } from "@prisma/client"
import argon2 from "argon2"

class CustomSignInError extends CredentialsSignin {
    constructor(code: string) {
        super();
        this.code = code;
        this.message = code;
        this.stack = undefined;
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    adapter: PrismaAdapter(prisma),
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: '/auth/sign-in',
    },
    providers: [
        Google,
        GitHub,
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const userRow = await prisma.account.findFirst({
                    where: {
                        email: credentials.email as string,
                    },
                    include: {
                        user_password: true,
                    }
                });
                if (!userRow) throw new CustomSignInError("Invalid email or password");
                const passwordRow = await prisma.user_password.findFirst({
                    where: {
                        user_id: userRow.uuid
                    },
                    include: {
                        user: true
                    }
                })
                if (!passwordRow) throw new CustomSignInError("⚠️ NO PASSWORD FOUND IN DATABASE!!!");
                let user: AppUser | null = null;
                const isPwdCorrect = await argon2.verify(passwordRow.password, credentials.password as string);
                if (isPwdCorrect) {
                    user = { id: userRow.id, email: userRow.email, name: userRow.username || '', role: userRow.role || "default" }
                } else {
                    //throw new Error("Invalid email or password")
                    throw new CustomSignInError("Invalid email or password");
                }
                return user;
            },
        })
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        jwt({ token, user }) {
            const dbUser = user as dbUser
            if (user) token.role = dbUser.role
            return token
        },
        session({ session, token }) {
            session.user.role = token?.role as string | undefined
            return session
        }
    }
})