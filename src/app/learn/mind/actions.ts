import { prisma } from "@/utils/prisma";

// Functie om resultaten van een oefensessie op te slaan
export const saveResults = async (listId: string, userId: string, score: number) => {
    try {
        // Hier kan een record voor de resultaten worden aangemaakt
        await prisma.results.create({
            data: {
                listId: listId,
                userId: userId,
                score: score,
                createdAt: new Date(),
            }
        });

        return { success: true, message: "Resultaten opgeslagen!" };
    } catch (error) {
        console.error("Fout bij het opslaan van resultaten:", error);
        return { success: false, message: "Er is een fout opgetreden bij het opslaan van de resultaten." };
    }
};

// Functie om de resultaten voor een specifieke lijst en gebruiker op te halen
export const getResults = async (listId: string, userId: string) => {
    try {
        // Ophalen van resultaten uit de database voor een specifieke gebruiker en lijst
        const results = await prisma.results.findMany({
            where: {
                listId: listId,
                userId: userId,
            }
        });
        return results;
    } catch (error) {
        console.error("Fout bij het ophalen van resultaten:", error);
        return [];
    }
};

// Functie om de voortgang van een gebruiker bij te houden
export const saveProgress = async (listId: string, userId: string, progress: number) => {
    try {
        // Opslaan of bijwerken van de voortgang van de gebruiker
        await prisma.progress.update({
            where: {
                listId_userId: {
                    listId: listId,
                    userId: userId,
                }
            },
            data: {
                progress: progress,
                updatedAt: new Date(),
            }
        });
        return { success: true, message: "Voortgang bijgewerkt!" };
    } catch (error) {
        console.error("Fout bij het bijwerken van voortgang:", error);
        return { success: false, message: "Er is een fout opgetreden bij het bijwerken van de voortgang." };
    }
};
