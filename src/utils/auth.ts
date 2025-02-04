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
import { user as dbUser } from "@prisma/client"
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
        Google({
            clientId:                          process.env.GOOGLE_CLIENT_ID,
            clientSecret:                      process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        GitHub,
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const user = await prisma.user.findFirst({
                    where: {
                        email: credentials.email as string
                    },
                    include: {
                        accounts: true
                    }
                })
                if (!user || !user.accounts || user.accounts.length === 0) throw new CustomSignInError("User not found")
                
                if (await argon2.verify(user.accounts[0].access_token as string, credentials.password as string)) {
                    return user
                } else {
                    throw new CustomSignInError("Incorrect password")
                }
            },
        })
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            
        },
        jwt({ token, user }) {
            const dbUser = user as dbUser
            if (user) token.role = dbUser.role
            token.exp = Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60
            return token
        },
        session({ session, token }) {
            session.user.role = token?.role as string | undefined
            return session
        }
    }
})