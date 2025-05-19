"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Button1 from "@/components/button/Button1";
import { startImpersonation } from "@/utils/auth/impersonate";

interface ImpersonateUserButtonProps {
  userId: string;
  userName: string | null; // User's name for display in the dialog
}

function ImpersonateUserButton({ userId, userName }: ImpersonateUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleImpersonate = useCallback(async () => {
    setIsProcessing(true);
    try {
      const result = await startImpersonation(userId);

      if (result.success) {
        setOpen(false);
        // Redirect to home page as the impersonated user
        router.push("/home/start");
        router.refresh();
      } else {
        console.error("Impersonation failed:", result.error);
      }
    } catch (error) {
      console.error("Error during impersonation:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [userId, router]);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
  }, []);

  return (
    <>
      <button
        onClick={handleButtonClick}
        className="text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-blue-900/20 z-10 transition-all"
        title="chroot"
      >
        chroot
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px] z-110">
          <DialogHeader>
            <DialogTitle>Bevestig impersonatie</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je tijdelijk wilt inloggen als {userName || "deze gebruiker"}?
              <br /><br />
              <strong>Let op:</strong> Je kunt altijd teruggaan naar je admin account via de banner die verschijnt.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end space-x-2 mt-4">
            <Button1
              onClick={() => setOpen(false)}
              text="Annuleren"
            />
            <Button1
              onClick={handleImpersonate}
              text={isProcessing ? "Bezig..." : "Bevestigen"}
              disabled={isProcessing}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(ImpersonateUserButton);
