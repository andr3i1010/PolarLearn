// UUID validation regex pattern
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper function to check if a string is a valid UUID
export function isUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

// Helper function to check if a string is a username (not a UUID)
export function isUsername(str: string): boolean {
  return !UUID_REGEX.test(str);
}
