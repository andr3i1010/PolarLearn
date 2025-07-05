"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button1 from "@/components/button/Button1"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare } from "lucide-react"

interface SendNotificationButtonProps {
    userId: string
    userName?: string
}

export default function SendNotificationButton({ userId, userName }: SendNotificationButtonProps) {
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
            const response = await fetch("/api/v1/notifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId, content, icon }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setStatus({ success: true, message: result.message });
                setTimeout(() => {
                    setOpen(false);
                    setContent("");
                    router.refresh();
                }, 1500);
            } else {
                setStatus({ success: false, message: result.error || "Er is iets misgegaan" });
                setIsSending(false);
            }
        } catch (error) {
            console.error("Error sending notification:", error);
            setStatus({ success: false, message: "Er is iets misgegaan" });
            setIsSending(false);
        }
    }, [userId, content, icon, router]);

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setOpen(true);
                }}
                className="text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-blue-900/20 z-10 transition-all"
                title="Stuur notificatie"
            >
                Stuur notificatie
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] z-110">
                    <DialogHeader>
                        <DialogTitle>Stuur notificatie</DialogTitle>
                        <DialogDescription>
                            Stuur een notificatie naar {userName || "deze gebruiker"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid w-full max-w-sm items-center gap-4">
                        <div>
                            <Label htmlFor="icon">Icoon</Label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Kies een icoon" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={5} className="z-[150] text-color-white">
                                    <SelectItem value="MessageSquare">Bericht</SelectItem>
                                    <SelectItem value="Bell">Bel</SelectItem>
                                    <SelectItem value="Info">Info</SelectItem>
                                    <SelectItem value="AlertCircle">Alert</SelectItem>
                                    <SelectItem value="Mail">E-mail</SelectItem>
                                    <SelectItem value="User">Gebruiker</SelectItem>
                                    <SelectItem value="Award">Award</SelectItem>
                                    <SelectItem value="Star">Ster</SelectItem>
                                    <SelectItem value="Trash">Prullenbak</SelectItem>
                                    <SelectItem value="ArrowBigUp">Upvote pijl</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="content">Bericht</Label>
                            <Textarea
                                id="content"
                                placeholder="Voer je bericht in"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="h-24"
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
