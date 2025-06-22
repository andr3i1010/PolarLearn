"use client"
import Button1 from "@/components/button/Button1";
import { toast } from "react-toastify";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff } from "lucide-react";
import { Eye } from "lucide-react";

export default function SignUpForm() {
  const [usernameError, setUsernameError] = useState("");

  const delay = (ms: number) => new Promise(
    resolve => setTimeout(resolve, ms)
  );

  const validateUsername = (username: string) => {
    if (username.includes(" ")) {
      setUsernameError("Gebruikersnaam mag geen spaties bevatten");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="space-y-4 md:space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get("username") as string;

        if (!validateUsername(username)) {
          return;
        }

        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
          const response = await fetch("/api/v1/auth/sign-up", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            toast.success("Account succesvol aangemaakt!");
            await delay(1500);
            router.push("/auth/sign-in");
          } else {
            toast.error(result.error || "Er is een fout opgetreden");
          }
        } catch (error) {
          console.error("Sign-up error:", error);
          toast.error("Er is een fout opgetreden bij het aanmaken van je account");
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
          pattern="^\S+$"
          title="Geen spaties toegestaan"
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
      </div>
      <Button1 text="Maak 'm aan!" className="w-full" type="submit" />
    </form>
  )
}