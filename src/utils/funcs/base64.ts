/**
 * Decodes a Base64-encoded string, with URL and filename safe alphabet support.
 * This function modifies the input string to replace URL-safe characters ('-' and '_')
 * with their Base64 equivalents ('+' and '/') before decoding. It provides a safe way
 * to handle Base64 data coming from URLs or file systems which may use the URL-safe alphabet.
 *
 * @param {string} e - The Base64-encoded string to decode. This string may use the standard
 * Base64 alphabet or the URL and filename safe Base64 alphabet.
 * @returns {string} - The decoded string.
 * @throws {Error} - Throws an error if the string cannot be decoded, indicating a possible
 * corruption or modification of the encoded data.
 *
 * @example
 * // Decoding a standard Base64 string
 * const decoded = decodeBase64("SGVsbG8gV29ybGQ=");
 * console.log(decoded); // "Hello World"
 *
 * // Decoding a URL-safe Base64 string
 * const urlSafeDecoded = decodeBase64("SGVsbG8tV29ybGQ=");
 * console.log(urlSafeDecoded); // Decodes a string that used '-' instead of '+' and '_' instead of '/'
 */
export function decodeBase64(e: string): string {
  try {
    return atob(e.replace(/-/g, '+').replace(/_/g, '/'));
  } catch (e) {
    throw new Error('Failed to decode base64 string');
  }
}
