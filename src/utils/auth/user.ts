"use server"
import argon2 from "argon2";
import { prisma } from "@/utils/prisma";
import * as crypto from "crypto";
import { revalidatePath } from "next/cache";
import { transporter } from "../mail";

interface PasswordActionResult {
  success: boolean;
  tempPassword?: string;
  error?: any;
}

export async function sendSignUpEmail(email: string, username: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    await transporter.verify()
      .catch((err) => reject(err));
    const mail = await transporter.sendMail({
      from: `"PolarLearn" <noreply@polarlearn.tech>`,
      to: email,
      subject: `PolarLearn | Registratie voor ${username}`,
    })
  })
}

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
  const salt = crypto.randomBytes(16).toString("base64")
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

export async function resetUserPassword(userId: string): Promise<PasswordActionResult> {
  try {
    // Generate a random temporary password
    const tempPassword = crypto.randomBytes(8).toString('base64');
    const salt = crypto.randomBytes(16).toString("base64");

    // Hash the temporary password
    const hashedPassword = await hashPassword(tempPassword, salt);

    // Update the user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        salt: salt
      }
    });

    return { success: true, tempPassword };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error };
  }
}

export async function setCustomPassword(userId: string, password: string): Promise<PasswordActionResult> {
  try {
    const salt = crypto.randomBytes(16).toString("base64");

    // Hash the custom password
    const hashedPassword = await hashPassword(password, salt);

    // Update the user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        salt: salt
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error setting custom password:", error);
    return { success: false, error };
  }
}

export async function deleteUser(userId: string) {
  try {
    // First, delete all sessions for this user
    await prisma.session.deleteMany({
      where: { userId }
    });

    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error };
  }
}

