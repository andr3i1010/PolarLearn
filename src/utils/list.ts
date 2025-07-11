/**
 * Get the word count for a list
 * @param data The list data
 * @returns The number of words in the list
 */
export function getWordCount(data: any): number {
  return Array.isArray(data) ? data.length : 0;
}

/**
 * Format word count for display
 * @param data The list data
 * @returns Formatted word count string (e.g., "1 woord" or "5 woorden")
 */
export function formatWordCount(data: any): string {
  const count = getWordCount(data);
  return count === 1 ? "1 woord" : `${count} woorden`;
}

/**
 * Safely ensure data is an array
 * @param data The data to check
 * @returns An array or empty array if data is not an array
 */
export function ensureArray<T>(data: any): T[] {
  return Array.isArray(data) ? data : [];
}
