"use client"

import { useState, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button1 from "@/components/button/Button1"
import { Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendUserNotification } from "@/components/notification/notificationActions"

interface DeletePostButtonProps {
  postId: string
  isCreator: boolean
  isMainPost?: boolean
  title?: string
  creatorId?: string
  isAdmin?: boolean
}

function DeletePostButton({
  postId,
  isCreator,
  isMainPost = false,
  title = "",
  creatorId = "",
  isAdmin = false
}: DeletePostButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reason, setReason] = useState("")
  const router = useRouter()

  // show reason input only when admin deletes someone else’s post
  const requiresReason = isAdmin && !isCreator
  const isReasonValid = !requiresReason || reason.trim().length > 0

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/v1/forum/delete?postId=${postId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // If admin is deleting someone else's post, send notification with reason
        if (requiresReason && creatorId) {
          try {
            const postTitle = title || (isMainPost ? "je vraag" : "je antwoord")
            let notificationMessage: string

            if (isMainPost) {
              notificationMessage = `Je vraag "${postTitle}" was verwijderd door een administrator, met reden: ${reason}`
            } else {
              notificationMessage = `Je antwoord op "${postTitle}" was verwijderd door een administrator, met reden: ${reason}`
            }

            await sendUserNotification(
              creatorId,
              notificationMessage,
              "Trash2",
              false  // Don't include sender name for admin deletion notifications
            )
          } catch (error) {
            console.error("Failed to send notification", error)
          }
        }

        setIsDeleting(false)
        setOpen(false)

        // If this is a main post, redirect to the forum, otherwise refresh
        if (result.isMainPost) {
          router.push("/home/forum")
        } else {
          router.refresh()
        }
      } else {
        throw new Error(result.error || "Failed to delete post")
      }
    } catch (error) {
      setIsDeleting(false)
      console.error("Failed to delete post", error)
    }
  }, [postId, isMainPost, router, requiresReason, creatorId, title, reason])

  // Function to handle open state
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setReason("")
    }
  }, [])

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20 z-10 transition-all"
        title="Verwijderen"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px] z-110">
          <DialogHeader>
            <DialogTitle>Bevestig verwijdering</DialogTitle>
            <DialogDescription>
              {isMainPost
                ? "Weet je zeker dat je deze vraag wilt verwijderen? Alle reacties zullen ook worden verwijderd. Je verliest 10 forumpunten als je je eigen post verwijdert."
                : "Weet je zeker dat je dit antwoord wilt verwijderen? Je verliest 10 forumpunten als je je eigen antwoord verwijdert."
              }
            </DialogDescription>
          </DialogHeader>

          {requiresReason && (
            <div className="grid w-full max-w-sm items-center gap-1.5 my-4">
              <Label htmlFor="reason">Reden voor verwijdering</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Geef een reden voor de verwijdering"
              />
              <p className="text-xs text-neutral-400">
                De gebruiker krijgt een melding met deze reden.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <Button1
              onClick={() => setOpen(false)}
              text="Annuleren"
            />
            <Button1
              onClick={handleDelete}
              text={isDeleting ? "Bezig..." : "Verwijderen"}
              disabled={isDeleting || !isReasonValid}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default memo(DeletePostButton);
