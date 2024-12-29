import NextAuth, { CredentialsSignin, User } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import crypto from "crypto"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/utils/prisma"
import { AppUser } from "./types"

class CustomSignInError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
    this.message = code;
    this.stack = undefined;
  }
}


export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    GitHub,
    Credentials({
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"},
      },
      authorize: async (credentials) => {
        console.log("Credentials provided:", credentials);
        let user:  User = {
          name: "Test User",
          email: "test@test.com",
          id: "1234",

        };
        return user;

        // const userRow = prisma.User.findFirst({
        //   where: {
        //     email: credentials.email,
        //   },
        //   include: {
        //   }
            
        // });

        // console.log("User found:", userRow);

        // let user: AppUser | null = null;

        // const hashedpwd = crypto.pbkdf2Sync(credentials.password as string, userRow.salt, 100000, 64, 'sha512')
        // const isUserPasswordCorrect = hashedpwd.toString('hex') === userRow.password
        // if (isUserPasswordCorrect) {
        //   user = {id: userRow.uuid, email: userRow.email, name: userRow.name, role: userRow.role}
        // } else {
        //   //throw new Error("Invalid email or password")
        //   console.log("Invalid email or password");
        //   throw new CustomSignInError("Invalid email or password");
        // }
        // return user;
      },
    })
  ],
})