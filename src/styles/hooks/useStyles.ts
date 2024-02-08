import { useEffect, useRef } from "react";

type ChunkName = string; // Replace this with the actual type of your chunk names if they are not just strings.

export const useAppendStyles = (chunkName: ChunkName, isShadow: boolean) => {
  const cssRootRef = useRef<HTMLDivElement | null>(null);

  const cloneStyleChunk = (name: ChunkName): HTMLStyleElement | null => {
    const styleChunk = window.drops?.styleChunks?.[name];
    return styleChunk ? (styleChunk.cloneNode(true) as HTMLStyleElement) : null;
  };

  useEffect(() => {
    const chunkNames = getRelatedStyleChunks(chunkName);
    if (isShadow) {
      attachStylesToShadowRoot(chunkNames);
    } else {
      attachStylesToHead(chunkNames);
    }
  }, [chunkName, isShadow]);

  const getRelatedStyleChunks = (name: ChunkName): ChunkName[] => {
    const chunks = [
      ...(window.drops?.jsChunkImports?.[name] || []),
      name,
    ].filter((chunk) => !!window.drops?.styleChunks?.[chunk]);

    if (chunks.length === 0) {
      console.error(
        `Failed to find any related style chunks for ${name}. Make sure that ${name} is a valid chunk name and dist/DropsChunk.${name}.hash.js exists.`
      );
    }

    return chunks;
  };

  const attachStylesToShadowRoot = (chunkNames: ChunkName[]) => {
    const shadowRoot = cssRootRef.current?.getRootNode();
    if (shadowRoot instanceof ShadowRoot) {
      chunkNames.reverse();
      chunkNames.forEach((name) => {
        const styleElement = cloneStyleChunk(name);
        if (
          styleElement &&
          !shadowRoot.querySelector(`.${styleElement.className}`)
        ) {
          shadowRoot.prepend(styleElement);
          appendRootStyles(styleElement);
        }
      });
    } else {
      console.error(
        "Failed to attach styles to Shadow Root. Make sure that isShadow is set correctly and cssRootRef is assigned to an element within the Shadow DOM."
      );
    }
  };

  const attachStylesToHead = (chunkNames: ChunkName[]) => {
    chunkNames.forEach((name) => {
      const styleElement = cloneStyleChunk(name);
      if (
        styleElement &&
        !document.head.querySelector(`.${styleElement.className}`)
      ) {
        document.head.append(styleElement);
      }
    });
  };

  const appendRootStyles = (styleElement: HTMLStyleElement) => {
    if (document.head.querySelector(`.${styleElement.className}-root`)) return;
    const rootStyles = styleElement.innerText.match(/:root{(.|\n)+?}/g);
    if (!rootStyles) return;
    const rootCss = rootStyles.join("\n");
    const rootStyleElement = document.createElement("style");
    rootStyleElement.innerText = rootCss;
    rootStyleElement.className = `${styleElement.className}-root`;
    document.head.append(rootStyleElement);
  };

  return cssRootRef;
};
