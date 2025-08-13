// lib/auth-monitoring.ts - Comprehensive authentication state monitoring and validation
import type { User, Session } from "@supabase/supabase-js";

// Authentication event types
export type AuthEvent = 
  | 'initialization_start'
  | 'initialization_complete'
  | 'initialization_failed'
  | 'session_validated'
  | 'session_invalid'
  | 'session_expired'
  | 'user_created'
  | 'user_fetch_failed'
  | 'state_corruption_detected'
  | 'race_condition_detected'
  | 'sign_in_start'
  | 'sign_in_complete'
  | 'sign_in_failed'
  | 'sign_out_start'
  | 'sign_out_complete'
  | 'sign_out_failed'
  | 'auth_bypass_attempt'
  | 'security_violation';

// Authentication monitoring data
interface AuthMonitoringData {
  event: AuthEvent;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  error?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Authentication state validation result
interface AuthStateValidationResult {
  isValid: boolean;
  violations: string[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Authentication monitoring configuration
const MONITORING_CONFIG = {
  MAX_LOG_ENTRIES: 1000,
  STORAGE_KEY: 'gt-planner-auth-monitoring',
  CRITICAL_EVENTS: ['state_corruption_detected', 'race_condition_detected', 'auth_bypass_attempt', 'security_violation'],
  HIGH_SEVERITY_EVENTS: ['initialization_failed', 'session_invalid', 'sign_in_failed', 'sign_out_failed'],
};

/**
 * Authentication monitoring and validation system
 */
export class AuthMonitor {
  private static instance: AuthMonitor;
  private eventLog: AuthMonitoringData[] = [];
  private listeners: Set<(event: AuthMonitoringData) => void> = new Set();

  private constructor() {
    this.loadPersistedLog();
  }

  public static getInstance(): AuthMonitor {
    if (!AuthMonitor.instance) {
      AuthMonitor.instance = new AuthMonitor();
    }
    return AuthMonitor.instance;
  }

  /**
   * Log authentication event
   */
  public logEvent(
    event: AuthEvent,
    metadata: {
      userId?: string;
      sessionId?: string;
      error?: string;
      data?: Record<string, any>;
    } = {}
  ): void {
    const eventData: AuthMonitoringData = {
      event,
      timestamp: Date.now(),
      userId: metadata.userId,
      sessionId: metadata.sessionId,
      error: metadata.error,
      metadata: metadata.data,
      severity: this.determineSeverity(event)
    };

    // Add to log
    this.eventLog.push(eventData);
    
    // Trim log if too large
    if (this.eventLog.length > MONITORING_CONFIG.MAX_LOG_ENTRIES) {
      this.eventLog = this.eventLog.slice(-MONITORING_CONFIG.MAX_LOG_ENTRIES);
    }

    // Persist log
    this.persistLog();

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(eventData);
      } catch (error) {
        console.error('AuthMonitor: Error in event listener:', error);
      }
    });

    // Log to console with appropriate level
    this.logToConsole(eventData);

    // Handle critical events
    if (eventData.severity === 'critical') {
      this.handleCriticalEvent(eventData);
    }
  }

  /**
   * Validate authentication state for inconsistencies and security issues
   */
  public validateAuthState(
    user: User | null,
    session: Session | null,
    userRecord: any | null,
    loading: boolean
  ): AuthStateValidationResult {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for user/session consistency
    if (user && !session) {
      violations.push('User exists without session');
      recommendations.push('Clear user state or restore session');
    }

    if (session && !user) {
      violations.push('Session exists without user');
      recommendations.push('Clear session or restore user');
    }

    if (session && user && session.user.id !== user.id) {
      violations.push('Session/user ID mismatch');
      recommendations.push('Refresh authentication state');
    }

    // Check for expired sessions
    if (session && session.expires_at) {
      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes

      if (now > expiresAt) {
        violations.push('Session is expired');
        recommendations.push('Refresh session or re-authenticate');
      } else if (now > expiresAt - bufferTime) {
        recommendations.push('Session expires soon, consider refreshing');
      }
    }

    // Check for loading state inconsistencies
    if (loading && user && session && userRecord) {
      violations.push('Loading state inconsistent with complete auth data');
      recommendations.push('Update loading state to false');
    }

    // Check for authentication bypass attempts
    if (user && !session) {
      violations.push('Potential authentication bypass - user without session');
      recommendations.push('Immediately clear user state and force re-authentication');
    }

    // Check userRecord consistency
    if (user && userRecord && userRecord.auth_id !== user.id) {
      violations.push('User record auth_id mismatch');
      recommendations.push('Refresh user record from database');
    }

    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (violations.some(v => v.includes('bypass') || v.includes('mismatch'))) {
      severity = 'critical';
    } else if (violations.some(v => v.includes('expired') || v.includes('inconsistent'))) {
      severity = 'high';
    } else if (violations.length > 0) {
      severity = 'medium';
    }

    const result: AuthStateValidationResult = {
      isValid: violations.length === 0,
      violations,
      recommendations,
      severity
    };

    // Log validation results
    if (!result.isValid) {
      this.logEvent('state_corruption_detected', {
        error: violations.join('; '),
        data: { violations, recommendations, severity }
      });
    }

    return result;
  }

