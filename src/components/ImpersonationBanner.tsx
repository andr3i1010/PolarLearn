"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endImpersonation } from "@/utils/auth/impersonate";

interface ImpersonationBannerProps {
  adminName: string;
  impersonatedUserName: string;
}

export default function ImpersonationBanner({ adminName, impersonatedUserName }: ImpersonationBannerProps) {
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);

  const handleEndImpersonation = async () => {
    setIsEnding(true);
    try {
      await endImpersonation();
      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Error ending impersonation:", error);
      setIsEnding(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-600 text-white p-2 flex justify-between items-center shadow-md h-10">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          Admin modus: <strong>{adminName}</strong> handelt momenteel als <strong>{impersonatedUserName}</strong>
        </span>
      </div>
      <button
        onClick={handleEndImpersonation}
        disabled={isEnding}
        className="bg-white text-amber-700 px-3 py-1 rounded text-sm hover:bg-amber-50 transition-colors disabled:opacity-50 font-medium"
      >
        {isEnding ? "Bezig..." : "Terug naar admin"}
      </button>
    </div>
  );
}
