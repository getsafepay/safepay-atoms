import { v4 as uuidv4 } from "uuid";

export function generateUUID(): string {
  return uuidv4();
}

export function isString(e: string): boolean {
  return (
    "string" == typeof e ||
    (!Array.isArray(e) &&
      isObject(e) &&
      "[object String]" === Object.prototype.toString.call(e))
  );
}

export function isObject(e): boolean {
  return e !== null && typeof e === "object";
}

export function decodeBase64(e: string): string {
  try {
    return atob(e.replace(/-/g, "+").replace(/_/g, "/"));
  } catch (e) {
    throw new Error("Failed to decode base64 string");
  }
}
