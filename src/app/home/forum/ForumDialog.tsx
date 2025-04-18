"use client";
import { useState, useCallback, useMemo, memo } from "react";
import ForumBtn from "./forumBtn";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Combobox, ComboboxItem } from "./selectSubjCombobox";
import Button1 from "@/components/button/Button1";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formSchema } from "./formSchema";
import { createPostServer } from "./createPostServer";
import { toast } from "react-toastify";
import ReactMarkdown from 'react-markdown';
import Tabs, { TabItem } from "@/components/Tabs";

// Import subject icons
import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/english.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';
import gs_img from '@/app/img/history.svg';
import bi_img from '@/app/img/bio.svg';

// Memoize the subject item labels to prevent re-renders
const SubjectLabel = memo(({ icon, alt, label }: { icon: any; alt: string; label: string }) => (
  <div className="flex items-center">
    <Image src={icon} alt={alt} width={24} height={24} className="mr-2" />
    <span>{label}</span>
  </div>
));

// Updated subject items with proper SVG icons and memoized labels
const subjectItems: ComboboxItem[] = [
  {
    value: "WI",
    label: <SubjectLabel icon={math_img} alt="wiskunde" label="Wiskunde" />,
    searchText: "Wiskunde",
  },
  {
    value: "NSK",
    label: <SubjectLabel icon={nsk_img} alt="nask" label="NaSk" />,
    searchText: "NaSk",
  },
  {
    value: "NE",
    label: <SubjectLabel icon={nl_img} alt="nederlands" label="Nederlands" />,
    searchText: "Nederlands",
  },
  {
    value: "EN",
    label: <SubjectLabel icon={eng_img} alt="engels" label="Engels" />,
    searchText: "Engels",
  },
  {
    value: "FR",
    label: <SubjectLabel icon={fr_img} alt="frans" label="Frans" />,
    searchText: "Frans",
  },
  {
    value: "DE",
    label: <SubjectLabel icon={de_img} alt="duits" label="Duits" />,
    searchText: "Duits",
  },
  {
    value: "AK",
    label: <SubjectLabel icon={ak_img} alt="aardrijkskunde" label="Aardrijkskunde" />,
    searchText: "Aardrijkskunde",
  },
  {
    value: "GS",
    label: <SubjectLabel icon={gs_img} alt="geschiedenis" label="Geschiedenis" />,
    searchText: "Geschiedenis",
  },
  {
    value: "BI",
    label: <SubjectLabel icon={bi_img} alt="biologie" label="Biologie" />,
    searchText: "Biologie",
  },
];

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
  onSubmit
}: {
  control: any;
  isSubmitting: boolean;
  banned: boolean;
  onSubmit: () => void;
}) => {
  return (
    <FormField
      control={control}
      name="subject"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div className="flex items-center justify-between w-full">
              <div className="w-60">
                <Combobox
                  items={subjectItems}
                  placeholder="Selecteer een vak"
                  minWidth="100%"
                  onSelect={(value) => {
                    field.onChange(value);
                  }}
                />
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

// ForumDialog component with memoization
function ForumDialog({ banned, banreason, banEnd }: { banned: boolean; banreason: string | null | undefined; banEnd: Date | null | undefined }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      subject: "",
    },
  });

  // Extract content separately to avoid re-rendering the entire form
  const content = form.watch("content");

  // Form submission handler - use useCallback to prevent recreation on render
  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
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
  }, [banned, banEnd, banreason, form]);

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
      <ForumBtn onClick={handleForumBtnClick} />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="z-[110] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nieuwe forumpost</DialogTitle>
            <DialogDescription>
              Vul de details in om een nieuwe forumpost te maken. Markdown wordt ondersteund.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TitleField control={form.control} />
              <ContentField control={form.control} content={content} />
              <SubjectField
                control={form.control}
                isSubmitting={isSubmitting}
                banned={banned}
                onSubmit={handleFormSubmit}
              />
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(ForumDialog);
