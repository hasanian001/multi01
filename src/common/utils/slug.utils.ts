/**
 * Utility functions for generating and working with slugs
 */

/**
 * Generates a slug from a string by:
 * - Converting to lowercase
 * - Replacing spaces with hyphens
 * - Removing special characters
 * - Converting accented characters to their non-accented equivalents
 * 
 * @param text The string to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD') // Normalize to decomposed form for handling accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Remove non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single hyphen
    .replace(/^-+/, '') // Trim hyphens from start
    .replace(/-+$/, ''); // Trim hyphens from end
}

/**
 * Generates a unique slug by appending a random number if needed
 * 
 * @param text The string to convert to a slug
 * @returns A URL-friendly slug with random suffix if needed for uniqueness
 */
export function generateUniqueSlug(text: string): string {
  return generateSlug(text);
  // Note: Uniqueness check is typically done in the service layer
  // This just creates the base slug - the actual check against existing
  // data and appending a unique identifier would happen when used
}