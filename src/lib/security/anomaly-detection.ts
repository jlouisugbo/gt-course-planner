/**
 * AUTHENTICATION ANOMALY DETECTION SERVICE
 * 
 * Advanced behavioral analysis and anomaly detection for authentication events.
 * Provides real-time threat assessment and automated response capabilities.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createAPILogger } from './logger';
import { trackSecurityEvent } from './monitoring';
// import { MONITORING_CONFIG } from './config';

export interface AuthenticationEvent {
  user_id: string;
  event_type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout';
  timestamp: string;
  ip_address: string;
  user_agent: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  device_fingerprint?: string;
  session_id?: string;
}

export interface AnomalyScore {
  overall_score: number; // 0-1 scale (1 = most suspicious)
  factors: {
    time_anomaly: number;
    location_anomaly: number;
    device_anomaly: number;
    frequency_anomaly: number;
    pattern_anomaly: number;
  };
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  recommendations: string[];
}

export interface UserBehaviorProfile {
  user_id: string;
  typical_login_hours: number[]; // Hours of day (0-23)
  typical_days: number[]; // Days of week (0-6)
  typical_locations: string[]; // IP address patterns
  typical_devices: string[]; // User agent patterns
  avg_session_duration: number; // Minutes
  login_frequency: number; // Logins per day
  last_updated: string;
  baseline_established: boolean;
}

class AuthenticationAnomalyDetector {
  private logger = createAPILogger('security', 'anomaly-detection');
  private behaviorCache = new Map<string, UserBehaviorProfile>();
  private recentEvents = new Map<string, AuthenticationEvent[]>();

  constructor() {
    // Clean cache every hour to prevent memory leaks
    setInterval(() => {
      this.cleanCache();
    }, 3600000); // 1 hour
  }

  /**
   * Analyze authentication event for anomalies
   */
  async analyzeAuthenticationEvent(event: AuthenticationEvent): Promise<AnomalyScore> {
    try {
      // Get or create user behavior profile
      const profile = await this.getUserBehaviorProfile(event.user_id);
      
      // Calculate anomaly scores for different factors
      const timeAnomaly = this.calculateTimeAnomaly(event, profile);
      const locationAnomaly = await this.calculateLocationAnomaly(event, profile);
      const deviceAnomaly = this.calculateDeviceAnomaly(event, profile);
      const frequencyAnomaly = await this.calculateFrequencyAnomaly(event, profile);
      const patternAnomaly = await this.calculatePatternAnomaly(event, profile);

      // Weighted overall score
      const overallScore = (
        timeAnomaly * 0.2 +
        locationAnomaly * 0.3 +
        deviceAnomaly * 0.2 +
        frequencyAnomaly * 0.15 +
        patternAnomaly * 0.15
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallScore);
      
      // Calculate confidence based on profile maturity
      const confidence = this.calculateConfidence(profile, overallScore);

      const anomalyScore: AnomalyScore = {
        overall_score: overallScore,
        factors: {
          time_anomaly: timeAnomaly,
          location_anomaly: locationAnomaly,
          device_anomaly: deviceAnomaly,
          frequency_anomaly: frequencyAnomaly,
          pattern_anomaly: patternAnomaly
        },
        risk_level: riskLevel,
        confidence,
        recommendations: this.generateRecommendations(overallScore, {
          time_anomaly: timeAnomaly,
          location_anomaly: locationAnomaly,
          device_anomaly: deviceAnomaly,
          frequency_anomaly: frequencyAnomaly,
          pattern_anomaly: patternAnomaly
        })
      };

      // Update behavior profile with new data
      await this.updateBehaviorProfile(event, profile);

      // Log significant anomalies
      if (overallScore > 0.7) {
        this.logger.warn('High authentication anomaly detected', {
          user_id: event.user_id,
          overall_score: overallScore,
          risk_level: riskLevel,
          factors: anomalyScore.factors
        });

        // Track as security event
        await trackSecurityEvent({
          event_type: 'suspicious_activity',
          severity: riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          user_id: event.user_id,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          data: {
            anomaly_score: overallScore,
            anomaly_factors: anomalyScore.factors,
            event_type: event.event_type
          }
        });
      }

      return anomalyScore;

    } catch {
      this.logger.error('Failed to analyze authentication anomaly', error);
      
      // Return safe default on error
      return {
        overall_score: 0,
        factors: {
          time_anomaly: 0,
          location_anomaly: 0,
          device_anomaly: 0,
          frequency_anomaly: 0,
          pattern_anomaly: 0
        },
        risk_level: 'LOW',
        confidence: 0,
        recommendations: []
      };
    }
  }

  /**
   * Calculate time-based anomaly score
   */
  private calculateTimeAnomaly(event: AuthenticationEvent, profile: UserBehaviorProfile): number {
    if (!profile.baseline_established) return 0;

    const eventTime = new Date(event.timestamp);
    const hour = eventTime.getHours();
    const day = eventTime.getDay();

    let timeScore = 0;

    // Check hour anomaly
    if (profile.typical_login_hours.length > 0) {
      const hourScore = profile.typical_login_hours.includes(hour) ? 0 : 1;
      timeScore += hourScore * 0.6;
    }

    // Check day anomaly
    if (profile.typical_days.length > 0) {
      const dayScore = profile.typical_days.includes(day) ? 0 : 0.5;
      timeScore += dayScore * 0.4;
    }

    return Math.min(timeScore, 1);
  }

  /**
   * Calculate location-based anomaly score
   */
  private async calculateLocationAnomaly(
    event: AuthenticationEvent, 
    profile: UserBehaviorProfile
  ): Promise<number> {
    if (!profile.baseline_established || !event.ip_address) return 0;

    // Simple IP-based location analysis
    // In production, you'd use a GeoIP service
    const ipPattern = this.getIPPattern(event.ip_address);
    
    // Check if this IP pattern has been seen before
    const isKnownLocation = profile.typical_locations.some(loc => 
      loc.includes(ipPattern.slice(0, -2)) // Match subnet
    );

    // Check for rapid location changes
    const recentLocations = await this.getRecentLocations(event.user_id, 30); // Last 30 minutes
    const uniqueLocations = new Set(recentLocations);
    
    let locationScore = 0;

    // Unknown location penalty
    if (!isKnownLocation) {
      locationScore += 0.7;
    }

    // Multiple locations in short time
    if (uniqueLocations.size > 2) {
      locationScore += 0.8;
    }

    return Math.min(locationScore, 1);
  }

  /**
   * Calculate device-based anomaly score
   */
  private calculateDeviceAnomaly(event: AuthenticationEvent, profile: UserBehaviorProfile): number {
    if (!profile.baseline_established || !event.user_agent) return 0;

    const deviceFingerprint = this.extractDeviceFingerprint(event.user_agent);
    
    // Check if device has been seen before
    const isKnownDevice = profile.typical_devices.some(device => 
      this.compareDeviceFingerprints(device, deviceFingerprint) > 0.8
    );

    return isKnownDevice ? 0 : 0.6;
  }

  /**
   * Calculate frequency-based anomaly score
   */
  private async calculateFrequencyAnomaly(
    event: AuthenticationEvent, 
    profile: UserBehaviorProfile
  ): Promise<number> {
    if (!profile.baseline_established) return 0;

    // Get login frequency for today
    const todaysLogins = await this.getTodaysLogins(event.user_id);
    
    // Compare to typical frequency
    const frequencyRatio = todaysLogins / (profile.login_frequency || 1);
    
    // Score based on deviation from normal
    if (frequencyRatio > 3) return 0.8; // Too many logins
    if (frequencyRatio < 0.1) return 0.3; // Too few logins (less concerning)
    
    return 0;
  }

  /**
   * Calculate pattern-based anomaly score
   */
  private async calculatePatternAnomaly(
    event: AuthenticationEvent, 
    _profile: UserBehaviorProfile
  ): Promise<number> {
    // Get recent events for pattern analysis
    const recentEvents = this.recentEvents.get(event.user_id) || [];
    
    let patternScore = 0;

    // Check for rapid successive failures
    const recentFailures = recentEvents.filter(e => 
      e.event_type === 'login_failure' && 
      new Date(event.timestamp).getTime() - new Date(e.timestamp).getTime() < 300000 // 5 minutes
    );

    if (recentFailures.length > 3) {
      patternScore += 0.8;
    }

    // Check for unusual login patterns (e.g., immediate logout)
    const quickLogouts = recentEvents.filter(e => 
      e.event_type === 'logout' && 
      new Date(event.timestamp).getTime() - new Date(e.timestamp).getTime() < 60000 // 1 minute
    );

    if (quickLogouts.length > 0) {
      patternScore += 0.4;
    }

    return Math.min(patternScore, 1);
  }

  /**
   * Get or create user behavior profile
   */
  private async getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    // Check cache first
    if (this.behaviorCache.has(userId)) {
      return this.behaviorCache.get(userId)!;
    }

    try {
      // Get profile from database
      const { data: profile } = await supabaseAdmin()
        .from('user_security_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile) {
        const behaviorProfile: UserBehaviorProfile = {
          user_id: userId,
          typical_login_hours: profile.typical_login_times || [],
          typical_days: [], // Would be extracted from historical data
          typical_locations: profile.typical_ip_ranges?.map(ip => ip.toString()) || [],
          typical_devices: profile.typical_user_agents || [],
          avg_session_duration: 60, // Default 1 hour
          login_frequency: 2, // Default 2 logins per day
          last_updated: profile.updated_at,
          baseline_established: profile.security_score !== null
        };

        this.behaviorCache.set(userId, behaviorProfile);
        return behaviorProfile;
      }
    } catch {
      this.logger.warn('Failed to get user behavior profile', error);
    }

    // Return default profile for new users
    const defaultProfile: UserBehaviorProfile = {
      user_id: userId,
      typical_login_hours: [],
      typical_days: [],
      typical_locations: [],
      typical_devices: [],
      avg_session_duration: 60,
      login_frequency: 2,
      last_updated: new Date().toISOString(),
      baseline_established: false
    };

    this.behaviorCache.set(userId, defaultProfile);
    return defaultProfile;
  }

  /**
   * Update behavior profile with new event data
   */
  private async updateBehaviorProfile(
    event: AuthenticationEvent, 
    profile: UserBehaviorProfile
  ): Promise<void> {
    try {
      if (event.event_type !== 'login_success') return;

      const eventTime = new Date(event.timestamp);
      const hour = eventTime.getHours();
      const day = eventTime.getDay();

      // Update typical hours
      if (!profile.typical_login_hours.includes(hour)) {
        profile.typical_login_hours.push(hour);
        profile.typical_login_hours = profile.typical_login_hours.slice(-10); // Keep last 10
      }

      // Update typical days
      if (!profile.typical_days.includes(day)) {
        profile.typical_days.push(day);
      }

      // Update typical locations
      if (event.ip_address) {
        const ipPattern = this.getIPPattern(event.ip_address);
        if (!profile.typical_locations.includes(ipPattern)) {
          profile.typical_locations.push(ipPattern);
          profile.typical_locations = profile.typical_locations.slice(-5); // Keep last 5
        }
      }

      // Update typical devices
      if (event.user_agent) {
        const deviceFingerprint = this.extractDeviceFingerprint(event.user_agent);
        if (!profile.typical_devices.some(d => 
          this.compareDeviceFingerprints(d, deviceFingerprint) > 0.8
        )) {
          profile.typical_devices.push(deviceFingerprint);
          profile.typical_devices = profile.typical_devices.slice(-3); // Keep last 3
        }
      }

      profile.baseline_established = true;
      profile.last_updated = new Date().toISOString();

      // Update cache
      this.behaviorCache.set(event.user_id, profile);

      // Update database
      await supabaseAdmin()
        .from('user_security_profiles')
        .upsert({
          user_id: event.user_id,
          typical_login_times: profile.typical_login_hours,
          typical_ip_ranges: profile.typical_locations,
          typical_user_agents: profile.typical_devices,
          updated_at: profile.last_updated
        });

    } catch {
      this.logger.error('Failed to update behavior profile', error);
    }
  }

  /**
   * Helper methods for anomaly detection
   */
  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.3) return 'MEDIUM';
    return 'LOW';
  }

  private calculateConfidence(profile: UserBehaviorProfile, score: number): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence with more baseline data
    if (profile.baseline_established) confidence += 0.3;
    if (profile.typical_login_hours.length >= 3) confidence += 0.1;
    if (profile.typical_locations.length >= 2) confidence += 0.1;

    // Decrease confidence for extreme scores (might be false positive)
    if (score > 0.9) confidence -= 0.2;

    return Math.min(Math.max(confidence, 0), 1);
  }

  private generateRecommendations(overallScore: number, factors: any): string[] {
    const recommendations: string[] = [];

    if (overallScore > 0.7) {
      recommendations.push('Require additional authentication verification');
      recommendations.push('Monitor this session closely for suspicious activity');
    }

    if (factors.location_anomaly > 0.6) {
      recommendations.push('Verify login from new location with user');
    }

    if (factors.device_anomaly > 0.5) {
      recommendations.push('Device verification recommended');
    }

    if (factors.frequency_anomaly > 0.6) {
      recommendations.push('Check for account compromise due to unusual login frequency');
    }

    if (factors.pattern_anomaly > 0.6) {
      recommendations.push('Investigate login patterns for potential brute force attack');
    }

    return recommendations;
  }

  private getIPPattern(ip: string): string {
    // Simple IP pattern extraction (first 3 octets for IPv4)
    const parts = ip.split('.');
    return parts.length >= 3 ? `${parts[0]}.${parts[1]}.${parts[2]}.*` : ip;
  }

  private extractDeviceFingerprint(userAgent: string): string {
    // Extract key device characteristics
    const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || 'Unknown';
    const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[1] || 'Unknown';
    
    return `${browser}/${os}`;
  }

  private compareDeviceFingerprints(device1: string, device2: string): number {
    // Simple similarity comparison
    return device1 === device2 ? 1 : 0;
  }

  private async getRecentLocations(userId: string, minutes: number): Promise<string[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    try {
      const { data: events } = await supabaseAdmin()
        .from('security_events')
        .select('ip_address')
        .eq('user_id', userId)
        .eq('event_type', 'auth_success')
        .gte('created_at', since);

      return events?.map(e => this.getIPPattern(e.ip_address)).filter(Boolean) || [];
    } catch {
      return [];
    }
  }

  private async getTodaysLogins(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const { data: events } = await supabaseAdmin()
        .from('security_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'auth_success')
        .gte('created_at', today.toISOString());

      return events?.length || 0;
    } catch {
      return 0;
    }
  }

  private cleanCache(): void {
    // Remove old cache entries to prevent memory leaks
    const maxCacheAge = 3600000; // 1 hour
    const now = Date.now();

    for (const [userId, profile] of this.behaviorCache.entries()) {
      const profileAge = now - new Date(profile.last_updated).getTime();
      if (profileAge > maxCacheAge) {
        this.behaviorCache.delete(userId);
      }
    }

    // Clean recent events cache
    for (const [userId, events] of this.recentEvents.entries()) {
      const recentEvents = events.filter(event => 
        now - new Date(event.timestamp).getTime() < 3600000 // Keep last hour
      );
      
      if (recentEvents.length === 0) {
        this.recentEvents.delete(userId);
      } else {
        this.recentEvents.set(userId, recentEvents);
      }
    }

    this.logger.info('Cleaned anomaly detection cache', {
      behavior_profiles: this.behaviorCache.size,
      recent_events: this.recentEvents.size
    });
  }

  /**
   * Add event to recent events cache for pattern analysis
   */
  addEventToCache(event: AuthenticationEvent): void {
    const userEvents = this.recentEvents.get(event.user_id) || [];
    userEvents.push(event);
    
    // Keep only recent events (last hour)
    const oneHourAgo = Date.now() - 3600000;
    const filteredEvents = userEvents.filter(e => 
      new Date(e.timestamp).getTime() > oneHourAgo
    );

    this.recentEvents.set(event.user_id, filteredEvents.slice(-20)); // Keep last 20 events
  }
}

// Export singleton instance
export const anomalyDetector = new AuthenticationAnomalyDetector();

// Export utility functions
export const analyzeAuthenticationEvent = (event: AuthenticationEvent) =>
  anomalyDetector.analyzeAuthenticationEvent(event);

export const addAuthEventToCache = (event: AuthenticationEvent) =>
  anomalyDetector.addEventToCache(event);