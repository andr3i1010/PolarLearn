"use server"
import argon2 from "argon2";
import { prisma } from "@/utils/prisma";
import * as crypto from "crypto";

export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    argon2
      .hash((password + process.env.PEPPER) as string, {
        salt: Buffer.from(salt),
      })
      .then((hash) => {
        resolve(hash);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export async function createUserCredentials(
  username: string,
  email: string,
  password: string
) {
  const salt = crypto.randomBytes(16).toString("hex")
  const id = crypto.randomUUID()

  return new Promise(async (resolve, reject) => {
    await prisma.user
      .create({
        data: {
          id: id,
          name: username,
          email: email,
          password: await hashPassword(
            password,
            salt
          ),
          salt: salt,
          loginAllowed: true,
          forumAllowed: true,
          // Use unique placeholder values for OAuth fields
          githubOAuthID: id,
          googleOAuthID: id,
          list_data: {
            recent_lists: [],
            created_lists: [],
            recent_subjects: [],
          }
        },
      })
      .then((user: any) => {
        resolve({ success: true, userdata: user });
      })
      .catch((err: { code: string; }) => {
        if (err.code === "P2002") {
          reject({ success: false, error: "userexists" });
        }
        reject(err);
      });
  });
}

