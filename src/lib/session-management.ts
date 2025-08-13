// lib/session-management.ts - Enhanced session management with persistence and recovery
import { supabase } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

// Session state interface
interface SessionState {
  session: Session | null;
  user: User | null;
  lastValidated: number;
  isValid: boolean;
  error: string | null;
}

// Session validation configuration
const SESSION_CONFIG = {
  VALIDATION_INTERVAL: 5 * 60 * 1000, // 5 minutes
  STORAGE_KEY: 'gt-planner-session-state',
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

/**
 * Enhanced session manager with persistence and automatic recovery
 */
export class SessionManager {
  private static instance: SessionManager;
  private sessionState: SessionState | null = null;
  private validationTimer: NodeJS.Timeout | null = null;
  private retryCount = 0;

  private constructor() {
    this.initializeSession();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session with persistence recovery
   */
  private async initializeSession(): Promise<void> {
    try {
      console.log('SessionManager: Initializing session');
      
      // Try to recover from persistent storage
      const persistedState = this.loadPersistedState();
      
      if (persistedState && this.isRecentlyValidated(persistedState)) {
        console.log('SessionManager: Using persisted session state');
        this.sessionState = persistedState;
      }

      // Validate current session
      await this.validateSession();
      
      // Start periodic validation
      this.startPeriodicValidation();
      
    } catch (error) {
      console.error('SessionManager: Initialization failed:', error);
      this.sessionState = {
        session: null,
        user: null,
        lastValidated: Date.now(),
        isValid: false,
        error: error instanceof Error ? error.message : 'Session initialization failed'
      };
    }
  }

  /**
   * Validate current session with Supabase
   */
  public async validateSession(): Promise<SessionState> {
    try {
      console.log('SessionManager: Validating session');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(`Session validation failed: ${error.message}`);
      }

      // Check if session is expired
      if (session && this.isSessionExpired(session)) {
        console.warn('SessionManager: Session is expired');
        await this.handleExpiredSession();
        return this.sessionState!;
      }

      // Update session state
      this.sessionState = {
        session,
        user: session?.user || null,
        lastValidated: Date.now(),
        isValid: !!session,
        error: null
      };

      // Persist state
      this.persistState();
      
      // Reset retry count on success
      this.retryCount = 0;
      
      console.log('SessionManager: Session validation successful:', !!session);
      return this.sessionState;

    } catch (error) {
      console.error('SessionManager: Session validation error:', error);
      
      // Handle validation failure
      const errorMessage = error instanceof Error ? error.message : 'Session validation failed';
      
      this.sessionState = {
        session: null,
        user: null,
        lastValidated: Date.now(),
        isValid: false,
        error: errorMessage
      };

      // Attempt retry with exponential backoff
      if (this.retryCount < SESSION_CONFIG.MAX_RETRY_ATTEMPTS) {
        this.retryCount++;
        const delay = SESSION_CONFIG.RETRY_DELAY * Math.pow(2, this.retryCount - 1);
        
        console.log(`SessionManager: Retrying validation in ${delay}ms (attempt ${this.retryCount})`);
        setTimeout(() => this.validateSession(), delay);
      }

      return this.sessionState;
    }
  }

  /**
   * Handle expired session with automatic refresh attempt
   */
  private async handleExpiredSession(): Promise<void> {
    try {
      console.log('SessionManager: Attempting to refresh expired session');
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        console.log('SessionManager: Session refresh failed, clearing state');
        await this.clearSession();
        return;
      }

      console.log('SessionManager: Session refreshed successfully');
      this.sessionState = {
        session,
        user: session.user,
        lastValidated: Date.now(),
        isValid: true,
        error: null
      };
      
      this.persistState();
      
    } catch (error) {
      console.error('SessionManager: Session refresh error:', error);
      await this.clearSession();
    }
  }

  /**
   * Clear session state and persistent storage
   */
  public async clearSession(): Promise<void> {
    console.log('SessionManager: Clearing session state');
    
    this.sessionState = {
      session: null,
      user: null,
      lastValidated: Date.now(),
      isValid: false,
      error: null
    };

    // Clear persistent storage
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
        
        // Clear Supabase auth storage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.') || key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('SessionManager: Error clearing storage:', error);
    }

    this.stopPeriodicValidation();
  }

  /**
   * Get current session state
   */
  public getSessionState(): SessionState | null {
    return this.sessionState;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.sessionState?.isValid === true && this.sessionState.session !== null;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.sessionState?.user || null;
  }

  /**
   * Get current session
   */
  public getCurrentSession(): Session | null {
    return this.sessionState?.session || null;
  }

  /**
   * Force session revalidation
   */
  public async revalidate(): Promise<SessionState> {
    console.log('SessionManager: Force revalidation requested');
    return await this.validateSession();
  }

  // Private helper methods

  private isSessionExpired(session: Session): boolean {
    if (!session.expires_at) return false;
    return Date.now() / 1000 > session.expires_at - 60; // 1 minute buffer
  }

  private isRecentlyValidated(state: SessionState): boolean {
    const age = Date.now() - state.lastValidated;
    return age < SESSION_CONFIG.VALIDATION_INTERVAL;
  }

  private startPeriodicValidation(): void {
    this.stopPeriodicValidation();
    
    this.validationTimer = setInterval(() => {
      if (this.sessionState?.isValid) {
        this.validateSession();
      }
    }, SESSION_CONFIG.VALIDATION_INTERVAL);
  }

  private stopPeriodicValidation(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }
  }

  private persistState(): void {
    try {
      if (typeof window !== 'undefined' && this.sessionState) {
        const stateToStore = {
          ...this.sessionState,
          // Don't persist the actual session/user objects for security
          session: this.sessionState.session ? { 
            expires_at: this.sessionState.session.expires_at,
            user: { id: this.sessionState.session.user.id }
          } : null,
          user: this.sessionState.user ? { id: this.sessionState.user.id } : null
        };
        
        localStorage.setItem(
          SESSION_CONFIG.STORAGE_KEY, 
          JSON.stringify(stateToStore)
        );
      }
    } catch (error) {
      console.error('SessionManager: Error persisting state:', error);
    }
  }

  private loadPersistedState(): SessionState | null {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored) as SessionState;
        }
      }
    } catch (error) {
      console.error('SessionManager: Error loading persisted state:', error);
    }
    return null;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.stopPeriodicValidation();
    this.sessionState = null;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Utility functions
export const isAuthenticated = (): boolean => sessionManager.isAuthenticated();
export const getCurrentUser = (): User | null => sessionManager.getCurrentUser();
export const getCurrentSession = (): Session | null => sessionManager.getCurrentSession();
export const revalidateSession = (): Promise<SessionState> => sessionManager.revalidate();
export const clearSessionState = (): Promise<void> => sessionManager.clearSession();