"use client"

import { useState, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button1 from "@/components/button/Button1"
import { deleteUser } from "@/utils/auth/user"

interface DeleteUserButtonProps {
    userId: string
}

function DeleteUserButton({ userId }: DeleteUserButtonProps) {
    const [open, setOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = useCallback(async () => {
        setIsDeleting(true)
        try {
            await deleteUser(userId)
            setIsDeleting(false)
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error("Error deleting user:", error)
            setIsDeleting(false)
            setOpen(false)
        }
    }, [userId, router])

    const handleButtonClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setOpen(true);
    }, []);

    return (
        <>
            <button
                onClick={handleButtonClick}
                className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20 z-10 transition-all"
                title="Verwijder gebruiker"
            >
                Verwijder gebruiker
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] z-110">
                    <DialogHeader>
                        <DialogTitle>Bevestig verwijderen</DialogTitle>
                        <DialogDescription>
                            Weet je zeker dat je deze gebruiker wilt verwijderen?
                            Deze actie kan niet ongedaan worden gemaakt.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button1
                            onClick={() => setOpen(false)}
                            text="Annuleren"
                        />
                        <Button1
                            onClick={handleDelete}
                            text={isDeleting ? "Bezig..." : "Verwijderen"}
                            disabled={isDeleting}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default memo(DeleteUserButton);
