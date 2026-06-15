import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and suppress benign WebSocket / Vite HMR connection rejections
if (typeof window !== 'undefined') {
  const handleBenignError = (msg: string | undefined, event: Event | PromiseRejectionEvent) => {
    const errorString = msg || '';
    if (
      errorString.includes('WebSocket') || 
      errorString.includes('websocket') || 
      errorString.includes('vite') || 
      errorString.includes('HMR') ||
      errorString.includes('closed without opened')
    ) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      return true;
    }
    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    handleBenignError(reasonMsg, event);
  });

  window.addEventListener('error', (event) => {
    handleBenignError(event.message, event);
  });

  // Protect and proxy global WebSocket to catch "closed without opened" safely
  if (window.WebSocket) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'WebSocket');
      let isWritable = true;
      if (descriptor) {
        isWritable = !!(descriptor.configurable || descriptor.writable || descriptor.set);
      }

      if (isWritable) {
        const NativeWebSocket = window.WebSocket;
        const WrappedWebSocket = function (this: any, url: string | URL, protocols?: string | string[]) {
          let ws: WebSocket;
          try {
            if (protocols) {
              ws = new NativeWebSocket(url, protocols);
            } else {
              ws = new NativeWebSocket(url);
            }
          } catch (e) {
            throw e;
          }

          // Safeguard close calls to completely swallow benign closed-without-opened errors
          const originalClose = ws.close;
          ws.close = function (this: any, code?: number, reason?: string) {
            try {
              originalClose.call(this, code, reason);
            } catch (err: any) {
              const errMsg = err?.message || String(err);
              if (errMsg.includes('closed without opened') || errMsg.includes('WebSocket')) {
                // Quietly ignore proxy disconnect errors during teardown
                return;
              }
              throw err;
            }
          };

          // Ensure error events are caught silently
          ws.addEventListener('error', () => {
            // Suppress unhandled console dumps from background reconnection attempts
          });

          return ws;
        };

        // Standardize prototypes and state constants
        WrappedWebSocket.prototype = NativeWebSocket.prototype;
        (WrappedWebSocket as any).CONNECTING = NativeWebSocket.CONNECTING;
        (WrappedWebSocket as any).OPEN = NativeWebSocket.OPEN;
        (WrappedWebSocket as any).CLOSING = NativeWebSocket.CLOSING;
        (WrappedWebSocket as any).CLOSED = NativeWebSocket.CLOSED;

        try {
          Object.defineProperty(window, 'WebSocket', {
            value: WrappedWebSocket,
            configurable: true,
            writable: true,
            enumerable: true
          });
        } catch (defineError) {
          try {
            (window as any).WebSocket = WrappedWebSocket;
          } catch (assignError) {
            // Suppress fallback write failures
          }
        }
      }
    } catch (e) {
      // Quietly handle platform blockages to avoid breaking the rest of the application
    }
  }

  // Silence developer-facing console rejections for WebSocket/HMR noise
  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    const errorStr = args.map(arg => String(arg || '')).join(' ');
    if (
      errorStr.includes('WebSocket') ||
      errorStr.includes('websocket') ||
      errorStr.includes('closed without opened') ||
      errorStr.includes('HMR')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = function (...args: any[]) {
    const warnStr = args.map(arg => String(arg || '')).join(' ');
    if (
      warnStr.includes('WebSocket') ||
      warnStr.includes('websocket') ||
      warnStr.includes('closed without opened') ||
      warnStr.includes('HMR')
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
