"use client"

import { useState, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button1 from "@/components/button/Button1"
import { banUserForum, banUserPlatform, unbanUserForum, unbanUserPlatform } from "@/utils/auth/ban"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DeletePostButtonProps {
    userId: string
    text: string
    platform: boolean
    unban: boolean
}

function DeletePostButton({
    userId,
    text,
    platform,
    unban
}: DeletePostButtonProps) {
    const [open, setOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = useCallback(async () => {
        setIsDeleting(true)
        try {
            document.getElementById("Reden")?.setAttribute("disabled", "true")
            const reason = document.getElementById("Reden") as HTMLInputElement
            if (platform) {
                if (!unban) {
                    await banUserPlatform(userId, reason.value || 'onbekend');
                } else {
                    await unbanUserPlatform(userId);
                }
            } else {
                if (!unban) {
                    await banUserForum(userId, reason.value || 'onbekend');
                } else {
                    await unbanUserForum(userId);
                }
            }
            setIsDeleting(false)
            setOpen(false)
            router.refresh()
        } catch (error) {

        }
    }, [userId, router])

    const handleButtonClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setOpen(true);
    }, []);

    const handleOpenChange = useCallback((isOpen: boolean) => {
        setOpen(isOpen);
    }, []);

    // Use event.stopPropagation to prevent triggering the link click when clicking the delete button
    return (
        <>
            <button
                onClick={handleButtonClick}
                className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20 z-10"
                title="Verwijderen"
            >
                {text}
            </button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[425px] z-110">
                    <DialogHeader>
                        <DialogTitle>Bevestig {unban ? "ontbanning" : "verbanning"}</DialogTitle>
                        <DialogDescription>
                            Weet je zeker dat je dit acount wilt {unban ? "ontbanning" : "verbanning"}
                        </DialogDescription>
                    </DialogHeader>
                    {!unban ? (
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="Reden">Reden</Label>
                            <Input id="Reden" placeholder="Reden" />
                        </div>) : ""}

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button1
                            onClick={() => setOpen(false)}
                            text="Nee"
                        />
                        <Button1
                            onClick={handleDelete}
                            text={isDeleting ? "Bezig met iets..." : "ja!"}
                            disabled={isDeleting}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default memo(DeletePostButton);
