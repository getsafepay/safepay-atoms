import { nanoid } from 'nanoid/non-secure';

export function generateUUID(): string {
  return nanoid();
}
