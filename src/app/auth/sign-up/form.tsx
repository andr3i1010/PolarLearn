"use client"
import Button1 from "@/components/button/Button1";
import { toast } from "react-toastify";
export default function SignUpForm() {
    return (
            <form className="space-y-4 md:space-y-6"
            action={async (formData) => {
              const username = formData.get("username");
              const email    = formData.get("email");
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
            } else {
                if (response.status === 409) {
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
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                E-mail
              </label>
              <input
                type="email"
                maxLength={255}
                name="email"
                id="email"
                className="bg-neutral-800 border text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 dark:text-white focus:border-blue-500"
                placeholder="email@mail.nl"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Wachtwoord
              </label>
              <input
                type="password"
                maxLength={100}
                name="password"
                id="password"
                placeholder="••••••••••••••••••••••••••••••••"
                className="bg-neutral-800 border text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 dark:text-white focus:border-blue-500"
                required
              />
            </div>
            <Button1 text="Maak 'm aan!" className="w-full" type="submit"/>
          </form>
    )
}