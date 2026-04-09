const BRIDGE_PARENT_ORIGIN_QUERY_PARAM = 'parentOrigin';

export const resolveExactOrigin = (value?: string | null, base?: string): string | null => {
  if (!value) return null;

  try {
    const origin = base ? new URL(value, base).origin : new URL(value).origin;
    return origin === 'null' ? null : origin;
  } catch {
    return null;
  }
};

export const appendParentOriginToIframeSrc = (src: string, parentHref?: string): string => {
  try {
    const url = parentHref ? new URL(src, parentHref) : new URL(src);
    const parentOrigin = resolveExactOrigin(parentHref);

    if (parentOrigin) {
      url.searchParams.set(BRIDGE_PARENT_ORIGIN_QUERY_PARAM, parentOrigin);
    }

    return url.toString();
  } catch {
    return src;
  }
};
