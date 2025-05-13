//@ts-ignore
import * as cardLinkStyles from '../css/card-link.css';

function loadCardLinkStyles() {
  try {
    const o = document.createElement('style');
    o.textContent = cardLinkStyles;
    o.className = 'safepay-atoms-CardAtom';
    window.atoms.styleChunks.CardAtom = o;
  } catch (o) {
    console.error(o, 'Unable to add CardAtom styles to the window using the corresponding js file');
  }
}

function loadCardLinkJsChunks() {
  try {
    window.atoms.jsChunkImports.CardAtom = ['index', 'SeamlessIframe'];
  } catch (o) {
    console.error(o, 'Unable to add CardAtom style imports to the window using the corresponding js file');
  }
}

export function loadCardLinkStylesAndJsChunks() {
  loadCardLinkStyles();
  loadCardLinkJsChunks();
}
