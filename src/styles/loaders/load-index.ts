//@ts-ignore
import * as indexStyles from "bundle-text:../css/index.css";

function loadIndexStyles() {
  try {
    const o = document.createElement("style");
    o.textContent = indexStyles;
    o.className = "safepay-drops-index";
    window.drops.styleChunks.index = o;
  } catch (o) {
    console.error(
      o,
      "Unable to add index styles to the window using the corresponding js file"
    );
  }
}

function loadIndexJsChunks() {
  try {
    window.drops.jsChunkImports.index = ["CardLink"];
  } catch (o) {
    console.error(
      o,
      "Unable to add index style imports to the window using the corresponding js file"
    );
  }
}

export function loadIndexStylesAndJsChunks() {
  loadIndexStyles();
  loadIndexJsChunks();
}
