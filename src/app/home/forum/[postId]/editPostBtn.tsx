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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formSchema } from "../formSchema";
import ReactMarkdown from "react-markdown";
import Tabs from "@/components/Tabs";
import { Combobox } from "../selectSubjCombobox";
import { SelectCategoryCombobox } from "../selectCategoryCombobox";
import { toast } from "react-toastify";

interface EditPostButtonProps {
  postId: string;
  isCreator: boolean;
  isMainPost?: boolean;
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

function EditPostButton({
  postId,
  isCreator,
  isMainPost = false,
  isAdmin = false,
}: EditPostButtonProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Initialize form with default empty values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      subject: "",
      category: "",
    },
  });

  // Fetch post data when dialog opens
  const fetchPost = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      const postData = await getPost(postId);
      setPost(postData);

      if (postData) {
        form.reset({
          title: postData.title || "",
          content: postData.content || "",
          subject: postData.subject || "",
          category: postData.category || "",
        });
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Fout bij het laden van de post.");
    } finally {
      setLoading(false);
    }
  }, [postId, form]);

  // Extract content separately to avoid re-rendering the entire form
  const content = form.watch("content");

  // Watch the selected category
  const selectedCategory = form.watch("category");

  // Simple strict comparison for school category
  const isSchoolCategory = selectedCategory === "school";

  // Only show edit button if user is creator or admin
  if (!isCreator && !isAdmin) {
    return null;
  }

  const handleDelete = useCallback(async () => {
    if (!postId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/forum/delete?postId=${postId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.isMainPost) {
          router.push("/home/forum");
        } else {
          router.refresh();
        }
      } else {
        throw new Error(result.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      setIsDeleting(false);
      setOpen(false);
    }
  }, [postId, router]);

  const handleUpdate = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      if (!postId) return;

      try {
        setIsSubmitting(true);

        const response = await fetch(`/api/v1/forum/edit?postId=${postId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          toast.success("Post succesvol bijgewerkt!");
          setOpen(false);
          router.refresh();
        } else {
          toast.error(result.error || "Er is een fout opgetreden");
        }
      } catch (error) {
        console.error("Error updating post:", error);
        toast.error("Er is een fout opgetreden bij het bewerken van je post.");
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
      fetchPost(); // Fetch post data when dialog opens
    },
    [fetchPost]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen) {
        fetchPost(); // Fetch post data when dialog opens
      }
    },
    [fetchPost]
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
            <DialogTitle>Bewerk post</DialogTitle>
            <DialogDescription>
              Bewerk je post. Markdown wordt ondersteund.
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
                {/* Title field */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xl">Titel:</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Titel van de post"
                          className="bg-neutral-800 border-neutral-700 h-10 text-xl text-center font-bold"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category field */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xl">Categorie:</FormLabel>
                      <FormControl>
                        <SelectCategoryCombobox
                          initialValue={field.value}
                          onSelect={(value) => {
                            field.onChange(value);
                          }}
                          isAdmin={isAdmin}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content field */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xl">Postinhoud:</FormLabel>
                      <Tabs
                        tabs={[
                          {
                            id: "write",
                            label: "Schrijven",
                            content: (
                              <div>
                                <FormControl>
                                  <Textarea
                                    placeholder="Inhoud van de post. Markdown wordt ondersteund."
                                    className="bg-neutral-800 border-neutral-700 h-40 text-xl p-3 resize-none"
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

                {/* Subject field (only for school category) */}
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center justify-between w-full">
                          <div className="w-60">
                            {isSchoolCategory ? (
                              <Combobox
                                placeholder="Selecteer een vak"
                                initialValue={field.value}
                                defaultValue={post?.subject || ""}
                                minWidth="100%"
                                onSelectAction={(value) => {
                                  field.onChange(value);
                                }}
                              />
                            ) : (
                              // When not school category, render empty div for spacing
                              <div></div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button1
                              text={
                                isSubmitting
                                  ? "Bezig met bijwerken..."
                                  : "Bijwerken"
                              }
                              onClick={handleFormSubmit}
                              disabled={isSubmitting || isDeleting}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(EditPostButton);
