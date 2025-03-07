import { useEffect, useRef } from 'react';

type ChunkName = string; // Replace this with the actual type of your chunk names if they are not just strings.

/**
 * A custom React hook that appends CSS style chunks to the DOM. This hook is designed to work with a dynamic
 * styling system where CSS chunks are associated with JavaScript chunks (for code-splitting purposes) and can be
 * applied either to the document's head or to a Shadow DOM root, depending on the context in which the component
 * is used. This is particularly useful for encapsulating styles in web components or when isolating styles is desired.
 *
 * @param {ChunkName} chunkName - The name of the chunk whose styles should be appended. This name corresponds to the chunk's identifier in the build system.
 * @param {boolean} isShadow - A boolean indicating whether the styles should be appended to a Shadow DOM root (`true`) or the document's head (`false`).
 *
 * @returns {React.MutableRefObject<HTMLDivElement | null>} A ref object pointing to the root element to which styles are appended. This can be used to programmatically access the styled element.
 *
 * @example
 * const cssRootRef = useAppendStyles('MyComponent', false);
 *
 * // In this example, `MyComponent`'s related CSS chunks will be appended to the document's head.
 * // `cssRootRef` can be used to reference the styled root element, though in this case, it will remain null
 * // since styles are added to the document's head, not a specific encapsulating element.
 */
export const useAppendStyles = (chunkName: ChunkName, isShadow: boolean) => {
  const cssRootRef = useRef<HTMLDivElement | null>(null);

  /**
   * Clones the style element associated with a given chunk name.
   * @param {ChunkName} name - The name of the chunk.
   * @returns {HTMLStyleElement | null} The cloned style element if found, or null otherwise.
   */
  const cloneStyleChunk = (name: ChunkName): HTMLStyleElement | null => {
    const styleChunk = window.drops?.styleChunks?.[name];
    return styleChunk ? (styleChunk.cloneNode(true) as HTMLStyleElement) : null;
  };

  useEffect(() => {
    /**
     * Determines and attaches the relevant style chunks either to the Shadow DOM or the document's head,
     * based on the `isShadow` parameter.
     */
    const chunkNames = getRelatedStyleChunks(chunkName);
    if (isShadow) {
      attachStylesToShadowRoot(chunkNames);
    } else {
      attachStylesToHead(chunkNames);
    }
  }, [chunkName, isShadow]);

  /**
   * Retrieves the names of all style chunks related to a given chunk name, including the chunk itself and any
   * chunks it imports.
   * @param {ChunkName} name - The name of the chunk.
   * @returns {ChunkName[]} An array of related chunk names.
   */
  const getRelatedStyleChunks = (name: ChunkName): ChunkName[] => {
    const chunks = [...(window.drops?.jsChunkImports?.[name] || []), name].filter(
      (chunk) => !!window.drops?.styleChunks?.[chunk]
    );

    if (chunks.length === 0) {
      console.error(
        `Failed to find any related style chunks for ${name}. Make sure that ${name} is a valid chunk name and dist/DropsChunk.${name}.hash.js exists.`
      );
    }

    return chunks;
  };

  /**
   * Attaches style elements to the shadow DOM. This function is used when `isShadow` is true,
   * indicating that styles should be isolated within a shadow root.
   *
   * @param {ChunkName[]} chunkNames - An array of chunk names whose styles are to be appended to the shadow root.
   */
  const attachStylesToShadowRoot = (chunkNames: ChunkName[]) => {
    const shadowRoot = cssRootRef.current?.getRootNode();
    if (shadowRoot instanceof ShadowRoot) {
      chunkNames.reverse();
      chunkNames.forEach((name) => {
        const styleElement = cloneStyleChunk(name);
        if (styleElement && !shadowRoot.querySelector(`.${styleElement.className}`)) {
          shadowRoot.prepend(styleElement);
          appendRootStyles(styleElement);
        }
      });
    } else {
      console.error(
        'Failed to attach styles to Shadow Root. Make sure that isShadow is set correctly and cssRootRef is assigned to an element within the Shadow DOM.'
      );
    }
  };

  /**
   * Attaches style elements to the document's head. This function is used when `isShadow` is false,
   * indicating that styles should be globally available across the document.
   *
   * @param {ChunkName[]} chunkNames - An array of chunk names whose styles are to be appended to the document's head.
   */
  const attachStylesToHead = (chunkNames: ChunkName[]) => {
    chunkNames.forEach((name) => {
      const styleElement = cloneStyleChunk(name);
      if (styleElement && !document.head.querySelector(`.${styleElement.className}`)) {
        document.head.append(styleElement);
      }
    });
  };

  /**
   * Appends :root CSS styles found within a style element to the document's head. This is particularly useful for defining global CSS variables.
   *
   * @param {HTMLStyleElement} styleElement - The style element containing :root styles to be appended.
   */
  const appendRootStyles = (styleElement: HTMLStyleElement) => {
    if (document.head.querySelector(`.${styleElement.className}-root`)) return;
    const rootStyles = styleElement.innerText.match(/:root{(.|\n)+?}/g);
    if (!rootStyles) return;
    const rootCss = rootStyles.join('\n');
    const rootStyleElement = document.createElement('style');
    rootStyleElement.innerText = rootCss;
    rootStyleElement.className = `${styleElement.className}-root`;
    document.head.append(rootStyleElement);
  };

  return cssRootRef;
};
