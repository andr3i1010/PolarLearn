"use client"
import Button1 from "@/components/button/Button1";
import { redirect } from "next/navigation";
import { toast } from "react-toastify";
import type { Metadata } from 'next'
import { useState } from "react";

export const metadata: Metadata = {
  title: 'PolarLearn - Account aanmaken',
  description: 'Accountcreatiepagina van PolarLearn',
}

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
  
  return (
    <form className="space-y-4 md:space-y-6"
      action={async (formData) => {
        const username = formData.get("username") as string;
        
        if (!validateUsername(username)) {
          return; // Stop form submission
        }
        
        const email = formData.get("email");
        const password = formData.get("password");
        const response = await fetch("/api/auth/create", {
          method: "POST",
          body: JSON.stringify({
            username,
            email,
            password
          })
        });
        if (response.ok) {
          toast.success("Account aangemaakt!");
          await delay(5000);
          redirect("/auth/sign-in");
        } else {
          if (response.status === 400) {
            toast.error("Gebruiker bestaat al");
          } else if (response.status === 500) {
            toast.error("🚨 Interne serverfout!");
          }
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
        <input
          type="password"
          maxLength={100}
          name="password"
          id="password"
          placeholder="••••••••••••••••••••••••••••••••"
          className="bg-neutral-800 border rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 text-white focus:border-blue-500"
          required
        />
      </div>
      <Button1 text="Maak 'm aan!" className="w-full" type="submit" />
    </form>
  )
}