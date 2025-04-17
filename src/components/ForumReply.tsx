"use client"

import { useState, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Button1 from "@/components/button/Button1"
import { createReply } from "@/actions/forum"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

interface ForumReplyProps {
  postId: string
  buttonText?: string
}

function ForumReply({ postId, buttonText = "Beantwoorden" }: ForumReplyProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createReply(postId, content)
      setContent("")
      setOpen(false)
      router.refresh() // UPDATED: Refresh page using Next router
    } catch (error) {
      toast.error("Er is iets misgegaan bij het versturen van je reactie: " + error)
    } finally {
      setIsSubmitting(false)
    }
  }, [postId, content, router])

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
