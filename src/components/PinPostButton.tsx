"use client"

import { useState, useCallback, memo } from "react"
import { Pin, PinOff } from "lucide-react"
import { togglePinPost } from "@/actions/togglePinPost"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

interface PinPostButtonProps {
    postId: string
    isAdmin: boolean
    initialPinned: boolean
}

function PinPostButton({
    postId,
    isAdmin,
    initialPinned
}: PinPostButtonProps) {
    const [isPinned, setIsPinned] = useState(initialPinned)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // Don't render if not admin
    if (!isAdmin) {
        return null
    }

    // Create handle button click, similar to other post action buttons
    const handleButtonClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        handleTogglePin();
    }, []);

    // Create handle toggle pin function
    const handleTogglePin = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await togglePinPost(postId)

            if (result.success) {
                setIsPinned(result.pinned)
                toast.success(result.pinned
                    ? "Post is vastgezet"
                    : "Post is niet meer vastgezet")
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            console.error("Error toggling pin status:", error)
            toast.error("Er is een fout opgetreden")
        } finally {
            setIsLoading(false)
        }
    }, [postId, router])

    return (
        <button
            onClick={handleButtonClick}
            disabled={isLoading}
            className={isPinned
                ? "text-green-500 hover:text-green-300 p-2 rounded hover:bg-green-900/20 z-10 transition-all"
                : "text-green-500 hover:text-green-300 p-2 rounded hover:bg-green-900/20 z-10 transition-all"
            }
            title={isPinned ? "Post niet meer vastmaken" : "Post vastmaken"}
        >
            {isPinned ? (
                <PinOff size={18} />
            ) : (
                <Pin size={18} />
            )}
        </button>
    )
}

export default memo(PinPostButton)
