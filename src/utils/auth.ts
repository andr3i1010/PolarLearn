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
import crypto from "crypto"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/utils/prisma"
import { AppUser } from "./types"
import { User as DbUser, UserPassword } from "@prisma/client"

class CustomSignInError extends CredentialsSignin {
    constructor(code: string) {
        super();
        this.code = code;
        this.message = code;
        this.stack = undefined;
    }
}


export const { handlers, auth, signIn, signOut } = NextAuth({
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

                const userRow = await prisma.user.findFirst({
                    where: {
                        email: credentials.email as string,
                    },
                    include: {
                        userPassword: true,
                    }

                });

                if (!userRow) {
                    console.log("User not found");
                    throw new CustomSignInError("Invalid email or password");
                }

                const passwordData = userRow.userPassword as UserPassword;

                let user: AppUser | null = null;

                const hashedpwd = crypto.pbkdf2Sync(credentials.password as string, passwordData.salt, 100000, 64, 'sha512')
                const isUserPasswordCorrect = hashedpwd.toString('hex') === passwordData.password_pbkdf2
                if (isUserPasswordCorrect) {
                    user = { id: userRow.id, email: userRow.email, name: userRow.name || '', role: userRow.role || "nobody" }
                } else {
                    //throw new Error("Invalid email or password")
                    console.log("Invalid email or password");
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
            const dbUser = user as DbUser
            if (user) token.role = dbUser.role
            return token
        },
        session({ session, token }) {
            session.user.role = token?.role as string | undefined
            return session
        }
    }
})