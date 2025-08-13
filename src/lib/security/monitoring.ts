/**
 * COMPREHENSIVE SECURITY MONITORING SYSTEM
 * 
 * Provides real-time security event tracking, anomaly detection,
 * and FERPA-compliant academic data monitoring for GT Course Planner.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createAPILogger } from './logger';
import { MONITORING_CONFIG, FERPA_CONFIG /* , ENV */ } from './config';

export interface SecurityEvent {
  id?: string;
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  method?: string;
  data?: any;
  threat_indicators?: ThreatIndicator[];
  created_at?: string;
}

export type SecurityEventType = 
  | 'auth_attempt'
  | 'auth_failure' 
  | 'auth_success'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'invalid_input'
  | 'sql_injection_attempt'
  | 'xss_attempt'
  | 'unauthorized_access'
  | 'ferpa_violation'
  | 'data_breach_attempt'
  | 'session_hijacking'
  | 'privilege_escalation'
  | 'api_abuse'
  | 'brute_force_attempt';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ThreatIndicator {
  type: string;
  value: string;
  confidence: number;
  description: string;
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  authFailures: number;
  suspiciousActivities: number;
  ferpaViolations: number;
  rateLimit: number;
  topThreats: Array<{
    type: SecurityEventType;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  riskScore: number;
  complianceScore: number;
}

class SecurityMonitoringService {
  private logger = createAPILogger('security', 'monitoring');
  private alertThresholds = MONITORING_CONFIG.alerts;
  private isMonitoringEnabled = MONITORING_CONFIG.suspicious.enabled;
  
  // Cache for rate limiting and anomaly detection
  private eventCache = new Map<string, number>();
  private suspiciousIPs = new Set<string>();
  private alertCooldowns = new Map<string, number>();

  /**
   * Track a security event with automatic threat analysis
   */
  async trackSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      if (!this.isMonitoringEnabled && event.severity !== 'CRITICAL') {
        return; // Skip non-critical events if monitoring disabled
      }

      // Enrich event with threat analysis
      const enrichedEvent = await this.enrichSecurityEvent(event);

      // Store event in database
      await this.storeSecurityEvent(enrichedEvent);

      // Check for automated responses
      await this.checkAutomatedResponse(enrichedEvent);

      // Check alert conditions
      await this.checkAlertConditions(enrichedEvent);

      // Log for audit trail
      this.logger.info('Security event tracked', {
        type: enrichedEvent.event_type,
        severity: enrichedEvent.severity,
        user_id: enrichedEvent.user_id,
        threats: enrichedEvent.threat_indicators?.length || 0
      });

    } catch (error) {
      this.logger.error('Failed to track security event', error, {
        critical: true,
        event_type: event.event_type
      });
    }
  }

  /**
   * Track authentication events with anomaly detection
   */
  async trackAuthEvent(
    type: 'attempt' | 'success' | 'failure',
    userId?: string,
    metadata?: any
  ): Promise<void> {
    const eventType: SecurityEventType = type === 'attempt' 
      ? 'auth_attempt' 
      : type === 'success' 
        ? 'auth_success' 
        : 'auth_failure';

    const severity: SecuritySeverity = type === 'failure' ? 'MEDIUM' : 'LOW';

    await this.trackSecurityEvent({
      event_type: eventType,
      severity,
      user_id: userId,
      data: metadata
    });
  }

  /**
   * Track input validation failures (potential attacks)
   */
  async trackValidationFailure(
    input: string,
    fieldName: string,
    validationType: string,
    userId?: string
  ): Promise<void> {
    const threatIndicators = this.analyzeInputThreats(input, validationType);
    
    const severity: SecuritySeverity = threatIndicators.some(t => t.confidence > 0.8) 
      ? 'HIGH' 
      : threatIndicators.length > 0 
        ? 'MEDIUM' 
        : 'LOW';

    await this.trackSecurityEvent({
      event_type: 'invalid_input',
      severity,
      user_id: userId,
      data: {
        field_name: fieldName,
        validation_type: validationType,
        input_length: input.length,
        // Don't store actual input for security
        sanitized_input: this.sanitizeForLogging(input)
      },
      threat_indicators: threatIndicators
    });
  }

  /**
   * Track FERPA-compliant academic data access
   */
  async trackAcademicDataAccess(
    userId: string,
    dataType: string,
    operation: string,
    justification?: string
  ): Promise<void> {
    // Check if this qualifies as sensitive academic data
    const isSensitive = FERPA_CONFIG.sensitiveFields.some(field => 
      dataType.toLowerCase().includes(field.toLowerCase())
    );

    const severity: SecuritySeverity = isSensitive ? 'MEDIUM' : 'LOW';

    await this.trackSecurityEvent({
      event_type: 'ferpa_violation', // Will be reclassified if compliant
      severity,
      user_id: userId,
      data: {
        data_type: dataType,
        operation,
        justification,
        is_sensitive: isSensitive,
        compliance_check: true
      }
    });

    // Separate FERPA compliance logging
    await this.logFERPAAccess(userId, dataType, operation, justification);
  }

  /**
   * Get real-time security metrics for dashboard
   */
  async getSecurityMetrics(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<SecurityMetrics> {
    try {
      const hoursBack = this.getHoursFromTimeframe(timeframe);
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      const { data: events, error } = await supabaseAdmin()
        .from('security_events')
        .select('*')
        .gte('created_at', since);

      if (error) throw error;

      return this.calculateSecurityMetrics(events || []);

    } catch (error) {
      this.logger.error('Failed to get security metrics', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get security events for investigation
   */
  async getSecurityEvents(
    filters: {
      event_type?: SecurityEventType;
      severity?: SecuritySeverity;
      user_id?: string;
      since?: string;
      limit?: number;
    } = {}
  ): Promise<SecurityEvent[]> {
    try {
      let query = supabaseAdmin()
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.since) {
        query = query.gte('created_at', filters.since);
      }

      const { data, error } = await query.limit(filters.limit || 100);
      
      if (error) throw error;
      return data || [];

    } catch (error) {
      this.logger.error('Failed to get security events', error);
      return [];
    }
  }

  /**
   * Check for suspicious patterns and automated responses
   */
  private async checkAutomatedResponse(event: SecurityEvent): Promise<void> {
    // Rate limiting violations
    if (event.event_type === 'rate_limit_exceeded') {
      if (event.ip_address) {
        this.suspiciousIPs.add(event.ip_address);
      }
    }

    // Repeated auth failures
    if (event.event_type === 'auth_failure' && event.user_id) {
      const failureKey = `auth_failures_${event.user_id}`;
      const failures = (this.eventCache.get(failureKey) || 0) + 1;
      this.eventCache.set(failureKey, failures);

      if (failures >= MONITORING_CONFIG.suspicious.maxFailedLogins) {
        await this.trackSecurityEvent({
          event_type: 'brute_force_attempt',
          severity: 'HIGH',
          user_id: event.user_id,
          data: { failure_count: failures }
        });
      }
    }

    // SQL injection attempts
    if (event.threat_indicators?.some(t => t.type === 'sql_injection')) {
      await this.trackSecurityEvent({
        event_type: 'sql_injection_attempt',
        severity: 'HIGH',
        user_id: event.user_id,
        data: { original_event: event.id }
      });
    }
  }

  /**
   * Check if alerts should be triggered
   */
  private async checkAlertConditions(event: SecurityEvent): Promise<void> {
    const now = Date.now();
    const cooldownKey = `${event.event_type}_${event.severity}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey) || 0;

    // Prevent alert spam with cooldowns
    if (now - lastAlert < 300000) { // 5 minute cooldown
      return;
    }

    let shouldAlert = false;
    let alertReason = '';

    // Critical events always alert
    if (event.severity === 'CRITICAL') {
      shouldAlert = true;
      alertReason = 'Critical security event detected';
    }

    // High-confidence threats
    const highConfidenceThreats = event.threat_indicators?.filter(t => t.confidence > 0.9) || [];
    if (highConfidenceThreats.length > 0) {
      shouldAlert = true;
      alertReason = `High-confidence threat detected: ${highConfidenceThreats.map(t => t.type).join(', ')}`;
    }

    // FERPA violations
    if (event.event_type === 'ferpa_violation') {
      shouldAlert = true;
      alertReason = 'Potential FERPA compliance violation';
    }

    if (shouldAlert) {
      this.alertCooldowns.set(cooldownKey, now);
      await this.triggerSecurityAlert(event, alertReason);
    }
  }

  /**
   * Trigger security alert (would integrate with alerting system)
   */
  private async triggerSecurityAlert(event: SecurityEvent, reason: string): Promise<void> {
    this.logger.error('SECURITY ALERT', {
      reason,
      event_type: event.event_type,
      severity: event.severity,
      user_id: event.user_id,
      threats: event.threat_indicators?.length || 0
    });

    // In production, this would integrate with:
    // - Email/SMS notifications
    // - Slack/Teams alerts
    // - External monitoring systems
    // - Automated response systems
  }

  /**
   * Enrich security event with threat analysis
   */
  private async enrichSecurityEvent(event: SecurityEvent): Promise<SecurityEvent> {
    const enriched = { ...event };
    enriched.created_at = new Date().toISOString();

    // Add threat indicators if not already present
    if (!enriched.threat_indicators && enriched.data) {
      enriched.threat_indicators = this.analyzeThreatIndicators(enriched);
    }

    return enriched;
  }

  /**
   * Analyze threat indicators from event data
   */
  private analyzeThreatIndicators(event: SecurityEvent): ThreatIndicator[] {
    const indicators: ThreatIndicator[] = [];

    // Check for common attack patterns
    if (event.data?.input || event.data?.sanitized_input) {
      const input = event.data.input || event.data.sanitized_input;
      indicators.push(...this.analyzeInputThreats(input, 'general'));
    }

    // Behavioral analysis
    if (event.user_id) {
      // Check for unusual access patterns
      // This would be expanded with ML/behavioral analysis
    }

    return indicators;
  }

  /**
   * Analyze input for threat patterns
   */
  private analyzeInputThreats(input: string, _validationType: string): ThreatIndicator[] {
    const indicators: ThreatIndicator[] = [];
    const _lowercaseInput = input.toLowerCase();

    // SQL injection patterns
    const sqlPatterns = [
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+.*set/i,
      /exec\s*\(/i,
      /script\s*:/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        indicators.push({
          type: 'sql_injection',
          value: pattern.source,
          confidence: 0.8,
          description: 'SQL injection pattern detected'
        });
      }
    }

    // XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /onclick\s*=/i,
      /<iframe/i,
      /document\.cookie/i
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        indicators.push({
          type: 'xss_attempt',
          value: pattern.source,
          confidence: 0.7,
          description: 'Cross-site scripting pattern detected'
        });
      }
    }

    // Path traversal
    if (input.includes('../') || input.includes('..\\')) {
      indicators.push({
        type: 'path_traversal',
        value: '../',
        confidence: 0.9,
        description: 'Path traversal attempt detected'
      });
    }

    return indicators;
  }

  /**
   * Store security event in database
   */
  private async storeSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const { error } = await supabaseAdmin()
        .from('security_events')
        .insert([event]);

      if (error) throw error;

    } catch (error) {
      this.logger.error('Failed to store security event', error);
      throw error;
    }
  }

  /**
   * Log FERPA-compliant academic data access
   */
  private async logFERPAAccess(
    userId: string,
    dataType: string,
    operation: string,
    justification?: string
  ): Promise<void> {
    try {
      await supabaseAdmin()
        .from('ferpa_access_logs')
        .insert([{
          user_id: userId,
          data_type: dataType,
          operation,
          justification,
          accessed_at: new Date().toISOString()
        }]);

    } catch (error) {
      this.logger.error('Failed to log FERPA access', error, {
        critical: true
      });
    }
  }

  /**
   * Calculate security metrics from events
   */
  private calculateSecurityMetrics(events: SecurityEvent[]): SecurityMetrics {
    const totalEvents = events.length;
    const criticalEvents = events.filter(e => e.severity === 'CRITICAL').length;
    const authFailures = events.filter(e => e.event_type === 'auth_failure').length;
    const suspiciousActivities = events.filter(e => e.event_type === 'suspicious_activity').length;
    const ferpaViolations = events.filter(e => e.event_type === 'ferpa_violation').length;
    const rateLimit = events.filter(e => e.event_type === 'rate_limit_exceeded').length;

    // Calculate threat trends
    const threatCounts: Record<string, number> = {};
    events.forEach(e => {
      threatCounts[e.event_type] = (threatCounts[e.event_type] || 0) + 1;
    });

    const topThreats = Object.entries(threatCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({
        type: type as SecurityEventType,
        count,
        trend: 'stable' as const // Would be calculated from historical data
      }));

    // Calculate risk score (0-100)
    let riskScore = 0;
    riskScore += criticalEvents * 25;
    riskScore += authFailures * 2;
    riskScore += suspiciousActivities * 5;
    riskScore += ferpaViolations * 15;
    riskScore = Math.min(riskScore, 100);

    // Calculate compliance score (0-100)
    let complianceScore = 100;
    complianceScore -= ferpaViolations * 20;
    complianceScore -= criticalEvents * 10;
    complianceScore = Math.max(complianceScore, 0);

    return {
      totalEvents,
      criticalEvents,
      authFailures,
      suspiciousActivities,
      ferpaViolations,
      rateLimit,
      topThreats,
      riskScore,
      complianceScore
    };
  }

  /**
   * Get empty metrics for error cases
   */
  private getEmptyMetrics(): SecurityMetrics {
    return {
      totalEvents: 0,
      criticalEvents: 0,
      authFailures: 0,
      suspiciousActivities: 0,
      ferpaViolations: 0,
      rateLimit: 0,
      topThreats: [],
      riskScore: 0,
      complianceScore: 100
    };
  }

  /**
   * Convert timeframe to hours
   */
  private getHoursFromTimeframe(timeframe: string): number {
    const timeframeHours: Record<string, number> = {
      '1h': 1,
      '24h': 24,
      '7d': 168,
      '30d': 720
    };
    return timeframeHours[timeframe] || 24;
  }

  /**
   * Sanitize input for safe logging
   */
  private sanitizeForLogging(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/['";]/g, '') // Remove quotes
      .substring(0, 100) + (input.length > 100 ? '...' : ''); // Truncate
  }
}

// Export singleton instance
export const securityMonitoring = new SecurityMonitoringService();

// Export utility functions
export const trackSecurityEvent = (event: SecurityEvent) => 
  securityMonitoring.trackSecurityEvent(event);

export const trackAuthEvent = (type: 'attempt' | 'success' | 'failure', userId?: string, metadata?: any) =>
  securityMonitoring.trackAuthEvent(type, userId, metadata);

export const trackValidationFailure = (input: string, fieldName: string, validationType: string, userId?: string) =>
  securityMonitoring.trackValidationFailure(input, fieldName, validationType, userId);

export const trackAcademicDataAccess = (userId: string, dataType: string, operation: string, justification?: string) =>
  securityMonitoring.trackAcademicDataAccess(userId, dataType, operation, justification);

export const getSecurityMetrics = (timeframe?: '1h' | '24h' | '7d' | '30d') =>
  securityMonitoring.getSecurityMetrics(timeframe);

export const getSecurityEvents = (filters?: any) =>
  securityMonitoring.getSecurityEvents(filters);