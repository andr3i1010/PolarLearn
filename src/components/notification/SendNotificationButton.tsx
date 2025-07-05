"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button1 from "@/components/button/Button1"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Trash2 } from "lucide-react"
import { sendUserNotification } from "./notificationActions"

interface SendNotificationButtonProps {
    userId: string
    userName?: string
    buttonText?: string
    className?: string
    isAdmin?: boolean
}

export default function SendNotificationButton({
    userId,
    userName,
    buttonText = "Stuur bericht",
    className,
    isAdmin = false
}: SendNotificationButtonProps) {
    const [open, setOpen] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [content, setContent] = useState("")
    const [icon, setIcon] = useState("MessageSquare")
    const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null)
    const router = useRouter()

    const handleSend = useCallback(async () => {
        if (!content.trim()) {
            setStatus({ success: false, message: "Je moet een bericht invullen" });
            return;
        }

        setIsSending(true);
        setStatus(null);

        try {
            const result = await sendUserNotification(userId, content, icon);
            setStatus(result);

            if (result.success) {
                setTimeout(() => {
                    setOpen(false);
                    setContent("");
                    router.refresh();
                }, 1500);
            } else {
                setIsSending(false);
            }
        } catch (error) {
            setStatus({ success: false, message: "Er is iets misgegaan" });
            setIsSending(false);
        }
    }, [userId, content, icon, router]);

    const defaultClassName = "text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-blue-900/20 z-10 transition-all";

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setOpen(true);
                }}
                className={className || defaultClassName}
                title="Stuur notificatie"
            >
                {buttonText}
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] z-110 bg-neutral-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Stuur bericht</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Stuur een bericht naar {userName || "deze gebruiker"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid w-full max-w-sm items-center gap-4">
                        <div>
                            <label className="text-sm font-medium leading-none mb-2 block">Icoon</label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger className="bg-neutral-900 border-neutral-700">
                                    <SelectValue placeholder="Kies een icoon" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                                    <SelectItem value="MessageSquare">Bericht</SelectItem>
                                    <SelectItem value="Bell">Bel</SelectItem>
                                    <SelectItem value="Info">Info</SelectItem>
                                    <SelectItem value="AlertCircle">Alert</SelectItem>
                                    <SelectItem value="Mail">E-mail</SelectItem>
                                    <SelectItem value="User">Gebruiker</SelectItem>
                                    <SelectItem value="Award">Award</SelectItem>
                                    <SelectItem value="Star">Ster</SelectItem>
                                    <SelectItem value="Trash2">Prullenbak</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium leading-none mb-2 block">Bericht</label>
                            <Textarea
                                placeholder="Voer je bericht in"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="h-24 bg-neutral-900 border-neutral-700"
                            />
                        </div>

                        {status && (
                            <div className={`p-2 rounded ${status.success ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}>
                                {status.message}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button1
                            onClick={() => setOpen(false)}
                            text="Annuleren"
                            disabled={isSending}
                        />
                        <Button1
                            onClick={handleSend}
                            text={isSending ? "Verzenden..." : "Verzenden"}
                            disabled={isSending || !content.trim()}
                            icon={<MessageSquare className="h-4 w-4" />}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
