import { loadCardLinkStylesAndJsChunks } from './load-card-link';
import { loadIndexStylesAndJsChunks } from './load-index';
import { loadPayerAuthenticationStylesAndJsChunks } from './load-payer-auth';
import { loadSeamlessIframeStylesAndJsChunks } from './load-seamless-iframe';

export function loadAllStylesAndJsChunks() {
  loadIndexStylesAndJsChunks();
  loadSeamlessIframeStylesAndJsChunks();
  loadCardLinkStylesAndJsChunks();
  loadPayerAuthenticationStylesAndJsChunks();
}
