//@ts-ignore
import * as payerAuthenticationStyles from '../css/payer-auth.css';

function loadPayerAuthenticationStyles() {
  try {
    const o = document.createElement('style');
    o.textContent = payerAuthenticationStyles;
    o.className = 'safepay-atoms-PayerAuthentication';
    window.atoms.styleChunks.PayerAuthentication = o;
  } catch (o) {
    console.error(o, 'Unable to add PayerAuth styles to the window using the corresponding js file');
  }
}

function loadPayerAuthenticationJsChunks() {
  try {
    window.atoms.jsChunkImports.PayerAuthentication = ['index', 'SeamlessIframe'];
  } catch (o) {
    console.error(o, 'Unable to add PayerAuth style imports to the window using the corresponding js file');
  }
}

export function loadPayerAuthenticationStylesAndJsChunks() {
  loadPayerAuthenticationStyles();
  loadPayerAuthenticationJsChunks();
}
