"use client";
import { useState } from "react";
import ForumBtn from "./forumBtn";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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

import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/english.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';
import gs_img from '@/app/img/history.svg';
import bi_img from '@/app/img/bio.svg';

// Updated subject items with proper SVG icons
const subjectItems: ComboboxItem[] = [
  {
    value: "WI",
    label: (
      <div className="flex items-center">
        <Image src={math_img} alt="wiskunde" width={24} height={24} className="mr-2" />
        <span>Wiskunde</span>
      </div>
    ),
    searchText: "Wiskunde",
  },
  {
    value: "NSK",
    label: (
      <div className="flex items-center">
        <Image src={nsk_img} alt="nask" width={24} height={24} className="mr-2" />
        <span>NaSk</span>
      </div>
    ),
    searchText: "NaSk",
  },
  {
    value: "NE",
    label: (
      <div className="flex items-center">
        <Image src={nl_img} alt="nederlands" width={24} height={24} className="mr-2" />
        <span>Nederlands</span>
      </div>
    ),
    searchText: "Nederlands",
  },
  {
    value: "EN",
    label: (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <Image src={eng_img} alt="engels" width={24} height={24} className="mr-2" />
          <span>Engels</span>
        </div>
      </div>
    ),
    searchText: "Engels",
  },
  {
    value: "FR",
    label: (
      <div className="flex items-center">
        <Image src={fr_img} alt="frans" width={24} height={24} className="mr-2" />
        <span>Frans</span>
      </div>
    ),
    searchText: "Frans",
  },
  {
    value: "DE",
    label: (
      <div className="flex items-center">
        <Image src={de_img} alt="duits" width={24} height={24} className="mr-2" />
        <span>Duits</span>
      </div>
    ),
    searchText: "Duits",
  },
  {
    value: "AK",
    label: (
      <div className="flex items-center">
        <Image src={ak_img} alt="aardrijkskunde" width={24} height={24} className="mr-2" />
        <span>Aardrijkskunde</span>
      </div>
    ),
    searchText: "Aardrijkskunde",
  },
  {
    value: "GS",
    label: (
      <div className="flex items-center">
        <Image src={gs_img} alt="geschiedenis" width={24} height={24} className="mr-2" />
        <span>Geschiedenis</span>
      </div>
    ),
    searchText: "Geschiedenis",
  },
  {
    value: "BI",
    label: (
      <div className="flex items-center">
        <Image src={bi_img} alt="biologie" width={24} height={24} className="mr-2" />
        <span>Biologie</span>
      </div>
    ),
    searchText: "Biologie",
  },
];

export default function ForumDialog() {
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

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
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
      console.error("Error submitting post:", error);
      toast.error("Er is een fout opgetreden bij het plaatsen van je post.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <ForumBtn onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
      }}>
        <DialogContent className="z-[110]">
          <DialogHeader>
            <DialogTitle>Nieuwe forumpost</DialogTitle>
            <DialogDescription>
              Vul de details in om een nieuwe forumpost te maken.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xl">Postinhoud:</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Inhoud van de post"
                        className="bg-neutral-800 border-neutral-700 h-40 text-xl p-3 resize-none font-bold"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                          disabled={isSubmitting}
                          onClick={form.handleSubmit(onSubmit)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                {/* Button moved next to combobox */}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
