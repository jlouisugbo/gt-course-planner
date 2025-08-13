/**
 * AUTOMATED SECURITY ALERTING SYSTEM
 * 
 * Real-time security alerting with multiple notification channels,
 * alert correlation, and intelligent noise reduction.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createAPILogger } from './logger';
import { SecurityEvent, SecuritySeverity } from './monitoring';
// import { MONITORING_CONFIG } from './config';

export interface SecurityAlert {
  id?: string;
  alert_type: AlertType;
  severity: SecuritySeverity;
  title: string;
  description: string;
  source_events: string[];
  metadata: any;
  status: AlertStatus;
  assigned_to?: string;
  created_at?: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

export type AlertType = 
  | 'brute_force_attack'
  | 'suspicious_login_pattern'
  | 'ferpa_violation'
  | 'system_compromise'
  | 'data_breach_attempt'
  | 'service_degradation'
  | 'compliance_violation'
  | 'anomaly_detected'
  | 'rate_limit_exceeded'
  | 'critical_system_error';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'false_positive';

export interface AlertChannel {
  type: 'email' | 'webhook' | 'sms' | 'slack' | 'teams';
  config: any;
  enabled: boolean;
  severity_filter: SecuritySeverity[];
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  cooldown_minutes: number;
  last_triggered?: string;
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
  timeframe_minutes?: number;
}

export interface AlertAction {
  type: 'notify' | 'block_user' | 'block_ip' | 'escalate' | 'auto_resolve';
  config: any;
}

class SecurityAlertingService {
  private logger = createAPILogger('security', 'alerting');
  private alertChannels: AlertChannel[] = [];
  private alertRules: AlertRule[] = [];
  private alertCache = new Map<string, SecurityAlert>();
  private cooldownTracker = new Map<string, number>();

  constructor() {
    this.initializeAlertChannels();
    this.initializeAlertRules();
  }

  /**
   * Process security event and check for alert conditions
   */
  async processSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Check all alert rules against this event
      for (const rule of this.alertRules) {
        if (!rule.enabled) continue;

        const shouldTrigger = await this.evaluateAlertRule(rule, event);
        if (shouldTrigger) {
          await this.triggerAlert(rule, [event]);
        }
      }

      // Check for correlated events that might create compound alerts
      await this.checkCorrelatedEvents(event);

    } catch (error) {
      this.logger.error('Failed to process security event for alerting', error);
    }
  }

  /**
   * Create and send security alert
   */
  async createAlert(alert: Omit<SecurityAlert, 'id' | 'created_at'>): Promise<string> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newAlert: SecurityAlert = {
        ...alert,
        id: alertId,
        created_at: new Date().toISOString()
      };

      // Store alert in database
      await this.storeAlert(newAlert);

      // Send notifications through configured channels
      await this.sendNotifications(newAlert);

      // Cache alert for correlation
      this.alertCache.set(alertId, newAlert);

      this.logger.info('Security alert created and sent', {
        alert_id: alertId,
        alert_type: alert.alert_type,
        severity: alert.severity
      });

      return alertId;

    } catch (error) {
      this.logger.error('Failed to create security alert', error);
      throw error;
    }
  }

  /**
   * Acknowledge security alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      const alert = await this.getAlert(alertId);
      if (!alert) throw new Error('Alert not found');

      await supabaseAdmin()
        .from('security_alerts')
        .update({
          status: 'acknowledged',
          assigned_to: acknowledgedBy,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      this.logger.info('Security alert acknowledged', {
        alert_id: alertId,
        acknowledged_by: acknowledgedBy
      });

    } catch (error) {
      this.logger.error('Failed to acknowledge security alert', error);
      throw error;
    }
  }

  /**
   * Resolve security alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, resolution: string): Promise<void> {
    try {
      const alert = await this.getAlert(alertId);
      if (!alert) throw new Error('Alert not found');

      await supabaseAdmin()
        .from('security_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          metadata: {
            ...alert.metadata,
            resolution,
            resolved_by: resolvedBy
          }
        })
        .eq('id', alertId);

      // Remove from cache
      this.alertCache.delete(alertId);

      this.logger.info('Security alert resolved', {
        alert_id: alertId,
        resolved_by: resolvedBy
      });

    } catch (error) {
      this.logger.error('Failed to resolve security alert', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(filters?: {
    severity?: SecuritySeverity;
    alert_type?: AlertType;
    limit?: number;
  }): Promise<SecurityAlert[]> {
    try {
      let query = supabaseAdmin()
        .from('security_alerts')
        .select('*')
        .in('status', ['active', 'acknowledged'])
        .order('created_at', { ascending: false });

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.alert_type) {
        query = query.eq('alert_type', filters.alert_type);
      }

      const { data, error } = await query.limit(filters?.limit || 50);
      
      if (error) throw error;
      return data || [];

    } catch (error) {
      this.logger.error('Failed to get active alerts', error);
      return [];
    }
  }

  /**
   * Get alert statistics for dashboard
   */
  async getAlertStats(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    total: number;
    by_severity: Record<SecuritySeverity, number>;
    by_type: Record<string, number>;
    active: number;
    resolved: number;
    false_positives: number;
  }> {
    try {
      const hoursBack = this.getHoursFromTimeframe(timeframe);
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      const { data: alerts, error } = await supabaseAdmin()
        .from('security_alerts')
        .select('severity, alert_type, status')
        .gte('created_at', since);

      if (error) throw error;

      const stats = {
        total: alerts?.length || 0,
        by_severity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        by_type: {} as Record<string, number>,
        active: 0,
        resolved: 0,
        false_positives: 0
      };

      alerts?.forEach(alert => {
        stats.by_severity[alert.severity as SecuritySeverity]++;
        stats.by_type[alert.alert_type] = (stats.by_type[alert.alert_type] || 0) + 1;
        
        if (alert.status === 'active' || alert.status === 'acknowledged') {
          stats.active++;
        } else if (alert.status === 'resolved') {
          stats.resolved++;
        } else if (alert.status === 'false_positive') {
          stats.false_positives++;
        }
      });

      return stats;

    } catch (error) {
      this.logger.error('Failed to get alert statistics', error);
      return {
        total: 0,
        by_severity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        by_type: {},
        active: 0,
        resolved: 0,
        false_positives: 0
      };
    }
  }

  /**
   * Initialize built-in alert rules
   */
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'brute_force_detection',
        name: 'Brute Force Attack Detection',
        description: 'Detects repeated failed login attempts',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'auth_failure'
          }
        ],
        actions: [
          {
            type: 'notify',
            config: { severity: 'HIGH', channels: ['email', 'slack'] }
          },
          {
            type: 'block_user',
            config: { duration_minutes: 30 }
          }
        ],
        enabled: true,
        cooldown_minutes: 15
      },
      {
        id: 'ferpa_violation_alert',
        name: 'FERPA Compliance Violation',
        description: 'Alerts on potential FERPA violations',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'ferpa_violation'
          }
        ],
        actions: [
          {
            type: 'notify',
            config: { severity: 'CRITICAL', channels: ['email', 'sms'] }
          },
          {
            type: 'escalate',
            config: { escalate_to: 'compliance_team' }
          }
        ],
        enabled: true,
        cooldown_minutes: 5
      },
      {
        id: 'critical_security_event',
        name: 'Critical Security Event',
        description: 'Immediate notification for critical events',
        conditions: [
          {
            field: 'severity',
            operator: 'equals',
            value: 'CRITICAL'
          }
        ],
        actions: [
          {
            type: 'notify',
            config: { severity: 'CRITICAL', channels: ['email', 'sms', 'slack'] }
          }
        ],
        enabled: true,
        cooldown_minutes: 1
      },
      {
        id: 'sql_injection_attempt',
        name: 'SQL Injection Attack',
        description: 'Detects SQL injection attempts',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'sql_injection_attempt'
          }
        ],
        actions: [
          {
            type: 'notify',
            config: { severity: 'HIGH', channels: ['email', 'slack'] }
          },
          {
            type: 'block_ip',
            config: { duration_minutes: 60 }
          }
        ],
        enabled: true,
        cooldown_minutes: 10
      }
    ];
  }

  /**
   * Initialize alert notification channels
   */
  private initializeAlertChannels(): void {
    // In production, these would be configured via environment variables
    this.alertChannels = [
      {
        type: 'email',
        config: {
          smtp_server: process.env.SMTP_SERVER || 'localhost',
          recipients: process.env.SECURITY_ALERT_EMAILS?.split(',') || ['admin@gatech.edu']
        },
        enabled: !!process.env.SMTP_SERVER,
        severity_filter: ['MEDIUM', 'HIGH', 'CRITICAL']
      },
      {
        type: 'webhook',
        config: {
          url: process.env.SECURITY_WEBHOOK_URL,
          headers: {
            'Authorization': `Bearer ${process.env.SECURITY_WEBHOOK_TOKEN}`
          }
        },
        enabled: !!process.env.SECURITY_WEBHOOK_URL,
        severity_filter: ['HIGH', 'CRITICAL']
      },
      {
        type: 'slack',
        config: {
          webhook_url: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_SECURITY_CHANNEL || '#security-alerts'
        },
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        severity_filter: ['HIGH', 'CRITICAL']
      }
    ];
  }

  /**
   * Evaluate if an alert rule should trigger
   */
  private async evaluateAlertRule(rule: AlertRule, event: SecurityEvent): Promise<boolean> {
    try {
      // Check cooldown
      const lastTriggered = this.cooldownTracker.get(rule.id);
      const now = Date.now();
      if (lastTriggered && now - lastTriggered < rule.cooldown_minutes * 60 * 1000) {
        return false;
      }

      // Evaluate all conditions
      for (const condition of rule.conditions) {
        if (!this.evaluateCondition(condition, event)) {
          return false;
        }
      }

      // Check additional conditions based on timeframe
      if (rule.conditions.some(c => c.timeframe_minutes)) {
        const timeframeMatch = await this.checkTimeframeConditions(rule, event);
        if (!timeframeMatch) return false;
      }

      return true;

    } catch (error) {
      this.logger.error('Failed to evaluate alert rule', error);
      return false;
    }
  }

  /**
   * Evaluate a single condition against an event
   */
  private evaluateCondition(condition: AlertCondition, event: SecurityEvent): boolean {
    const eventValue = this.getEventFieldValue(event, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return eventValue === condition.value;
      case 'contains':
        return String(eventValue).includes(String(condition.value));
      case 'greater_than':
        return Number(eventValue) > Number(condition.value);
      case 'less_than':
        return Number(eventValue) < Number(condition.value);
      case 'in_range':
        const [min, max] = condition.value;
        const numValue = Number(eventValue);
        return numValue >= min && numValue <= max;
      default:
        return false;
    }
  }

  /**
   * Check timeframe-based conditions
   */
  private async checkTimeframeConditions(rule: AlertRule, event: SecurityEvent): Promise<boolean> {
    try {
      const timeframeCondition = rule.conditions.find(c => c.timeframe_minutes);
      if (!timeframeCondition) return true;

      const since = new Date(Date.now() - timeframeCondition.timeframe_minutes! * 60 * 1000).toISOString();
      
      // Get related events in timeframe
      const { data: relatedEvents } = await supabaseAdmin()
        .from('security_events')
        .select('*')
        .gte('created_at', since)
        .eq('event_type', event.event_type);

      if (!relatedEvents) return false;

      // Example: Check if we have more than X events of the same type
      return relatedEvents.length >= 5; // Configurable threshold

    } catch (error) {
      this.logger.error('Failed to check timeframe conditions', error);
      return false;
    }
  }

  /**
   * Trigger alert and execute actions
   */
  private async triggerAlert(rule: AlertRule, events: SecurityEvent[]): Promise<void> {
    try {
      // Update cooldown
      this.cooldownTracker.set(rule.id, Date.now());

      // Create alert
      const alert: Omit<SecurityAlert, 'id' | 'created_at'> = {
        alert_type: this.determineAlertType(rule, events),
        severity: this.determineSeverity(rule, events),
        title: rule.name,
        description: this.generateAlertDescription(rule, events),
        source_events: events.map(e => e.id!).filter(Boolean),
        metadata: {
          rule_id: rule.id,
          rule_name: rule.name,
          event_count: events.length
        },
        status: 'active'
      };

      const alertId = await this.createAlert(alert);

      // Execute rule actions
      for (const action of rule.actions) {
        await this.executeAlertAction(action, alert, events);
      }

      this.logger.info('Alert rule triggered', {
        rule_id: rule.id,
        alert_id: alertId,
        event_count: events.length
      });

    } catch (error) {
      this.logger.error('Failed to trigger alert', error);
    }
  }

  /**
   * Execute alert action
   */
  private async executeAlertAction(
    action: AlertAction, 
    alert: SecurityAlert, 
    events: SecurityEvent[]
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'notify':
          // Already handled in createAlert
          break;
          
        case 'block_user':
          if (events[0].user_id) {
            await this.blockUser(events[0].user_id, action.config.duration_minutes);
          }
          break;
          
        case 'block_ip':
          if (events[0].ip_address) {
            await this.blockIP(events[0].ip_address, action.config.duration_minutes);
          }
          break;
          
        case 'escalate':
          await this.escalateAlert(alert, action.config);
          break;
          
        case 'auto_resolve':
          // Would implement auto-resolution logic
          break;
      }
    } catch (error) {
      this.logger.error('Failed to execute alert action', error);
    }
  }

  /**
   * Send notifications through configured channels
   */
  private async sendNotifications(alert: SecurityAlert): Promise<void> {
    const enabledChannels = this.alertChannels.filter(channel => 
      channel.enabled && 
      channel.severity_filter.includes(alert.severity)
    );

    for (const channel of enabledChannels) {
      try {
        await this.sendNotificationToChannel(channel, alert);
      } catch (error) {
        this.logger.error(`Failed to send notification to ${channel.type}`, error);
      }
    }
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotificationToChannel(channel: AlertChannel, alert: SecurityAlert): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel.config, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel.config, alert);
        break;
      case 'slack':
        await this.sendSlackNotification(channel.config, alert);
        break;
      // Add more channel types as needed
    }
  }

  /**
   * Helper methods for specific notification channels
   */
  private async sendEmailNotification(config: any, alert: SecurityAlert): Promise<void> {
    // In production, integrate with email service (SendGrid, SES, etc.)
    this.logger.info('Email notification sent (simulated)', {
      alert_id: alert.id,
      severity: alert.severity,
      recipients: config.recipients
    });
  }

  private async sendWebhookNotification(config: any, alert: SecurityAlert): Promise<void> {
    try {
      await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify({
          alert_id: alert.id,
          alert_type: alert.alert_type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          created_at: alert.created_at
        })
      });
    } catch (error) {
      throw new Error(`Webhook notification failed: ${error}`);
    }
  }

  private async sendSlackNotification(config: any, alert: SecurityAlert): Promise<void> {
    const color = this.getSeverityColor(alert.severity);
    const payload = {
      channel: config.channel,
      username: 'Security Alert Bot',
      attachments: [{
        color,
        title: alert.title,
        text: alert.description,
        fields: [
          {
            title: 'Severity',
            value: alert.severity,
            short: true
          },
          {
            title: 'Type',
            value: alert.alert_type,
            short: true
          }
        ],
        timestamp: Math.floor(new Date(alert.created_at!).getTime() / 1000)
      }]
    };

    try {
      await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      throw new Error(`Slack notification failed: ${error}`);
    }
  }

  /**
   * Helper methods
   */
  private getSeverityColor(severity: SecuritySeverity): string {
    const colors = {
      LOW: 'good',
      MEDIUM: 'warning',
      HIGH: 'danger',
      CRITICAL: 'danger'
    };
    return colors[severity] || 'good';
  }

  private getEventFieldValue(event: SecurityEvent, field: string): any {
    return (event as any)[field] || event.data?.[field];
  }

  private determineAlertType(rule: AlertRule, _events: SecurityEvent[]): AlertType {
    // Logic to determine alert type based on rule and events
    if (rule.id.includes('brute_force')) return 'brute_force_attack';
    if (rule.id.includes('ferpa')) return 'ferpa_violation';
    if (rule.id.includes('sql_injection')) return 'system_compromise';
    return 'anomaly_detected';
  }

  private determineSeverity(rule: AlertRule, events: SecurityEvent[]): SecuritySeverity {
    // Use highest severity from events or rule configuration
    const eventSeverities = events.map(e => e.severity);
    const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    
    return eventSeverities.reduce((highest, current) => {
      return severityOrder.indexOf(current) > severityOrder.indexOf(highest) ? current : highest;
    }, 'LOW');
  }

  private generateAlertDescription(rule: AlertRule, events: SecurityEvent[]): string {
    return `${rule.description}. ${events.length} related event(s) detected.`;
  }

  private async storeAlert(alert: SecurityAlert): Promise<void> {
    const { error } = await supabaseAdmin()
      .from('security_alerts')
      .insert([alert]);

    if (error) throw error;
  }

  private async getAlert(alertId: string): Promise<SecurityAlert | null> {
    const { data, error } = await supabaseAdmin()
      .from('security_alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (error) return null;
    return data;
  }

  private async blockUser(userId: string, durationMinutes: number): Promise<void> {
    // Implement user blocking logic
    this.logger.info('User blocked (simulated)', { user_id: userId, duration: durationMinutes });
  }

  private async blockIP(ipAddress: string, durationMinutes: number): Promise<void> {
    // Implement IP blocking logic
    await supabaseAdmin()
      .from('suspicious_ips')
      .upsert({
        ip_address: ipAddress,
        threat_level: 'HIGH',
        auto_blocked: true,
        blocked_until: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
        notes: 'Automatically blocked due to security alert'
      });
  }

  private async escalateAlert(alert: SecurityAlert, config: any): Promise<void> {
    // Implement alert escalation logic
    this.logger.info('Alert escalated (simulated)', { alert_id: alert.id, escalate_to: config.escalate_to });
  }

  private async checkCorrelatedEvents(_event: SecurityEvent): Promise<void> {
    // Check for patterns across multiple events that might require compound alerts
    // This would implement more sophisticated correlation logic
  }

  private getHoursFromTimeframe(timeframe: string): number {
    const timeframeHours: Record<string, number> = {
      '1h': 1,
      '24h': 24,
      '7d': 168,
      '30d': 720
    };
    return timeframeHours[timeframe] || 24;
  }
}

// Export singleton instance
export const securityAlerting = new SecurityAlertingService();

// Export utility functions
export const processSecurityEventForAlerts = (event: SecurityEvent) =>
  securityAlerting.processSecurityEvent(event);

export const createSecurityAlert = (alert: Omit<SecurityAlert, 'id' | 'created_at'>) =>
  securityAlerting.createAlert(alert);

export const getActiveSecurityAlerts = (filters?: any) =>
  securityAlerting.getActiveAlerts(filters);

export const getAlertStatistics = (timeframe?: '1h' | '24h' | '7d' | '30d') =>
  securityAlerting.getAlertStats(timeframe);