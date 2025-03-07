//@ts-ignore
import * as seamlessIframStyles from 'bundle-text:../css/seamless-iframe.css';

function loadSeamlessIframeStyles() {
  try {
    const o = document.createElement('style');
    o.textContent = seamlessIframStyles;
    o.className = 'safepay-drops-SeamlessIframe';
    window.drops.styleChunks.SeamlessIframe = o;
  } catch (o) {
    console.error(o, 'Unable to add SeamlessIframe styles to the window using the corresponding js file');
  }
}

function loadSeamlessIframeJsChunks() {
  try {
    window.drops.jsChunkImports.SeamlessIframe = ['index'];
  } catch (o) {
    console.error(o, 'Unable to add SeamlessIframe style imports to the window using the corresponding js file');
  }
}

export function loadSeamlessIframeStylesAndJsChunks() {
  loadSeamlessIframeStyles();
  loadSeamlessIframeJsChunks();
}
