import { z } from "zod";

// Define the form schema for validation that can be used on the client side
export const formSchema = z.object({
    title: z.string().min(1, "Titel is verplicht").max(100, "Titel mag maximaal 100 tekens bevatten"),
    content: z.string().min(1, "Postinhoud is verplicht").max(5000, "Inhoud mag maximaal 5000 tekens bevatten"),
    category: z.string().min(1, "Selecteer een categorie"),
    subject: z.string(),
}).refine(
    (data) => {
        // Only require subject selection when category is school
        if (data.category !== "school") {
            return true;
        }

        // For school category, subject is required
        return data.subject.length > 0;
    },
    {
        message: "Selecteer een vak",
        path: ["subject"], // Path tells Zod which field caused the error
    }
);
