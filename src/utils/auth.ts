import NextAuth, { CredentialsSignin } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import crypto from "crypto"
import pool from "@/utils/mysql"
import { RowDataPacket } from "mysql2"

class CustomSignInError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
    this.message = code;
    this.stack = undefined;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
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
        let user = null;
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM userdata WHERE email = ?',
          [credentials.email]
        );
        if (rows.length === 0) {
          throw new CustomSignInError("Invalid email or password");
        }

        console.log("User found:", rows[0]);

        const hashedpwd = crypto.pbkdf2Sync(credentials.password as string, rows[0].salt, 100000, 64, 'sha512')
        const isUserPasswordCorrect = hashedpwd.toString('hex') === rows[0].password
        if (isUserPasswordCorrect) {
          user = {id: rows[0].uuid, email: credentials.email, userType: rows[0].user_type }
        } else {
          //throw new Error("Invalid email or password")
          console.log("Invalid email or password");
          throw new CustomSignInError("Invalid email or password");
        }
        return user as {id: string, email: string, userType: string };
      }
    })
  ],
})