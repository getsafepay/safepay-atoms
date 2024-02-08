//@ts-ignore
import * as cardLinkStyles from "bundle-text:../css/card-link.css";

function loadCardLinkStyles() {
  try {
    const o = document.createElement("style");
    o.textContent = cardLinkStyles;
    o.className = "safepay-drops-CardLink";
    window.drops.styleChunks.CardLink = o;
  } catch (o) {
    console.error(
      o,
      "Unable to add CardLink styles to the window using the corresponding js file"
    );
  }
}

function loadCardLinkJsChunks() {
  try {
    window.drops.jsChunkImports.CardLink = ["index", "SeamlessIframe"];
  } catch (o) {
    console.error(
      o,
      "Unable to add CardLink style imports to the window using the corresponding js file"
    );
  }
}

export function loadCardLinkStylesAndJsChunks() {
  loadCardLinkStyles();
  loadCardLinkJsChunks();
}
