// Minimal logger stub for compatibility
// This is a simplified version to prevent build errors

export interface Logger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

export function createComponentLogger(component: string): Logger {
  return {
    info: (message: string, ...args: any[]) => {
      console.log(`[${component}] INFO:`, message, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`[${component}] WARN:`, message, ...args);
    },
    error: (message: string, ...args: any[]) => {
      console.error(`[${component}] ERROR:`, message, ...args);
    },
    debug: (message: string, ...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[${component}] DEBUG:`, message, ...args);
      }
    },
  };
}

export const logger = createComponentLogger('DEFAULT');
