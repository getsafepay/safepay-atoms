export function decodeBase64(e: string): string {
  try {
    return atob(e.replace(/-/g, "+").replace(/_/g, "/"));
  } catch (e) {
    throw new Error("Failed to decode base64 string");
  }
}
