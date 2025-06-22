"use client"

import { useState, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Button1 from "@/components/button/Button1"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import { sendNotificationToUser } from "@/utils/notifications/sendNotification"


interface ForumReplyProps {
  postId: string
  buttonText?: string
  userId: string
}

function ForumReply({ postId, userId, buttonText = "Beantwoorden" }: ForumReplyProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/v1/forum/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, content, userId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setContent("")
        setOpen(false)
        toast.success("Je antwoord is succesvol geplaatst! Hiermee heb je 10 punten verdiend.")
        router.refresh()
      } else {
        toast.error(result.error || "Er is een fout opgetreden")
      }
    } catch (error) {
      console.error("Error creating reply:", error)
      toast.error("Er is iets misgegaan bij het versturen van je antwoord")
    } finally {
      setIsSubmitting(false)
    }
  }, [postId, content, userId, router])

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setContent("");
    }
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  return (
    <>
      <Button1 onClick={() => setOpen(true)} text={buttonText} />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] z-110">
          <DialogHeader>
            <DialogTitle>Beantwoord deze post</DialogTitle>
            <DialogDescription>
              Deel je gedachten of antwoord op deze vraag.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Typ je antwoord hier..."
              value={content}
              onChange={handleContentChange}
              className="min-h-[150px] border-neutral-600 resize-none"
              required
            />

            <div className="flex justify-end space-x-2">
              <Button1
                type="submit"
                disabled={isSubmitting || !content.trim()}
                text={isSubmitting ? "Bezig..." : "Plaats antwoord"}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default memo(ForumReply);
