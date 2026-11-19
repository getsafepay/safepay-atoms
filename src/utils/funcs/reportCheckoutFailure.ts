declare const __SFPY_BETTER_STACK_RUM_TOKEN__: string;

type BetterStackTag = ((...args: unknown[]) => void) & { q?: unknown[][]; l?: number };
type RumWindow = Window & { betterstack?: BetterStackTag };

let rumFrame: HTMLIFrameElement | undefined;

function getRumWindow(token: string, environment?: string): RumWindow | undefined {
  if (rumFrame?.isConnected) return rumFrame.contentWindow ?? undefined;

  // Keep the tag's global separate from any telemetry already on the host page.
  const frame = window.document.createElement('iframe');
  frame.hidden = true;
  frame.title = 'Safepay checkout diagnostics';
  window.document.body.appendChild(frame);
  const rumWindow = frame.contentWindow as RumWindow | null;
  const head = frame.contentDocument?.head;
  if (!rumWindow || !head) {
    frame.remove();
    return undefined;
  }

  const queue: BetterStackTag = (...args) => queue.q?.push(args);
  queue.q = [];
  queue.l = Date.now();
  rumWindow.betterstack = queue;
  queue('config', { crossDomainCookie: false });
  queue('init', { autoPageview: false, environment });

  const script = head.ownerDocument.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.referrerPolicy = 'no-referrer';
  script.src = `https://betterstack.net/b.js?t=${encodeURIComponent(token)}`;
  script.onerror = () => frame.remove();
  head.appendChild(script);
  rumFrame = frame;
  return rumWindow;
}

export function reportCardCaptureTimeout(data: {
  attempt_id: string;
  environment?: string;
  tracker: unknown;
  last_step: 'iframe_opened' | 'iframe_loaded' | 'ready_received' | 'props_acknowledged';
  elapsed_ms: number;
}): void {
  const token = typeof __SFPY_BETTER_STACK_RUM_TOKEN__ === 'string' ? __SFPY_BETTER_STACK_RUM_TOKEN__ : '';
  if (!token) return;

  try {
    const { tracker, ...event } = data;
    getRumWindow(token, event.environment)?.betterstack?.('track', 'cardcapture_startup_timeout', {
      source: 'atoms',
      ...event,
      ...(typeof tracker === 'string' && /^track_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(tracker) ? { tracker } : {}),
    });
  } catch {
    // Telemetry is optional and must never affect checkout.
  }
}
