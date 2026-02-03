/**
 * SERQ Console Interceptor
 * 
 * Intercepts all console output, uncaught errors, and unhandled promise rejections
 * from the webview and pipes them to the Rust backend via Tauri invoke.
 * Rust writes them to a log file that Claude Code can read directly.
 */

import { invoke } from '@tauri-apps/api/core';

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  source?: string;
  stack?: string;
}

// Store original console methods so we don't lose them
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
  trace: console.trace.bind(console),
};
/** Serialize any argument to a readable string */
function serialize(arg: unknown): string {
  if (arg === undefined) return 'undefined';
  if (arg === null) return 'null';
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}${arg.stack ? '\n' + arg.stack : ''}`;
  }
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
}

/** Format multiple console args into a single message string */
function formatArgs(args: unknown[]): string {
  return args.map(serialize).join(' ');
}

/** Send a log entry to Rust backend (fire-and-forget, never throws) */
async function sendToRust(entry: LogEntry): Promise<void> {
  try {
    await invoke('debug_bridge_log', { entry: JSON.stringify(entry) });
  } catch {
    // If Rust command isn't registered yet (dev reload), silently drop.
  }
}

/** Create an interceptor for a specific console method */
function interceptConsole(level: LogLevel): (...args: unknown[]) => void {
  return (...args: unknown[]) => {
    originalConsole[level](...args);
    const entry: LogEntry = {
      level,
      message: formatArgs(args),
      timestamp: new Date().toISOString(),
    };
    if (level === 'error' || level === 'trace') {
      const stack = new Error().stack;
      if (stack) {
        entry.stack = stack.split('\n').slice(2).join('\n');
      }
    }
    sendToRust(entry);
  };
}

/** Initialize the debug bridge - call once before React mounts */
export function initDebugBridge(): void {
  if (import.meta.env.PROD) return;

  console.log = interceptConsole('log');
  console.info = interceptConsole('info');
  console.warn = interceptConsole('warn');
  console.error = interceptConsole('error');
  console.debug = interceptConsole('debug');
  console.trace = interceptConsole('trace');

  window.addEventListener('error', (event) => {
    sendToRust({
      level: 'error',
      message: `[UNCAUGHT] ${event.message}`,
      timestamp: new Date().toISOString(),
      source: `${event.filename}:${event.lineno}:${event.colno}`,
      stack: event.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    sendToRust({
      level: 'error',
      message: `[UNHANDLED PROMISE] ${serialize(reason)}`,
      timestamp: new Date().toISOString(),
      stack: reason?.stack,
    });
  });

  originalConsole.info('[DebugBridge] Active - logs piped to ~/.serq-debug.log');
}

/**
 * Manually log to the debug bridge without going through console.
 * Useful for structured data logging.
 */
export function debugLog(level: LogLevel, message: string, data?: unknown): void {
  if (import.meta.env.PROD) return;
  sendToRust({
    level,
    message: data ? `${message} ${serialize(data)}` : message,
    timestamp: new Date().toISOString(),
  });
}
