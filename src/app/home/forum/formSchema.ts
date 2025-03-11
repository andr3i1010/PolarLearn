import { z } from "zod";

// Define the form schema for validation that can be used on the client side
export const formSchema = z.object({
    title: z.string().min(1, "Titel is verplicht").max(100, "Titel mag maximaal 100 tekens bevatten"),
    content: z.string().min(1, "Postinhoud is verplicht").max(5000, "Inhoud mag maximaal 5000 tekens bevatten"),
    subject: z.string().min(1, "Selecteer een vak"),
});
