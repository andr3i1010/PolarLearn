"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endImpersonation } from "@/utils/auth/impersonate";
import { Info } from "lucide-react";

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
        <Info className="mr-2"/>
        <span>
          CHROOT: <strong>{adminName}</strong> handelt momenteel als <strong>{impersonatedUserName}</strong>
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
