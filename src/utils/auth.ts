import NextAuth, { CredentialsSignin, User, Session } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { User as DbUser } from "@prisma/client"
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
import { User as dbUser } from "@prisma/client"
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
        // Changed signIn page to redirect with notAllowed query parameter when access is denied
        signIn: '/auth/sign-in?notAllowed=1',
    },
    providers: [
        Google({
            clientId:                          process.env.AUTH_GOOGLE_ID,
            clientSecret:                      process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/user.emails.read"
                }
            }
        }),
        GitHub({
            clientId:     process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,

        }),
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
                if (!user || !user.accounts || user.accounts.length === 0) 
                    throw new CustomSignInError("User not found")

               
                if (await argon2.verify(
                    user.accounts[0].access_token as string
                    , credentials.password as string
                    )
                ) {
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
        async jwt({ token, user }) {
            const dbUser = user as dbUser
            if (user) token.role = dbUser.role
            token.exp = Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60
            return token
        },
        async session({ session, token }) {
            session.user.role = token?.role as string | undefined
            return session
        },
        async signIn({ user, account, profile, email, credentials }) {
            if (account?.provider === "google" && account.access_token) {
                const res = await fetch(
                    "https://people.googleapis.com/v1/people/me?personFields=emailAddresses",
                    { headers: { Authorization: `Bearer ${account.access_token}` } }
                );
                const peopleData = await res.json();
                if (peopleData?.emailAddresses && Array.isArray(peopleData.emailAddresses)) {
                    for (const emailAddress of peopleData.emailAddresses) {
                        const altEmail = emailAddress.value;
                        const existingUser = await prisma.user.findUnique({
                            where: { email: altEmail }
                        });
                        if (existingUser) {
                            console.log("Merging account: found existing user with email:", altEmail);
                            await prisma.account.upsert({
                                where: {
                                    provider_providerAccountId: {
                                        provider: account.provider,
                                        providerAccountId: account.providerAccountId
                                    }
                                },
                                update: { userId: existingUser.id },
                                create: {
                                    provider: account.provider,
                                    providerAccountId: account.providerAccountId,
                                    userId: existingUser.id,
                                    type: account.type,
                                    refresh_token: account.refresh_token,
                                    access_token: account.access_token,
                                    expires_at: account.expires_at,
                                    token_type: account.token_type,
                                    scope: account.scope,
                                    id_token: account.id_token,
                                }
                            });
                            user = existingUser;
                            break;
                        }
                    }
                }
            }
            const dbUser = user as DbUser;
            console.log(dbUser);
            if (dbUser.listData === null) {
                await prisma.user.update({
                    where: {
                        email: dbUser.email || "",
                    },
                    data: {
                        listData: { recent_lists: [], liked_lists: [], created_lists: [], recent_subjects: [] },
                    },
                });
            }
            // Allow login if loginAllowed is not explicitly false
            if (user && (dbUser.loginAllowed !== false)) {
                return true;
            }
            return false;
        },
    }
})