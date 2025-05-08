"use client"

import { useState, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button1 from "@/components/button/Button1"
import { resetUserPassword, setCustomPassword } from "@/utils/auth/user"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Tabs, { TabItem } from "@/components/Tabs"
import { Eye, EyeOff } from "lucide-react"

interface ResetPasswordButtonProps {
    userId: string
}

function ResetPasswordButton({ userId }: ResetPasswordButtonProps) {
    const [open, setOpen] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [tempPassword, setTempPassword] = useState("")
    const [customPassword, setCustomPasswordValue] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [passwordError, setPasswordError] = useState("")
    const router = useRouter()

    const handleButtonClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setOpen(true);
        setTempPassword("");
        setCustomPasswordValue("");
        setConfirmPassword("");
        setPasswordError("");
    }, []);

    const handleCopyPassword = useCallback(() => {
        navigator.clipboard.writeText(tempPassword);
        toast.success("Wachtwoord gekopieerd naar klembord");
    }, [tempPassword]);

    // Separate reset functions for each password type
    const handleRandomReset = useCallback(async () => {
        setIsResetting(true);
        setPasswordError("");

        try {
            // Use random generated password
            const result = await resetUserPassword(userId);
            if (result.success && result.tempPassword) {
                setTempPassword(result.tempPassword);
            } else {
                toast.error("Er is een fout opgetreden bij het resetten van het wachtwoord");
                setOpen(false);
            }
            setIsResetting(false);
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error("Er is een fout opgetreden bij het resetten van het wachtwoord");
            setIsResetting(false);
            setOpen(false);
        }
    }, [userId, setOpen]);

    const handleCustomReset = useCallback(async () => {
        setIsResetting(true);
        setPasswordError("");

        try {
            // Custom password validation
            if (customPassword.length < 8) {
                setPasswordError("Wachtwoord moet minimaal 8 tekens bevatten");
                setIsResetting(false);
                return;
            }

            if (customPassword !== confirmPassword) {
                setPasswordError("Wachtwoorden komen niet overeen");
                setIsResetting(false);
                return;
            }

            // Set custom password
            await setCustomPassword(userId, customPassword);
            setTempPassword(customPassword);
            toast.success("Wachtwoord succesvol gewijzigd");
            setIsResetting(false);
        } catch (error) {
            console.error("Error setting custom password:", error);
            toast.error("Er is een fout opgetreden bij het wijzigen van het wachtwoord");
            setIsResetting(false);
        }
    }, [userId, customPassword, confirmPassword]);

    // Define tab content with separate function calls
    const passwordTabs: TabItem[] = [
        {
            id: "random",
            label: "Willekeurig wachtwoord",
            content: (
                <div>
                    <p className="text-sm text-gray-400 mt-2 mb-4">
                        Er wordt een willekeurig wachtwoord gegenereerd dat de gebruiker kan wijzigen.
                    </p>
                    <Button1
                        onClick={handleRandomReset}
                        text={isResetting ? "Bezig..." : "Reset wachtwoord"}
                        disabled={isResetting}
                    />
                </div>
            )
        },
        {
            id: "custom",
            label: "Aangepast wachtwoord",
            content: (
                <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nieuw wachtwoord</Label>
                        <Input
                            id="new-password"
                            type={showPassword ? "text" : "password"}
                            value={customPassword}
                            onChange={(e) => setCustomPasswordValue(e.target.value)}
                            placeholder="Voer nieuw wachtwoord in"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Bevestig wachtwoord</Label>
                        <Input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Bevestig nieuw wachtwoord"
                        />
                    </div>
                    <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        <span>{showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}</span>
                    </button>
                    {passwordError && (
                        <p className="text-red-400 text-sm">{passwordError}</p>
                    )}
                    <Button1
                        onClick={handleCustomReset}
                        text={isResetting ? "Bezig..." : "Reset wachtwoord"}
                        disabled={isResetting}
                    />
                </div>
            )
        }
    ];

    return (
        <>
            <button
                onClick={handleButtonClick}
                className="text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-blue-900/20 z-10 transition-all"
                title="Reset wachtwoord"
            >
                Reset wachtwoord
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] z-110">
                    <DialogHeader>
                        <DialogTitle>
                            {tempPassword ? "Nieuw wachtwoord" : "Reset wachtwoord"}
                        </DialogTitle>
                        <DialogDescription>
                            {tempPassword
                                ? "Kopieer dit nieuwe wachtwoord en geef het aan de gebruiker:"
                                : "Kies een optie om het wachtwoord te resetten:"}
                        </DialogDescription>
                    </DialogHeader>

                    {tempPassword ? (
                        <div className="my-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={tempPassword}
                                    readOnly
                                    className="w-full p-2 border rounded-md bg-neutral-800 border-neutral-700"
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700"
                                    title={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button
                                    onClick={handleCopyPassword}
                                    className="px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700"
                                >
                                    Kopieer
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Tabs
                            tabs={passwordTabs}
                            defaultActiveTab="random"
                        />
                    )}

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button1
                            onClick={() => setOpen(false)}
                            text="Sluiten"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default memo(ResetPasswordButton);
