"use client"
import Button1 from "@/components/button/Button1";
import { toast } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { EyeOff } from "lucide-react";
import { Eye } from "lucide-react";
import Honeypot from "../honeypot";

export default function SignUpForm() {
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);

  const delay = (ms: number) => new Promise(
    resolve => setTimeout(resolve, ms)
  );

  const validateUsername = (username: string) => {
    // Only allow alphanumeric characters, dots, and underscores
    const validUsernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!validUsernameRegex.test(username)) {
      setUsernameError("Gebruikersnaam mag alleen letters, cijfers, punten en underscores bevatten");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const validateEmail = (email: string) => {
    // Basic email format check
    const re = /\S+@\S+\.\S+/;
    if (!re.test(email)) {
      setEmailError("Ongeldig e-mailadres");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      setPasswordError("Wachtwoord moet minimaal 8 tekens bevatten");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onload = () => {
      if (window.turnstile) {
        const id = window.turnstile.render("#turnstile-signup", {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
          callback: async (token: string) => {
            setCaptchaReady(true);
            // perform sign-up after invisible captcha
            const form = formRef.current!;
            const formData = new FormData(form);
            const username = formData.get("username") as string;
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;

            const usernameValid = validateUsername(username);
            const emailValid = validateEmail(email);
            const passwordValid = validatePassword(password);

            if (!usernameValid || !emailValid || !passwordValid) {
              if (window.turnstile && widgetId !== null) {
                window.turnstile.reset(widgetId);
                setCaptchaReady(false);
              }
              return;
            }

            try {
              const response = await fetch("/api/v1/auth/sign-up", {
                method: "POST",
                credentials: 'include',
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password, captchaToken: token }),
              });
              const result = await response.json();
              if (response.ok && result.success) {
                toast.success(result.message || "Account succesvol aangemaakt! Controleer je e-mail om je account te activeren.");
                await delay(3000);
                router.push("/auth/sign-in?message=check_email");
              } else {
                toast.error(result.error || "Er is een fout opgetreden");
                // Reset captcha on server error
                if (window.turnstile && widgetId !== null) {
                  window.turnstile.reset(widgetId);
                  setCaptchaReady(false);
                }
              }
            } catch (err) {
              console.error("Sign-up error:", err);
              toast.error("Er is een fout opgetreden bij het aanmaken van je account");
              // Reset captcha on network/other errors
              if (window.turnstile && widgetId !== null) {
                window.turnstile.reset(widgetId);
                setCaptchaReady(false);
              }
            }
          },
        });
        setWidgetId(id);
      }
    };
  }, []);

  return (
    <form
      ref={formRef}
      className="space-y-4 md:space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (widgetId !== null && window.turnstile) {
          window.turnstile.execute(widgetId);
        } else {
          toast.error("Bevestig dat je geen robot bent.");
        }
      }}
    >
      <div>
        <label
          htmlFor="username"
          className="block mb-2 text-sm font-medium text-white"
        >
          Gebruikersnaam
        </label>
        <input
          type="text"
          name="username"
          id="username"
          className="bg-neutral-800 border rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 text-white focus:border-blue-500"
          placeholder="Naam123456"
          pattern="^[a-zA-Z0-9._]+$"
          title="Alleen letters, cijfers, punten en underscores toegestaan"
          onChange={(e) => validateUsername(e.target.value)}
          required
        />
        {usernameError && (
          <p className="mt-1 text-sm text-red-500">{usernameError}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="email"
          className="block mb-2 text-sm font-medium text-white"
        >
          E-mail
        </label>
        <input
          type="email"
          maxLength={255}
          name="email"
          id="email"
          className="bg-neutral-800 border rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 text-white focus:border-blue-500"
          placeholder="email@mail.nl"
          onChange={(e) => validateEmail(e.target.value)}
          required
        />
        {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
      </div>
      <div>
        <label
          htmlFor="password"
          className="block mb-2 text-sm font-medium text-white"
        >
          Wachtwoord
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="••••••••"
            className="bg-neutral-800 border rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10 border-neutral-700 placeholder-gray-400 text-white focus:border-blue-500"
            onChange={(e) => validatePassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
          >
            {showPassword ? <Eye /> : <EyeOff />}
          </button>
        </div>
        {passwordError && (
          <p className="mt-1 text-sm text-red-500">{passwordError}</p>
        )}
      </div>
      <div id="turnstile-signup" className="flex justify-center"></div>
      <Button1
        text={captchaReady ? "Maak 'm aan!" : "CAPTCHA laden..."}
        className="w-full"
        type="submit"
        disabled={!captchaReady}
      />
      <Honeypot />
    </form>
  )
}