//@ts-ignore
import * as indexStyles from '../css/index.css';

function loadIndexStyles() {
  try {
    const o = document.createElement('style');
    o.textContent = indexStyles;
    o.className = 'safepay-atoms-index';
    window.atoms.styleChunks.index = o;
  } catch (o) {
    console.error(o, 'Unable to add index styles to the window using the corresponding js file');
  }
}

function loadIndexJsChunks() {
  try {
    window.atoms.jsChunkImports.index = ['CardAtom', 'PayerAuthentication'];
  } catch (o) {
    console.error(o, 'Unable to add index style imports to the window using the corresponding js file');
  }
}

export function loadIndexStylesAndJsChunks() {
  loadIndexStyles();
  loadIndexJsChunks();
}
