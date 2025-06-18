"use client";
import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Combobox } from "./selectSubjCombobox";
import Button1 from "@/components/button/Button1";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formSchema } from "./formSchema";
import { createPostServer } from "./createPostServer";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import Tabs, { TabItem } from "@/components/Tabs";
import { SelectCategoryCombobox } from "./selectCategoryCombobox";
import { getUserFromSession } from "@/utils/auth/auth";

// Memoized markdown preview component
const MarkdownPreview = memo(({ content }: { content: string }) => (
  <div className="bg-neutral-800 border border-neutral-700 h-40 overflow-y-auto p-3 rounded-md prose prose-invert max-w-none whitespace-pre-line">
    {content ? (
      <ReactMarkdown components={{
        h1: ({ node, ...props }) => <h1 className="text-4xl font-bold my-4" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-3xl font-bold my-3" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-2xl font-semibold my-2" {...props} />,
        img: ({ src, alt, ...props }) => (
          <img
            src={src}
            alt={alt || ""}
            style={{ maxWidth: "100%", maxHeight: "400px", height: "auto" }}
            {...props}
          />
        ),
      }}>
        {content}
      </ReactMarkdown>
    ) : (
      <p className="text-gray-400">Voorbeeldweergave verschijnt hier...</p>
    )}
  </div>
));

// Memoized title field component
const TitleField = memo(({ control }: { control: any }) => {
  return (
    <FormField
      control={control}
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
  );
});

// Memoized content field component
const ContentField = memo(({ control, content }: { control: any; content: string }) => {
  return (
    <FormField
      control={control}
      name="content"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xl">Postinhoud:</FormLabel>
          <Tabs tabs={[
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
                    <p>**vetgedrukt**, *schuingedrukt*, [link](https://url.com)</p>
                    <p># Grote kop, ## Kleinere kop, ### Nog kleinere kop</p>
                  </div>
                </div>
              ),
            },
            {
              id: "preview",
              label: "Voorbeeld",
              content: <MarkdownPreview content={content} />,
            },
          ]} defaultActiveTab="write" />
          <FormMessage />
        </FormItem>
      )}
    />
  );
});

// Memoized subject field component
const SubjectField = memo(({
  control,
  isSubmitting,
  banned,
  onSubmit,
  category,
  form
}: {
  control: any;
  isSubmitting: boolean;
  banned: boolean;
  onSubmit: () => void;
  category: string;
  form: any;
}) => {
  // Use exact string comparison - category might sometimes be undefined
  const isSchoolCategory = category === "school";

  // Auto-clear subject field when changing away from school category
  useEffect(() => {
    if (!isSchoolCategory && form) {
      form.setValue("subject", "");
    }
  }, [isSchoolCategory, form]);

  return (
    <FormField
      control={control}
      name="subject"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div className="flex items-center justify-between w-full">
              <div className="w-60">
                {isSchoolCategory ? (
                  <Combobox
                    placeholder="Selecteer een vak"
                    minWidth="100%"
                    initialValue={field.value}
                    onSelectAction={(value) => {
                      field.onChange(value);
                    }}
                  />
                ) : null}
              </div>
              <Button1
                text={isSubmitting ? 'Bezig met plaatsen...' : 'Post aanmaken'}
                disabled={isSubmitting || banned}
                onClick={onSubmit}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
});

// Memoized category field component
const CategoryField = memo(({ control, isAdmin }: { control: any; isAdmin: boolean }) => {
  return (
    <FormField
      control={control}
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
  );
});

// ForumDialog component with memoization
function ForumDialog({ banned, banreason, banEnd }: { banned: boolean; banreason: string | null | undefined; banEnd: Date | null | undefined }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      subject: "",
      category: "",
    },
  });

  // Fetch user session and check if admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = await getUserFromSession();
        setIsAdmin(user?.role === "admin");
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  // Extract content separately to avoid re-rendering the entire form
  const content = form.watch("content");

  // Watch the selected category and log it for debugging
  const selectedCategory = form.watch("category");

  // Clear subject if category is changed to non-school
  useEffect(() => {
    if (selectedCategory !== "school" && form.getValues("subject")) {
      form.setValue("subject", "");
    }
  }, [selectedCategory, form]);

  // Form submission handler - use useCallback to prevent recreation on render
  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    // Always clear subject if not school category
    if (values.category !== "school" && values.subject) {
      values.subject = "";
    }
    if (banned) {
      const banEndMsg = banEnd ? `Je bent verbannen tot ${new Date(banEnd).toLocaleDateString()}` : "Je bent permanent verbannen";
      toast.error(`${banEndMsg}. Met de reden: ${banreason ?? "Geen reden opgegeven"}. Als je denkt dat dit een fout is, join de discord. Die kan je vinden in de forum.`);
      return;
    }
    try {
      setIsSubmitting(true);
      const result = await createPostServer(values);

      if (result.success) {
        toast.success("Post succesvol geplaatst!");
        // Navigate to the newly created forum post first
        router.push(`/home/forum/${result.postId}`);
        // Then close dialog and reset form
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Er is een fout opgetreden bij het plaatsen van je post.");
    } finally {
      setIsSubmitting(false);
    }
  }, [banned, banEnd, banreason, form, router]);

  // Memoize handleOpenChange to prevent recreation on render
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) form.reset();
  }, [form]);

  // Memoize the onClick handler for the forum button
  const handleForumBtnClick = useCallback(() => {
    if (banned) {
      const banEndMsg = banEnd ? `Je bent verbannen van de forum tot ${new Date(banEnd).toLocaleDateString()}` : "Je bent permanent verbannen van de forum";
      toast.error(`${banEndMsg}, met de reden: ${banreason ?? "Geen reden opgegeven"}. Als je denkt dat dit een fout is, join de discord. Die kan je vinden in de forum.`, {
        autoClose: 7000
      });
      return;
    }
    setOpen(true);
  }, [banned, banEnd, banreason]);

  // Memoize form submission handler
  const handleFormSubmit = useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  return (
    <>
      <Button1
        text="Nieuwe forumpost"
        onClick={handleForumBtnClick}
      />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="z-[110] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nieuwe forumpost</DialogTitle>
            <DialogDescription>
              Vul de details in om een nieuwe forumpost te maken. Markdown wordt ondersteund.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }} className="space-y-6">
              <TitleField control={form.control} />
              <CategoryField control={form.control} isAdmin={isAdmin} />
              <ContentField control={form.control} content={content} />
              <SubjectField
                control={form.control}
                isSubmitting={isSubmitting}
                banned={banned}
                onSubmit={handleFormSubmit}
                category={selectedCategory} // Make sure this is passed correctly
                form={form}
              />
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(ForumDialog);
