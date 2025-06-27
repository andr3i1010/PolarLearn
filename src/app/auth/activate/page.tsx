"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Check, Loader2 } from "lucide-react";

export default function ActivatePage() {
  const [isActivating, setIsActivating] = useState(true);
  const [activationStatus, setActivationStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setActivationStatus("error");
      setErrorMessage("ja hoor, denk je echt dat je de token weg kan halen");
      setIsActivating(false);
      return;
    }

    // Activate the account
    activateAccount(token);
  }, [searchParams]);

  const activateAccount = async (token: string) => {
    try {
      const response = await fetch("/api/v1/auth/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setActivationStatus("success");
        toast.success("Account succesvol geactiveerd! Je wordt doorgestuurd...");

        setTimeout(() => {
          router.push("/home/start");
        }, 2000);
      } else {
        setActivationStatus("error");
        setErrorMessage(result.error || "Er is een fout opgetreden bij het activeren van je account.");
        toast.error(result.error || "Activatie mislukt");
      }
    } catch (error) {
      console.error("Activation error:", error);
      setActivationStatus("error");
      setErrorMessage("Er is een fout opgetreden bij het activeren van je account.");
      toast.error("Er is een fout opgetreden");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900">
      <div className="max-w-md w-full bg-neutral-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mb-6">
            <img
              src="/icon.png"
              alt="PolarLearn Logo"
              className="h-12 w-12 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-white mb-2">
              Account Activeren
            </h1>
          </div>

          {activationStatus === "loading" && (
            <div className="space-y-4">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
              <p className="text-neutral-300">
                {isActivating ? "Account wordt geactiveerd..." : "Bezig met laden..."}
              </p>
            </div>
          )}

          {activationStatus === "success" && (
            <div className="space-y-4">
              <div className="bg-green-500 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto">
                <Check/>
              </div>
              <h2 className="text-xl font-semibold text-white">
                Account Geactiveerd!
              </h2>
              <p className="text-neutral-300">
                Je account is succesvol geactiveerd. Je wordt nu doorgestuurd naar de homepagina...
              </p>
            </div>
          )}

          {activationStatus === "error" && (
            <div className="space-y-4">
              <div className="bg-red-500 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">
                Activatie Mislukt
              </h2>
              <p className="text-neutral-300 text-sm">
                {errorMessage}
              </p>
              <div className="space-y-3 mt-6">
                <button
                  onClick={() => router.push("/auth/sign-in")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  Ga naar Inloggen
                </button>
                <button
                  onClick={() => router.push("/auth/sign-up")}
                  className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  Nieuw Account Aanmaken
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
