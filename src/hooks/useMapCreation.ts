"use client";
import { useState, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createMapAction } from "@/serverActions/mapActions";

// Define form validation schema with Zod
const mapFormSchema = z.object({
  name: z
    .string()
    .min(1, "Mapnaam is verplicht")
    .max(50, "Mapnaam mag maximaal 50 karakters bevatten"),
  isPublic: z.boolean(),
}).required({
  isPublic: true,
});

export type MapFormValues = z.infer<typeof mapFormSchema>;

export function useMapCreation() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<MapFormValues>({
    resolver: zodResolver(mapFormSchema),
    defaultValues: {
      name: "",
      isPublic: false,
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

  const onSubmit = useCallback(async (values: MapFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createMapAction({
        name: values.name,
        isPublic: values.isPublic
      });

      if (result.success && result.mapId) {
        setDialogOpen(false);
        form.reset();
        toast.success("Map succesvol aangemaakt!");
        router.push(`/learn/map/${result.mapId}`);
      } else {
        toast.error(result.error || "Er is een fout opgetreden bij het aanmaken van de map.");
      }
    } catch (error) {
      console.error("Error creating map:", error);
      toast.error("Er is een fout opgetreden bij het aanmaken van de map.");
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
