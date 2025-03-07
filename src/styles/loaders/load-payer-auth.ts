//@ts-ignore
import * as payerAuthenticationStyles from 'bundle-text:../css/payer-auth.css';

function loadPayerAuthenticationStyles() {
  try {
    const o = document.createElement('style');
    o.textContent = payerAuthenticationStyles;
    o.className = 'safepay-drops-PayerAuthentication';
    window.drops.styleChunks.PayerAuthentication = o;
  } catch (o) {
    console.error(o, 'Unable to add CardLink styles to the window using the corresponding js file');
  }
}

function loadPayerAuthenticationJsChunks() {
  try {
    window.drops.jsChunkImports.PayerAuthentication = ['index', 'SeamlessIframe'];
  } catch (o) {
    console.error(o, 'Unable to add CardLink style imports to the window using the corresponding js file');
  }
}

export function loadPayerAuthenticationStylesAndJsChunks() {
  loadPayerAuthenticationStyles();
  loadPayerAuthenticationJsChunks();
}
