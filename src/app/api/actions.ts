import { prisma } from './utils/prisma';

export const getWordPairs = async (listId: string) => {
  try {
    const practice = await prisma.practice.findFirst({
      where: {
        list_id: listId
      }
    });

    return practice?.words || [];  
  } catch (error) {
    console.error('Error fetching word pairs:', error);
    return [];
  }
};

export const saveTestResults = async (
  correctAnswers: number,
  incorrectAnswers: number,
  listId: string
) => {
  try {
    const result = await prisma.testResult.create({
      data: {
        listId,
        correctAnswers,
        incorrectAnswers
      }
    });
    return result;
  } catch (error) {
    console.error('Error saving test result:', error);
    return null;
  }
};
