export const toCamelCase = (str: string): string => str.replace(/-./g, (match: string) => match[1].toUpperCase());
