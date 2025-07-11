// Utility functions for the learning tool
export function verwijderSpecialeTekens(tekst: string): string {
  return tekst
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .toLowerCase();
}

// Types for the learning tool
export interface LearningData {
  "1": string;
  "2": string;
  id: number;
}

export type LearningMode = "leren" | "testen" | "hints" | "gedachten";

export interface LearningProgress {
  correct: number;
  total: number;
  currentIndex: number;
}

export interface LearningState {
  showingAnswer: boolean;
  isCorrect: boolean;
  currentQuestion: string;
  userAnswer: string;
  correctAnswer: string;
}
