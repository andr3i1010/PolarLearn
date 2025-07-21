"use server"
import argon2 from "argon2";
import { prisma } from "@/utils/prisma";
import * as crypto from "crypto";
import { revalidatePath } from "next/cache";
import { transporter } from "../mail";
import { Prisma } from "@prisma/client";
import { Embed, Webhook } from '@vermaysha/discord-webhook'
const hook = new Webhook(process.env.DISCORD_WEBHOOK || '')

interface PasswordActionResult {
  success: boolean;
  tempPassword?: string;
  error?: any;
}

export async function sendSignUpEmail(email: string, username: string, token: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!transporter) {
        const msg = "SMTP not configured: missing SMTP_HOST, SMTP_PORT, SMTP_USER, or SMTP_PASSWORD env vars. Skipping email verification.";
        console.warn(msg);
        // Simulate success, but warn that no email was sent
        return resolve("no-email-sent");
      }
      await transporter.verify();
      const activationUrl = `${process.env.NEXT_PUBLIC_URL || 'https://polarlearn.tech'}/auth/activate?token=${token}`;
      const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Account Activeren</title>
  </head>

  <body style="margin: 0; padding: 0; background-color: #f6f9fc">
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      bgcolor="#171717"
    >
      <tr>
        <td align="center" style="padding: 40px 0">
          <!-- Main container -->
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            border="0"
            bgcolor="#ffffff"
            style="border-radius: 8px; overflow: hidden"
          >
            <!-- Header -->
            <tr>
              <td align="center" bgcolor="#404040" style="padding: 30px 20px">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <img
                        src="https://polarlearn.tech/icon.png"
                        height="40"
                        alt="Logo Icon"
                        style="vertical-align: middle; margin-right: 10px"
                      />
                    </td>
                    <td align="center">
                      <img
                        src="https://polarlearn.tech/text.png"
                        width="200"
                        alt="PolarLearn"
                        style="vertical-align: middle"
                      />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td
                style="
                  padding: 30px 20px;
                  font-family: Arial, sans-serif;
                  font-size: 16px;
                  color: #ffffff;
                  background: #272727;
                "
              >
                <p>Hallo ${username},</p>
                <p>
                  Welkom bij PolarLearn! Om je account te activeren en te kunnen beginnen met leren, 
                  moet je eerst je e-mailadres bevestigen.
                </p>
                <p>
                  Klik op de knop hieronder om je account te activeren:
                </p>

                <div style="text-align: center; margin: 30px 0">
                  <div
                    style="
                      position: relative;
                      display: inline-block;
                      transition: transform 0.15s ease-in-out;
                      border-radius: 0.5rem;
                    "
                  >
                    <div
                      style="
                        border-radius: 0.5rem;
                        border: 4px solid #404040;
                        transition-duration: 0.3s;
                        overflow: hidden;
                        position: relative;
                      "
                    >
                      <a
                        style="
                          width: 100%;
                          border-radius: 0.25rem;
                          transition: all 0.3s ease;
                          background-color: #262626;
                          color: white;
                          font-weight: bold;
                          padding: 0.5rem 1rem;
                          text-align: center;
                          display: block;
                          text-decoration: none;
                          box-sizing: border-box;
                        "
                        href="${activationUrl}"
                      >
                        <span
                          style="
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                          "
                          >Account activeren</span
                        >
                      </a>
                    </div>
                  </div>
                </div>

                <p>
                  Deze link vervalt in 24 uur. Als je deze link niet hebt aangevraagd, 
                  kun je deze e-mail veilig negeren.
                </p>
                <p>
                  Als de knop niet werkt, kopieer dan deze link naar je browser:<br>
                  <a href="${activationUrl}" style="color: #38bdf8; word-break: break-all;">${activationUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                bgcolor="#f0f0f0"
                style="
                  padding: 20px;
                  font-family: Arial, sans-serif;
                  font-size: 12px;
                  color: #888888;
                  text-align: center;
                  background: #272727;
                "
              >
                Dit email is automatisch gestuurd vanuit PolarLearn. Je kan
                hierop niet antwoorden
              </td>
            </tr>
          </table>
          <!-- End Main container -->
        </td>
      </tr>
    </table>
  </body>
</html>`;

      const mail = await transporter.sendMail({
        from: `"PolarLearn" <noreply@polarlearn.tech>`,
        to: email,
        subject: `PolarLearn | Account activeren voor ${username}`,
        html: htmlTemplate
      });
      resolve(mail.messageId);
    } catch (err) {
      console.error("Error in sendSignUpEmail:", err);
      reject(err);
    }
  });
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
  const activationToken = crypto.randomBytes(32).toString("hex")

  // Set scheduled deletion for 24 hours from now
  const scheduledDeletion = new Date(Date.now() + 24 * 60 * 60 * 1000)

  return new Promise(async (resolve, reject) => {
    try {
      console.log("Creating user with data:", { username, email, hasPassword: !!password });

      const userData: Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput> = {
        id: id,
        name: username,
        email: email,
        password: await hashPassword(password, salt),
        salt: salt,
        emailVerified: null, // Email not verified yet
        loginAllowed: false, // Don't allow login until email is verified
        forumAllowed: false, // Don't allow forum access until email is verified
        // Use unique placeholder values for OAuth fields
        githubOAuthID: id,
        googleOAuthID: id,
        list_data: {
          recent_lists: [],
          created_lists: [],
          recent_subjects: [],
        }
      };

      // Add activation token and scheduled deletion if supported
      try {
        (userData as any).activationToken = activationToken;
        (userData as any).scheduledDeletion = scheduledDeletion;
      } catch (e) {
        console.warn("Prisma schema may not include activationToken/scheduledDeletion fields");
      }

      const user = await prisma.user.create({
        data: userData,
      });

      console.log("User created successfully:", user.id);

      // Send activation email (or skip if SMTP not configured)
      let emailResult: string | undefined = undefined;
      try {
        console.log("Sending activation email...");
        emailResult = await sendSignUpEmail(email, username, activationToken);
        if (emailResult === "no-email-sent") {
          // Mark user as verified if no email was sent
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date(), loginAllowed: true, forumAllowed: true },
          });
          console.warn("No SMTP configured: user marked as verified automatically.");
        } else {
          console.log("Activation email sent successfully");
        }
        resolve({ success: true, userdata: user });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // If email sending fails for other reasons, delete the created user
        try {
          await prisma.user.delete({ where: { id: user.id } });
          console.log("User deleted due to email send failure");
        } catch (deleteError) {
          console.error("Failed to delete user after email error:", deleteError);
        }
        reject({ success: false, error: "email_send_failed" });
      }
    } catch (err: any) {
      console.error("Error creating user:", err);
      if (err.code === "P2002") {
        reject({ success: false, error: "userexists" });
      } else {
        reject({ success: false, error: err.message || "database_error" });
      }
    }
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
    const naam = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });
    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    revalidatePath('/admin');
    hook.addEmbed(
      new Embed()
        .setTitle('Gebruiker Verwijderd')
        .setDescription(`Gebruiker met de naam ${naam} is verwijderd`)
        .setColor('#ff0000')
        .setTimestamp()
        .setFooter({
          text: 'Van ' + process.env.NEXT_PUBLIC_URL,
        })
    )
    await hook.send();
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error };
  }
}

