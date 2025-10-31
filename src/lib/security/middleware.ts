// Minimal middleware stub for compatibility

export const SECURITY_CONFIGS = {
  COURSES_ALL: {
    rateLimit: { maxRequests: 100, windowMs: 60000 },
  },
  USER_PROFILE: {
    rateLimit: { maxRequests: 50, windowMs: 60000 },
  },
  MEDIUM_SECURITY: {
    rateLimit: { maxRequests: 100, windowMs: 60000 },
  },
  HIGH_SECURITY: {
    rateLimit: { maxRequests: 50, windowMs: 60000 },
  },
};

export function createSecureRoute(
  handler: (request: Request, context?: any) => Promise<Response>,
  config?: any
) {
  // Simple wrapper that just calls the handler
  // In a real implementation, this would add auth checks, rate limiting, etc.
  return async (request: Request) => {
    const context = { user: null, validatedData: null };
    return handler(request, context);
  };
}
