'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type TurnstileApi = {
  reset: () => void;
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    turnstile?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTurnstileLoad?: any;
  }
}

interface TurnstileProps {
  siteKey: string;
  onToken: (token: string) => void;
  onError?: (error: string) => void;
}

export default function Turnstile({ siteKey, onToken, onError }: TurnstileProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<TurnstileApi | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!siteKey || typeof window === 'undefined') return;

    const cleanupFns: Array<() => void> = [];

    const init = () => {
      if (apiRef.current) return;
      if (!window.turnstile || !widgetRef.current) return;
      const widgetId = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setFailed(false);
          onToken(token);
        },
        'error-callback': (message: string) => {
          setFailed(true);
          onError?.(message);
        },
        'expired-callback': () => setFailed(false),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiRef.current = { reset: () => (window.turnstile as any).reset(widgetId) };
    };

    if (window.turnstile) {
      init();
    } else {
      const scriptId = 'cf-turnstile-script';
      if (document.getElementById(scriptId)) {
        window.addEventListener('cf-turnstile-ready', init);
        cleanupFns.push(() => window.removeEventListener('cf-turnstile-ready', init));
      } else {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
        script.async = true;
        const onLoad = () => {
          window.onTurnstileLoad = () => {
            init();
          };
        };
        onLoad();
        document.head.appendChild(script);
      }
    }

    return () => {
      cleanupFns.forEach((fn) => fn());
      if (apiRef.current) {
        apiRef.current.reset();
        apiRef.current = null;
      }
    };
  }, [siteKey, onToken, onError]);

  const reset = useCallback(() => {
    apiRef.current?.reset();
  }, []);

  return (
    <div className="relative">
      <div ref={widgetRef} className="flex justify-center" data-turnstile />
      {failed && <p className="text-red-400 text-xs mt-1">Verification failed. Please try again.</p>}
    </div>
  );
}
