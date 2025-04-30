/**
 * Generates a unique order number.
 * 
 * The order number is a combination of:
 * - Current timestamp in milliseconds
 * - Random 4-digit number
 * - First 4 characters are the year
 * 
 * Example: 2024-1234567890-1234
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  const year = new Date().getFullYear();
  
  return `${year}-${timestamp}-${randomNum}`;
}