"use client"

import { useState, useCallback } from "react"
import { deletePost } from "@/actions/forum"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button1 from "@/components/button/Button1"
import { Trash2 } from "lucide-react"

interface DeletePostButtonProps {
    postId: string
    isCreator: boolean
    isMainPost?: boolean
}

export default function DeletePostButton({
    postId,
    isCreator,
    isMainPost = false
}: DeletePostButtonProps) {
    const [open, setOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    if (!isCreator) {
        return null;
    }

    const handleDelete = useCallback(async () => {
        setIsDeleting(true)
        try {
            const result = await deletePost(postId)
            if (result.redirect) {
                router.push(result.redirect)
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error("Error deleting post:", error)
            setIsDeleting(false)
            setOpen(false)
        }
    }, [postId, router])

    // Use event.stopPropagation to prevent triggering the link click when clicking the delete button
    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setOpen(true);
                }}
                className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20 z-10"
                title="Verwijderen"
            >
                <Trash2 size={18} />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] z-110">
                    <DialogHeader>
                        <DialogTitle>Bevestig verwijdering</DialogTitle>
                        <DialogDescription>
                            {isMainPost
                                ? "Weet je zeker dat je deze post wilt verwijderen? Alle reacties zullen ook worden verwijderd."
                                : "Weet je zeker dat je dit antwoord wilt verwijderen?"
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button1
                            onClick={() => setOpen(false)}
                            text="Annuleren"
                        />
                        <Button1
                            onClick={handleDelete}
                            text={isDeleting ? "Bezig met verwijderen..." : "Verwijderen"}
                            disabled={isDeleting}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}