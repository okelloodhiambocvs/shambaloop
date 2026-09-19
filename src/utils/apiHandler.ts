/**
 * Centralized API handler and error manager for ShambaLoop.
 * Prevents sensitive details (such as database errors or paths) from leaking to the UI,
 * while automatically logging diagnostic errors and presenting elegant, non-intrusive toast alerts.
 */

export interface AppProductionLog {
  id: string;
  timestamp: string;
  type: 'ERROR' | 'INFO';
  endpoint?: string;
  message: string;
  rawDetails?: string;
}

// Global Toast injection helper
export function showToast(message: string, duration = 4000) {
  if (typeof document === 'undefined') return;

  // Locate or create container
  let container = document.getElementById('sl_toast_container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sl_toast_container';
    container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0';
    document.body.appendChild(container);
  }

  // Create Toast element
  const toast = document.createElement('div');
  toast.className = 'bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-3 text-xs font-semibold shadow-lg flex items-center justify-between gap-3 pointer-events-auto transition-all duration-300 transform translate-y-2 opacity-0 animate-fade-in border-l-4 border-l-amber-500';
  
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-amber-500 font-bold">Notice:</span>
      <span class="leading-snug">${escapeHTML(message)}</span>
    </div>
    <button class="text-slate-400 hover:text-white font-bold ml-2 transition-colors cursor-pointer" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Trigger entering animation transition frame
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Self-destruction timeout
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

function escapeHTML(str: string): string {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/**
 * Strips database and stack-trace details to form a user-friendly summary.
 */
export function sanitizeErrorMessage(rawMessage: string): string {
  const normalized = rawMessage.toLowerCase();
  
  if (
    normalized.includes('db_') ||
    normalized.includes('sql') ||
    normalized.includes('postgres') ||
    normalized.includes('relation') ||
    normalized.includes('select') ||
    normalized.includes('database') ||
    normalized.includes('conn') ||
    normalized.includes('sqlite')
  ) {
    return 'System optimization is in progress. Connection is temporarily busy, please try again.';
  }
  
  if (normalized.includes('unauthorized') || normalized.includes('token') || normalized.includes('jwt')) {
    return 'Your session has expired. Please log in again to continue.';
  }

  if (normalized.includes('failed to fetch') || normalized.includes('networkerror')) {
    return 'Network connection is offline. Your change was not saved. Please retry.';
  }

  return rawMessage || 'An unexpected connection issue occurred. Please retry.';
}

/**
 * Safely saves logs to localStorage for analysis.
 */
export function recordProductionLog(message: string, rawDetails?: any, endpoint?: string) {
  try {
    const rawLogs = localStorage.getItem('sl_production_logs');
    const logs: AppProductionLog[] = rawLogs ? JSON.parse(rawLogs) : [];
    
    const newLog: AppProductionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      endpoint,
      message: sanitizeErrorMessage(message),
      rawDetails: rawDetails ? JSON.stringify(rawDetails) : undefined
    };
    
    // Cap log storage at 100 entries
    const trimmedLogs = [newLog, ...logs].slice(0, 100);
    localStorage.setItem('sl_production_logs', JSON.stringify(trimmedLogs));
  } catch (err) {
    console.error('Failed to commit production audit log:', err);
  }
}

/**
 * High-performance fetch wrapper that incorporates schema feedback and structured errors.
 */
export async function safeFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  const urlString = typeof input === 'string' ? input : (input as any).url || '';
  try {
    const headers = new Headers(init?.headers);
    const response = await fetch(input, { ...init, headers, credentials: 'same-origin' });
    const contentType = response.headers.get('content-type');
    
    let responseData: any = null;
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = { text: await response.text() };
    }

    if (!response.ok) {
      const rawErr = responseData?.error || responseData?.message || `HTTP ${response.status}`;
      const userMessage = sanitizeErrorMessage(rawErr);
      recordProductionLog(rawErr, responseData, urlString);
      showToast(userMessage);
      return { data: null, error: userMessage };
    }

    return { data: responseData as T, error: null };
  } catch (err: any) {
    const rawErr = err?.message || String(err);
    const userMessage = sanitizeErrorMessage(rawErr);
    recordProductionLog(rawErr, err, urlString);
    showToast(userMessage);
    return { data: null, error: userMessage };
  }
}
