"use client";
import { useState, useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { formSchema } from "@/app/home/forum/formSchema";
import { useUserDataStore } from "@/store/user/UserDataProvider";
import { useStore } from "zustand";

export type ForumFormValues = z.infer<typeof formSchema>;

export function useForumCreation() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [banned, _setBanned] = useState(false);
    const [banreason, _setBanreason] = useState<string | null>(null);
    const [banEnd, _setBanEnd] = useState<Date | null>(null);
    const router = useRouter();

    // Get user data from Zustand store (SSR'd data)
    const store = useUserDataStore();
    const isAdmin = useStore(store, (state) => state.isAdmin);

    // Initialize form with react-hook-form and zod validation
    const form = useForm<ForumFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            content: "",
            subject: "",
            category: "",
        },
    });

    // Extract content separately to avoid re-rendering the entire form
    const content = form.watch("content");
    const selectedCategory = form.watch("category");

    // Clear subject if category is changed to non-school
    useEffect(() => {
        if (selectedCategory !== "school" && form.getValues("subject")) {
            form.setValue("subject", "");
        }
    }, [selectedCategory, form]);

    const handleOpenDialog = useCallback(() => {
        if (banned) {
            const banEndMsg = banEnd ? `Je bent verbannen van de forum tot ${new Date(banEnd).toLocaleDateString()}` : "Je bent permanent verbannen van de forum";
            toast.error(`${banEndMsg}, met de reden: ${banreason ?? "Geen reden opgegeven"}. Als je denkt dat dit een fout is, neem contact op met support@polarlearn.nl.`, {
                autoClose: 7000
            });
            return;
        }
        setDialogOpen(true);
    }, [banned, banEnd, banreason]);

    const handleOpenChange = useCallback((isOpen: boolean) => {
        setDialogOpen(isOpen);
        if (!isOpen) form.reset();
    }, [form]);

    // Form submission handler
    const onSubmit = useCallback(async (values: ForumFormValues) => {
        // Always clear subject if not school category
        if (values.category !== "school" && values.subject) {
            values.subject = "";
        }

        if (banned) {
            const banEndMsg = banEnd ? `Je bent verbannen tot ${new Date(banEnd).toLocaleDateString()}` : "Je bent permanent verbannen";
            toast.error(`${banEndMsg}. Met de reden: ${banreason ?? "Geen reden opgegeven"}. Als je denkt dat dit een fout is, neem contact op met support@polarlearn.nl.`);
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch("/api/v1/forum/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success("Post succesvol geplaatst!");
                // Navigate to the newly created forum post first
                router.push(`/home/forum/${result.postId}`);
                // Then close dialog and reset form
                setDialogOpen(false);
                form.reset();
            } else {
                toast.error(result.error || "Er is een fout opgetreden");
            }
        } catch (error) {
            console.error("Error creating post:", error);
            toast.error("Er is een fout opgetreden bij het plaatsen van je post.");
        } finally {
            setIsSubmitting(false);
        }
    }, [banned, banEnd, banreason, form, router]);

    return {
        dialogOpen,
        isSubmitting,
        isAdmin,
        banned,
        banreason,
        banEnd,
        form,
        content,
        selectedCategory,
        handleOpenDialog,
        handleOpenChange,
        onSubmit
    };
}
