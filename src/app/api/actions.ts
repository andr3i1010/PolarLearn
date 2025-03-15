"use server";

import { prisma } from "@/utils/prisma";

export async function getWordPairs(list_id: string) {
  try {
    if (!list_id) {
      throw new Error("Invalid list_id");
    }

    const wordPairs = await prisma.practice.findMany({
      where: { list_id },
    });

    return wordPairs;
  } catch (error) {
    console.error("Fout bij ophalen woordenlijst:", error);
    return [];
  }
}

export async function saveTestResults(correct: number, incorrect: number, list_id: string) {
  try {
    if (!list_id) {
      throw new Error("Invalid list_id");
    }

    await prisma.testResults.create({
      data: {
        list_id,
        correct,
        incorrect,
      },
    });
  } catch (error) {
    console.error("Fout bij opslaan resultaten:", error);
  }
}
