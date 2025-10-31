// Minimal config stub for compatibility
// This is a simplified version to prevent build errors

export const ENV = {
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

export const SECURITY_CONFIG = {
  enableLogging: true,
  enableMonitoring: ENV.isProd,
};
