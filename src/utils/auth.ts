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
import argon2 from "argon2"

interface PrismaUser {
    role?: string;
    email?: string;
    listData?: any;
    loginAllowed?: boolean;
}

class CustomSignInError extends CredentialsSignin {
    constructor(code: string) {
        super();
        this.code = code;
        this.message = code;
        this.stack = undefined;
    }
}

// Add new function to scan for alternative Google emails
async function scanAlternateGoogleEmails(account: any): Promise<User | null> {
    const res = await fetch(
        "https://people.googleapis.com/v1/people/me?personFields=emailAddresses",
        { headers: { Authorization: `Bearer ${account.access_token}` } }
    );
    const peopleData = await res.json();
    if (peopleData?.emailAddresses && Array.isArray(peopleData.emailAddresses)) {
        for (const emailAddress of peopleData.emailAddresses) {
            // Ensure altEmail is defined
            const altEmail = emailAddress?.value;
            if (!altEmail) continue;
            const existingUser = await prisma.user.findUnique({
                where: { email: altEmail }
            });
            if (existingUser) {
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
                return existingUser;
            }
        }
    }
    return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    pages: {
        signIn: "/auth/sign-in",
        error: "/auth/sign-in",
    },
    trustHost: true,
    adapter: PrismaAdapter(prisma),
    secret: process.env.AUTH_SECRET,
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/user.emails.read"
                }
            }
        }),
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
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
                    where: { email: credentials.email as string },
                    include: { accounts: true }
                });
                if (!user || !user.accounts || user.accounts.length === 0)
                    throw new CustomSignInError("User not found");
                if (await argon2.verify(
                    user.accounts[0].access_token as string,
                    credentials.password as string
                )) {
                    return user;
                } else {
                    throw new CustomSignInError("Incorrect password");
                }
            },
        })
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            const prismaUser = user as PrismaUser;
            if (user) token.role = prismaUser.role;
            token.exp = Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60;
            return token;
        },
        async session({ session, token }) {
            session.user.role = token?.role as string | undefined;
            return session;
        },
        async signIn({ user, account, profile, email, credentials }) {
            if (account?.provider === "google" && account.access_token) {
                const alternateUser = await scanAlternateGoogleEmails(account);
                if (alternateUser) {
                    user = alternateUser;
                }
            }
            // Enforce that OAuth providers require an existing credentials account
            if (account?.provider !== "credentials") {
                const credAccount = await prisma.account.findFirst({
                    where: {
                        OR: [
                            { userId: user.id, provider: "credentials" },
                            { provider: "credentials", providerAccountId: user.email as string }
                        ]
                    }
                });
                if (!credAccount) {
                    throw new CustomSignInError("User not found");
                }
            }
            const prismaUser = user as PrismaUser;
            if (prismaUser.listData === null) {
                await prisma.user.update({
                    where: {
                        email: prismaUser.email || "",
                    },
                    data: {
                        list_data: { recent_lists: [], liked_lists: [], created_lists: [], recent_subjects: [] },
                    },
                });
            }
            if (user && (prismaUser.loginAllowed === false)) {
                throw new CustomSignInError("AccessDenied");
            } else if (user) {
                return true;
            }
            return false;
        },
    }
})