  /**
   * Check for potential race conditions
   */
  public checkForRaceConditions(): boolean {
    const recentEvents = this.getRecentEvents(5000); // Last 5 seconds
    
    // Check for multiple initialization attempts
    const initEvents = recentEvents.filter(e => e.event === 'initialization_start');
    if (initEvents.length > 1) {
      this.logEvent('race_condition_detected', {
        error: 'Multiple initialization attempts detected',
        data: { initCount: initEvents.length }
      });
      return true;
    }

    // Check for rapid sign-in/sign-out cycles
    const signEvents = recentEvents.filter(e => 
      e.event === 'sign_in_start' || e.event === 'sign_out_start'
    );
    if (signEvents.length > 3) {
      this.logEvent('race_condition_detected', {
        error: 'Rapid authentication state changes detected',
        data: { eventCount: signEvents.length }
      });
      return true;
    }

    return false;
  }

  /**
   * Get authentication health score (0-100)
   */
  public getHealthScore(): number {
    const recentEvents = this.getRecentEvents(60000); // Last minute
    if (recentEvents.length === 0) return 100;

    let score = 100;
    
    // Deduct points for errors
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highSeverityEvents = recentEvents.filter(e => e.severity === 'high').length;
    const mediumSeverityEvents = recentEvents.filter(e => e.severity === 'medium').length;

    score -= criticalEvents * 30;
    score -= highSeverityEvents * 15;
    score -= mediumSeverityEvents * 5;

    return Math.max(0, score);
  }

  /**
   * Get recent authentication events
   */
  public getRecentEvents(timeWindow: number = 60000): AuthMonitoringData[] {
    const cutoff = Date.now() - timeWindow;
    return this.eventLog.filter(event => event.timestamp > cutoff);
  }

  /**
   * Get all events for debugging
   */
  public getAllEvents(): AuthMonitoringData[] {
    return [...this.eventLog];
  }

  /**
   * Clear event log
   */
  public clearLog(): void {
    this.eventLog = [];
    this.persistLog();
    console.log('AuthMonitor: Event log cleared');
  }

  /**
   * Add event listener
   */
  public addEventListener(listener: (event: AuthMonitoringData) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(listener: (event: AuthMonitoringData) => void): void {
    this.listeners.delete(listener);
  }

  // Private methods

  private determineSeverity(event: AuthEvent): 'low' | 'medium' | 'high' | 'critical' {
    if (MONITORING_CONFIG.CRITICAL_EVENTS.includes(event)) {
      return 'critical';
    }
    if (MONITORING_CONFIG.HIGH_SEVERITY_EVENTS.includes(event)) {
      return 'high';
    }
    if (event.includes('failed') || event.includes('invalid')) {
      return 'medium';
    }
    return 'low';
  }

  private logToConsole(eventData: AuthMonitoringData): void {
    const logMessage = `AuthMonitor [${eventData.severity.toUpperCase()}]: ${eventData.event}`;
    const logData = {
      timestamp: new Date(eventData.timestamp).toISOString(),
      userId: eventData.userId,
      error: eventData.error,
      metadata: eventData.metadata
    };

    switch (eventData.severity) {
      case 'critical':
        console.error(logMessage, logData);
        break;
      case 'high':
        console.warn(logMessage, logData);
        break;
      case 'medium':
        console.warn(logMessage, logData);
        break;
      default:
        console.log(logMessage, logData);
    }
  }

  private handleCriticalEvent(eventData: AuthMonitoringData): void {
    console.error('AuthMonitor: CRITICAL SECURITY EVENT DETECTED', eventData);
    
    // In production, this should:
    // 1. Alert security monitoring systems
    // 2. Log to security event system
    // 3. Potentially trigger automatic defensive actions
    
    if (process.env.NODE_ENV === 'production') {
      // Example: reportSecurityEvent(eventData);
    }
  }

  private persistLog(): void {
    try {
      if (typeof window !== 'undefined') {
        // Only persist recent events to avoid storage bloat
        const recentEvents = this.getRecentEvents(24 * 60 * 60 * 1000); // Last 24 hours
        localStorage.setItem(
          MONITORING_CONFIG.STORAGE_KEY,
          JSON.stringify(recentEvents)
        );
      }
    } catch (error) {
      console.error('AuthMonitor: Error persisting log:', error);
    }
  }

  private loadPersistedLog(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MONITORING_CONFIG.STORAGE_KEY);
        if (stored) {
          this.eventLog = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('AuthMonitor: Error loading persisted log:', error);
      this.eventLog = [];
    }
  }
}

// Export singleton instance
export const authMonitor = AuthMonitor.getInstance();

// Utility functions for easy usage
export const logAuthEvent = (event: AuthEvent, metadata?: any) => 
  authMonitor.logEvent(event, metadata);

export const validateAuthState = (user: User | null, session: Session | null, userRecord: any, loading: boolean) => 
  authMonitor.validateAuthState(user, session, userRecord, loading);

export const getAuthHealthScore = () => authMonitor.getHealthScore();

export const checkAuthRaceConditions = () => authMonitor.checkForRaceConditions();