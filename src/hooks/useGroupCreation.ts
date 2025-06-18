"use client";
import { useState, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createGroupAction } from "@/app/learn/groups/createGroupServer";

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
    isPublic: z.boolean(),
    canEveryoneAddLists: z.boolean(),
}).required({
    isPublic: true,
    canEveryoneAddLists: true
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;

export function useGroupCreation() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<GroupFormValues>({
        resolver: zodResolver(groupFormSchema),
        defaultValues: {
            name: "",
            description: "",
            isPublic: true,
            canEveryoneAddLists: false,
        },
    });

    const handleOpenDialog = useCallback(() => {
        setDialogOpen(true);
    }, []);

    const handleOpenChange = useCallback((isOpen: boolean) => {
        setDialogOpen(isOpen);
        if (!isOpen) {
            form.reset();
        }
    }, [form]);

    const onSubmit = useCallback(async (values: GroupFormValues) => {
        setIsSubmitting(true);
        try {
            const result = await createGroupAction({
                name: values.name,
                description: values.description,
                everyoneCanAddLists: values.canEveryoneAddLists,
                isPublic: values.isPublic
            });

            if (result.success && result.groupId) {
                setDialogOpen(false);
                form.reset();
                toast.success("Groep succesvol aangemaakt!");
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

    return {
        dialogOpen,
        isSubmitting,
        form,
        handleOpenDialog,
        handleOpenChange,
        onSubmit
    };
}
