"use client";
import { useState, useCallback } from "react";
import PlusBtn from "@/components/button/plus";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation"; // Import useRouter instead of redirect
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
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
import Button1 from "@/components/button/Button1";
import { createGroupAction } from "./createGroupServer";
import { Switch } from "@/components/ui/switch";

// Define form validation schema with Zod
const groupFormSchema = z.object({
    name: z
        .string()
        .min(3, "Groepsnaam moet minimaal 3 karakters bevatten")
        .max(30, "Groepsnaam mag maximaal 30 karakters bevatten"),
    description: z
        .string()
        .max(500, "Beschrijving mag maximaal 500 karakters bevatten")
        .optional()
        .or(z.literal(''))
        .transform(val => val === '' ? undefined : val),
    isPublic: z.boolean().default(true),
    canEveryoneAddLists: z.boolean().default(false),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

export function CreateGroupButton() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter(); // Use the router hook

    const form = useForm<GroupFormValues>({
        resolver: zodResolver(groupFormSchema),
        defaultValues: {
            name: "",
            description: "",
            isPublic: true,
            canEveryoneAddLists: false,
        },
    });

    const handleClick = () => {
        setDialogOpen(true);
    };

    const handleOpenChange = useCallback((isOpen: boolean) => {
        setDialogOpen(isOpen);
        if (!isOpen) {
            form.reset();
        }
    }, [form]);

    const onSubmit = useCallback(async (values: GroupFormValues) => {
        setIsSubmitting(true);
        try {
            // Call the server action with all required parameters
            const result = await createGroupAction({
                name: values.name,
                description: values.description,
                everyoneCanAddLists: values.canEveryoneAddLists,
                isPublic: values.isPublic
            });

            if (result.success && result.groupId) {
                setDialogOpen(false); // Close the dialog first
                form.reset(); // Reset the form
                toast.success("Groep succesvol aangemaakt!");
                // Navigate to the new group page
                router.push(`/learn/group/${result.groupId}`);
            } else {
                toast.error(result.error || "Er is een fout opgetreden bij het aanmaken van de groep.");
            }
        } catch (error) {
            console.error("Error creating group:", error);
            toast.error("Er is een fout opgetreden bij het aanmaken van de groep.");
        } finally {
            setIsSubmitting(false);
        }
    }, [form, router]);

    return (
        <>
            <div className="bg-neutral-700 rounded-full hover:bg-neutral-600 transition-all">
                <PlusBtn action={handleClick} />
            </div>

            <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="z-[110] sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>Nieuwe groep aanmaken</DialogTitle>
                        <DialogDescription>
                            Maak een nieuwe groep aan om samen met anderen te leren.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xl">Groepsnaam:</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Naam van je groep"
                                                className="bg-neutral-800 border-neutral-700 h-10 text-lg"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xl">
                                            Beschrijving: <span className="text-sm text-gray-400">(optioneel)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Beschrijf waar je groep over gaat... (optioneel)"
                                                className="bg-neutral-800 border-neutral-700 h-32 text-lg p-3 resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isPublic"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-neutral-800 border-neutral-700 mb-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-xl">
                                                Openbare groep
                                            </FormLabel>
                                            <span className="block text-sm text-gray-400">
                                                {field.value
                                                    ? "Iedereen kan direct lid worden."
                                                    : "Leden moeten goedgekeurd worden."}
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="canEveryoneAddLists"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-neutral-800 border-neutral-700">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-xl">
                                                Lijsten toevoegen
                                            </FormLabel>
                                            <span className="block text-sm text-gray-400">
                                                {field.value
                                                    ? "Alle leden kunnen lijsten toevoegen."
                                                    : "Alleen beheerders kunnen lijsten toevoegen."}
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end flex-row">
                                <Button1
                                    type="submit"
                                    text={isSubmitting ? "Bezig met aanmaken..." : "Groep aanmaken"}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
