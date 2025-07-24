"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleLogin from "@/components/button/logInGoogle";
import GithubLogin from "@/components/button/loginGithub";
import Button1 from "@/components/button/Button1";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { EyeOff, Loader2 } from "lucide-react";
import { Eye } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getValidRedirectPath, clearRedirectCookie } from "@/utils/auth/redirect";
import Honeypot from "../honeypot";

function getCookie(cname: string) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export default function SignInForm({ googleEnabled = true, githubEnabled = true, turnstileEnabled = true }: { googleEnabled?: boolean; githubEnabled?: boolean; turnstileEnabled?: boolean }) {
  const router = useRouter();
  // Debug: log the sitekey to verify if it's available in the client-side
  //console.log('NEXT_PUBLIC_TURNSTILE_SITE_KEY:', process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const params = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [showResendActivation, setShowResendActivation] = useState(false);
  const [widgetId, setWidgetId] = useState<number | null>(null);

  const handleResendActivation = async () => {
    const email = prompt("Voer je e-mailadres in om een nieuwe activatie-email te ontvangen:");

    if (!email) return;

    try {
      const response = await fetch("/api/v1/auth/resend-activation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error || "Er is een fout opgetreden");
      }
    } catch (error) {
      console.error("Resend activation error:", error);
      toast.error("Er is een fout opgetreden bij het versturen van de activatie-email");
    }
  };

  useEffect(() => {
    const error = params.get("error");
    const message = params.get("message");
    const provider = params.get("provider");

    // Handle success messages first
    if (message === "check_email") {
      toast.info(
        "Account aangemaakt! Controleer je e-mail en klik op de activatielink om je account te activeren.",
        {
          autoClose: 8000,
        }
      );
      router.replace("/auth/sign-in");
      return;
    }

    if (message === "already_activated") {
      toast.info("Je account is al geactiveerd. Je kunt nu inloggen.");
      router.replace("/auth/sign-in");
      return;
    }

    // Handle activation errors
    if (error === "missing_token") {
      toast.error("Geen activatie token gevonden. Controleer de link in je e-mail.");
      router.replace("/auth/sign-in");
      return;
    }

    if (error === "invalid_token") {
      toast.error("Ongeldige of verlopen activatie token. Probeer opnieuw te registreren.");
      router.replace("/auth/sign-in");
      return;
    }

    if (error === "invalid_or_used_token") {
      toast.error("Ongeldige of reeds gebruikte activatie token. Als je account al geactiveerd is, probeer dan in te loggen.");
      router.replace("/auth/sign-in");
      return;
    }

    if (error === "activation_failed") {
      toast.error("Er is een fout opgetreden bij het activeren van je account.");
      router.replace("/auth/sign-in");
      return;
    }

    if (error === "banned") {
      toast.error(
        "Je account is verbannen wegens niet-toegestane activiteit. Deze actie kan niet ongedaan worden gemaakt.",
        {
          autoClose: 7000,
        }
      );
      router.replace("/auth/sign-in");
      clearRedirectCookie();
      return;
    }

    if (error === "session_expired") {
      toast.info(
        "Je sessie is verlopen. Log opnieuw in om verder te gaan.",
        {
          autoClose: 5000,
        }
      );
      router.replace("/auth/sign-in");
      clearRedirectCookie();
      return;
    }


    if (error === "banned") {
      toast.error(
        "Je account is verbannen wegens niet-toegestane activiteit. Deze actie kan niet ongedaan worden gemaakt.",
        {
          autoClose: 7000,
        }
      );
      router.replace("/auth/sign-in");
      clearRedirectCookie();
      return;
    }

    if (error === "session_expired") {
      toast.info(
        "Je sessie is verlopen. Log opnieuw in om verder te gaan.",
        {
          autoClose: 5000,
        }
      );
      router.replace("/auth/sign-in");
      clearRedirectCookie();
      return;
    }

    if (error && provider) {
      switch (error) {
        case "usernotfound":
          toast.error(
            `Geen account gevonden met het ${provider} account. Er moet een bestaande account (met email en wachtwoord) bestaan om in te loggen met ${provider}.`,
            {
              autoClose: 7000,
            }
          );
          break;
        case "oautherror":
          toast.error(`Er is een fout opgetreden tijdens de ${provider} inlog`);
          break;
        default:
          toast.error("Er is een onbekende fout opgetreden");
          break;
      }
      router.replace(getValidRedirectPath(getCookie('polarlearn.goto')));
      router.replace(getValidRedirectPath(getCookie('polarlearn.goto')));
    }
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (!turnstileEnabled) return;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onload = () => {
      if (window.turnstile) {
        const id = window.turnstile.render("#turnstile-signin", {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
          callback: (token: string) => {
            setCaptchaToken(token);
            setCaptchaLoading(false);
          },
          "error-callback": () => {
            setCaptchaLoading(false);
          },
        });
        setWidgetId(id);
      }
    };
  }, [turnstileEnabled]);

  return (
    <div className="relative">
      <div className="flex flex-col">
        <div className="flex flex-row items-center justify-center space-x-4">
          {googleEnabled && <GoogleLogin />}
          {githubEnabled && <GithubLogin />}
        </div>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-neutral-600" />
          <span className="mx-4 text-gray-500 dark:text-gray-400">of</span>
          <hr className="flex-grow border-neutral-600" />
        </div>

        <form
          ref={formRef}
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            let tokenToSend = captchaToken;
            if (turnstileEnabled) {
              if (!captchaToken) {
                toast.error("Bevestig dat je geen robot bent.");
                return;
              }
            } else {
              tokenToSend = "";
            }
            try {
              const response = await fetch("/api/v1/auth/sign-in", {
                method: "POST",
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, captchaToken: tokenToSend }),
              });
              const data = await response.json();
              if (response.ok && data.success) {
                toast.success("Succesvol ingelogd!");

                // Get redirect path - check both server response and cookie
                const serverGoto = data.goto;
                const cookieGoto = getCookie('polarlearn.goto');
                const gotoPath = getValidRedirectPath(serverGoto || cookieGoto) || '/home/start';

                // Clear redirect cookie
                clearRedirectCookie();

                // Add a small delay to ensure session is established, then redirect
                setTimeout(() => {
                  // Try router first, fallback to window.location
                  try {
                    router.push(gotoPath);
                  } catch (err) {
                    console.warn("nextjs router redirect gefaald:", err);
                    window.location.href = gotoPath;
                  }
                }, 200);
              } else {
                // Check if error is related to email verification
                if (data.error && data.error.includes("geverifieerd")) {
                  setShowResendActivation(true);
                }
                toast.error(data.error || "Er is een fout opgetreden");
                // Reset captcha on login failure
                if (window.turnstile && widgetId !== null && turnstileEnabled) {
                  window.turnstile.reset(widgetId);
                  setCaptchaToken("");
                  setCaptchaLoading(true);
                }
              }
            } catch (error) {
              console.error("Sign-in error:", error);
              toast.error("Er is een fout opgetreden bij het inloggen");
              // Reset captcha on network/other errors
              if (window.turnstile && widgetId !== null && turnstileEnabled) {
                window.turnstile.reset(widgetId);
                setCaptchaToken("");
                setCaptchaLoading(true);
              }
            }
          }}
        >
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-white"
            >
              E-mail
            </label>
            <input
              type="email"
              name="email"
              className="bg-neutral-800 border text-white rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 dark:text-white focus:border-blue-500"
              placeholder="naam@gmail.com"
              required
            />
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
            <br />
          </div>

          {turnstileEnabled && (
            <div id="turnstile-signin" className="flex justify-center"></div>
          )}
          <Button1
            type="submit"
            text={captchaLoading ? (turnstileEnabled ? "CAPTCHA uitvoeren..." : "Log In") : "Log In"}
            className="w-full"
            disabled={turnstileEnabled ? (captchaLoading || !captchaToken) : false}
            icon={captchaLoading && turnstileEnabled ? <Loader2 className="animate-spin" /> : null}
          />
          <p className="text-sm font-light text-gray-500 dark:text-gray-400 text-center mt-2">
            Heb je nog geen account?{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary-600 hover:underline dark:text-primary-500"
            >
              <strong>Maak er dan eentje!</strong>
            </Link>
          </p>
          {showResendActivation && (
            <p className="text-sm font-light text-gray-500 dark:text-gray-400 text-center mt-2">
              Account niet geactiveerd?{" "}
              <button
                type="button"
                onClick={handleResendActivation}
                className="font-medium text-primary-600 hover:underline dark:text-primary-500 cursor-pointer"
              >
                <strong>Verstuur nieuwe activatie-email</strong>
              </button>
            </p>
          )}
          <Honeypot />
        </form>
      </div>
    </div>
  );
}
