"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import GoogleLogin from "@/components/button/logInGoogle";
import GithubLogin from "@/components/button/loginGithub";
import Button1 from "@/components/button/Button1";
import { signInCredentials } from "@/utils/auth/auth";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { EyeOff } from "lucide-react";
import { Eye } from "lucide-react";
import { useState } from "react";

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

export default function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const error = params.get("error");
    const provider = params.get("provider");

    if (error === "banned") {
      toast.error(
        "Je account is verbannen wegens niet-toegestane activiteit. Deze actie kan niet ongedaan worden gemaakt.",
        {
          autoClose: 7000,
        }
      );
      router.replace("/auth/sign-in");
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
      router.replace(getCookie('polarlearn.goto') || "/auth/sign-in");
    }
  }, []);

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <div className="flex flex-col">
        <div className="flex flex-row items-center justify-center space-x-4">
          <GoogleLogin />
          <GithubLogin />
        </div>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-neutral-600" />
          <span className="mx-4 text-gray-500 dark:text-gray-400">of</span>
          <hr className="flex-grow border-neutral-600" />
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            const result = await signInCredentials(email, password);
            if (result === true) {
              router.push("/home/start");
            } else if (result === null || result === undefined) {
              toast.error("interne serverfout - onverwacht login resultaat");
              console.error("Login returned null/undefined result");
            } else if (typeof result === "object" && result.banned) {
              toast.error(`Je bent verbannen van PolarLearn met reden: ${result.message}. Als je denkt dat dit een fout was kan je de discord joinen (link in footer).`);
            } else if (typeof result === "string") {
              switch (result) {
                case "invcreds":
                  toast.error("Ongeldige inloggegevens");
                  break;
                default:
                  toast.error(`Onverwachte fout: ${result}`);
                  break;
              }
            } else {
              toast.error("interne serverfout");
              console.error("Unexpected login result:", result, typeof result);
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

          <Button1 type="submit" text="Log In" className="w-full" />
          <p className="text-sm font-light text-gray-500 dark:text-gray-400 text-center">
            Heb je nog geen account?{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary-600 hover:underline dark:text-primary-500"
            >
              <strong>Maak er dan eentje!</strong>
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
