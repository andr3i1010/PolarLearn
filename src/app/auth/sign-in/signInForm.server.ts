"use server"
import { signIn } from '@/utils/auth';

export async function signInFormAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  if (email && password) {
    try {
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      return { redirectTo: "/home/start" };
    } catch (error) {
      const errorCode = (error && (error as any).code) || "Default";
      return { redirectTo: `/auth/error?error=${errorCode}` };
    }
  }
  return { redirectTo: "/auth/error?error=Default" };
}
