"use client";

import { useState, useCallback, memo, useEffect } from "react";
import { getPost } from "@/actions/forum";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import Button1 from "@/components/button/Button1";
import { Pencil } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import Tabs from "@/components/Tabs";
import { toast } from "react-toastify";

// Define schema for reply content validation
const replyFormSchema = z.object({
    content: z
        .string()
        .min(1, "Antwoord-inhoud is verplicht")
        .max(5000, "Inhoud mag maximaal 5000 tekens bevatten"),
});

interface EditReplyButtonProps {
    postId: string;
    isCreator: boolean;
    isAdmin?: boolean;
}

// Memoized markdown preview component
const MarkdownPreview = memo(({ content }: { content: string }) => (
    <div className="bg-neutral-800 border border-neutral-700 h-40 overflow-y-auto p-3 rounded-md prose prose-invert max-w-none whitespace-pre-line">
        {content ? (
            <ReactMarkdown
                components={{
                    h1: ({ node, ...props }) => (
                        <h1 className="text-4xl font-bold my-4" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="text-3xl font-bold my-3" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-2xl font-semibold my-2" {...props} />
                    ),
                    img: ({ src, alt, ...props }) => (
                        <img
                            src={src}
                            alt={alt || ""}
                            style={{ maxWidth: "100%", maxHeight: "400px", height: "auto" }}
                            {...props}
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        ) : (
            <p className="text-gray-400">Voorbeeldweergave verschijnt hier...</p>
        )}
    </div>
));

function EditReplyButton({
    postId,
    isCreator,
    isAdmin = false,
}: EditReplyButtonProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reply, setReply] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Initialize form with default empty values
    const form = useForm<z.infer<typeof replyFormSchema>>({
        resolver: zodResolver(replyFormSchema),
        defaultValues: {
            content: "",
        },
    });

    // Fetch reply data when dialog opens
    const fetchReply = useCallback(async () => {
        if (!postId) return;

        try {
            setLoading(true);
            const replyData = await getPost(postId);
            setReply(replyData);

            if (replyData) {
                form.reset({
                    content: replyData.content || "",
                });
            }
        } catch (error) {
            console.error("Error fetching reply:", error);
            toast.error("Fout bij het laden van het antwoord.");
        } finally {
            setLoading(false);
        }
    }, [postId, form]);

    // Extract content separately to avoid re-rendering the entire form
    const content = form.watch("content");

    if (!isCreator && !isAdmin) {
        return null;
    }

    const handleUpdate = useCallback(
        async (values: z.infer<typeof replyFormSchema>) => {
            if (!postId) return;

            try {
                setIsSubmitting(true);

                const response = await fetch(`/api/v1/forum/edit?postId=${postId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ content: values.content }),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    toast.success("Antwoord succesvol bijgewerkt!");
                    setOpen(false);
                    router.refresh();
                } else {
                    toast.error(result.error || "Er is een fout opgetreden");
                }
            } catch (error) {
                console.error("Error updating reply:", error);
                toast.error("Er is een fout opgetreden bij het bewerken van je antwoord.");
            } finally {
                setIsSubmitting(false);
            }
        },
        [postId, router]
    );

    const handleButtonClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            setOpen(true);
            fetchReply(); // Fetch reply data when dialog opens
        },
        [fetchReply]
    );

    const handleOpenChange = useCallback(
        (isOpen: boolean) => {
            setOpen(isOpen);
            if (isOpen) {
                fetchReply(); // Fetch reply data when dialog opens
            }
        },
        [fetchReply]
    );

    const handleFormSubmit = useCallback(() => {
        form.handleSubmit(handleUpdate)();
    }, [form, handleUpdate]);

    return (
        <>
            <button
                onClick={handleButtonClick}
                className="text-blue-500 hover:text-blue-300 p-2 rounded hover:bg-blue-900/20 z-10 transition-all"
                title="Bewerken"
            >
                <Pencil size={18} />
            </button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="z-[110] max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Bewerk antwoord</DialogTitle>
                        <DialogDescription>
                            Bewerk je antwoord. Markdown wordt ondersteund.
                        </DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex justify-center py-6">
                            <p>Laden...</p>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    form.handleSubmit(handleUpdate)(e);
                                }}
                                className="space-y-6"
                            >
                                {/* Content field */}
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xl">Antwoord-inhoud:</FormLabel>
                                            <Tabs
                                                tabs={[
                                                    {
                                                        id: "write",
                                                        label: "Schrijven",
                                                        content: (
                                                            <div>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="Inhoud van je antwoord. Markdown wordt ondersteund."
                                                                        className="bg-neutral-800 border-neutral-700 min-h-40 text-xl p-3 resize-none"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <div className="text-sm mt-2 text-gray-400">
                                                                    <p>Markdown tips:</p>
                                                                    <p>
                                                                        **vetgedrukt**, *schuingedrukt*,
                                                                        [link](https://url.com)
                                                                    </p>
                                                                    <p>
                                                                        # Grote kop, ## Kleinere kop, ### Nog
                                                                        kleinere kop
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ),
                                                    },
                                                    {
                                                        id: "preview",
                                                        label: "Voorbeeld",
                                                        content: <MarkdownPreview content={content} />,
                                                    },
                                                ]}
                                                defaultActiveTab="write"
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-2">
                                    <Button1
                                        text={
                                            isSubmitting
                                                ? "Bezig met bijwerken..."
                                                : "Bijwerken"
                                        }
                                        onClick={handleFormSubmit}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export default memo(EditReplyButton);
