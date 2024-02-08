import { isObject } from "./isObject";

export function isString(e: string): boolean {
  return (
    "string" == typeof e ||
    (!Array.isArray(e) &&
      isObject(e) &&
      "[object String]" === Object.prototype.toString.call(e))
  );
}
