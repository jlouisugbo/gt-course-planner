/**
 * SECURITY HEALTH SCORING AND COMPLIANCE MONITORING
 * 
 * Advanced security posture assessment with automated compliance
 * monitoring, predictive analytics, and actionable recommendations.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createAPILogger } from './logger';
import { getSecurityMetrics, SecurityMetrics } from './monitoring';
import { getAlertStatistics } from './alerting';

export interface SecurityHealthScore {
  overall_score: number; // 0-100
  last_calculated: string;
  trend: 'improving' | 'declining' | 'stable';
  components: {
    authentication: HealthComponent;
    threat_detection: HealthComponent;
    compliance: HealthComponent;
    system_integrity: HealthComponent;
    user_behavior: HealthComponent;
    data_protection: HealthComponent;
  };
  risk_factors: RiskFactor[];
  recommendations: SecurityRecommendation[];
  compliance_status: ComplianceStatus;
  predictive_insights: PredictiveInsight[];
}

export interface HealthComponent {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  weight: number; // Importance weight in overall score
  metrics: ComponentMetric[];
  last_incident?: string;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ComponentMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
}

export interface RiskFactor {
  id: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact_score: number;
  likelihood: number;
  mitigation_status: 'open' | 'in_progress' | 'mitigated';
  first_detected: string;
  last_updated: string;
}

export interface SecurityRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation_steps: string[];
  expected_improvement: number; // Expected score improvement
  deadline?: string;
  status: 'open' | 'planned' | 'in_progress' | 'completed' | 'dismissed';
}

export interface ComplianceStatus {
  ferpa: ComplianceFramework;
  gdpr: ComplianceFramework;
  sox: ComplianceFramework;
  custom: ComplianceFramework[];
}

export interface ComplianceFramework {
  name: string;
  score: number; // 0-100
  status: 'compliant' | 'partial' | 'non_compliant';
  requirements: ComplianceRequirement[];
  last_audit: string;
  next_audit?: string;
  violations: ComplianceViolation[];
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  status: 'met' | 'partial' | 'not_met';
  evidence: string[];
  last_verified: string;
}

export interface ComplianceViolation {
  id: string;
  requirement_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected_at: string;
  resolved_at?: string;
  remediation_plan?: string;
}

export interface PredictiveInsight {
  type: 'risk_prediction' | 'trend_analysis' | 'anomaly_forecast' | 'compliance_alert';
  confidence: number; // 0-1
  description: string;
  predicted_date?: string;
  impact_assessment: string;
  preventive_actions: string[];
}

class SecurityHealthService {
  private logger = createAPILogger('security', 'health-scoring');
  private healthCache = new Map<string, SecurityHealthScore>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor() {
    // Schedule regular health calculations
    setInterval(() => {
      this.calculateHealthScore().catch(error => {
        this.logger.error('Scheduled health calculation failed', error);
      });
    }, 600000); // 10 minutes
  }

  /**
   * Calculate comprehensive security health score
   */
  async calculateHealthScore(useCache: boolean = true): Promise<SecurityHealthScore> {
    try {
      const cacheKey = 'current_health_score';
      
      if (useCache && this.healthCache.has(cacheKey)) {
        const cached = this.healthCache.get(cacheKey)!;
        const age = Date.now() - new Date(cached.last_calculated).getTime();
        if (age < this.CACHE_TTL) {
          return cached;
        }
      }

      this.logger.info('Calculating security health score');

      // Gather data from various sources
      const [
        securityMetrics24h,
        securityMetrics7d,
        alertStats,
        complianceData
      ] = await Promise.all([
        getSecurityMetrics('24h'),
        getSecurityMetrics('7d'),
        getAlertStatistics('24h'),
        this.getComplianceData()
      ]);

      // Calculate component scores
      const components = {
        authentication: await this.calculateAuthenticationHealth(securityMetrics24h, securityMetrics7d),
        threat_detection: await this.calculateThreatDetectionHealth(securityMetrics24h, alertStats),
        compliance: await this.calculateComplianceHealth(complianceData),
        system_integrity: await this.calculateSystemIntegrityHealth(securityMetrics24h),
        user_behavior: await this.calculateUserBehaviorHealth(securityMetrics24h),
        data_protection: await this.calculateDataProtectionHealth(complianceData)
      };

      // Calculate overall score
      const overallScore = this.calculateOverallScore(components);

      // Determine trend
      const trend = await this.calculateTrend(overallScore);

      // Generate risk factors
      const riskFactors = await this.identifyRiskFactors(components, securityMetrics24h);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(components, riskFactors);

      // Get compliance status
      const complianceStatus = await this.getDetailedComplianceStatus();

      // Generate predictive insights
      const predictiveInsights = await this.generatePredictiveInsights(components, securityMetrics7d);

      const healthScore: SecurityHealthScore = {
        overall_score: overallScore,
        last_calculated: new Date().toISOString(),
        trend,
        components,
        risk_factors: riskFactors,
        recommendations,
        compliance_status: complianceStatus,
        predictive_insights: predictiveInsights
      };

      // Cache the result
      this.healthCache.set(cacheKey, healthScore);

      // Store in database for historical tracking
      await this.storeHealthScore(healthScore);

      this.logger.info('Security health score calculated', {
        overall_score: overallScore,
        trend,
        risk_factors: riskFactors.length,
        recommendations: recommendations.length
      });

      return healthScore;

    } catch (error) {
      this.logger.error('Failed to calculate security health score', error);
      throw error;
    }
  }

  /**
   * Get health score history for trend analysis
   */
  async getHealthScoreHistory(days: number = 30): Promise<Array<{
    date: string;
    overall_score: number;
    component_scores: Record<string, number>;
  }>> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabaseAdmin()
        .from('security_health_history')
        .select('*')
        .gte('calculated_at', since)
        .order('calculated_at', { ascending: true });

      if (error) throw error;

      return data?.map(record => ({
        date: record.calculated_at,
        overall_score: record.overall_score,
        component_scores: record.component_scores || {}
      })) || [];

    } catch (error) {
      this.logger.error('Failed to get health score history', error);
      return [];
    }
  }

  /**
   * Get security recommendations prioritized by impact
   */
  async getSecurityRecommendations(filters?: {
    priority?: string;
    category?: string;
    status?: string;
  }): Promise<SecurityRecommendation[]> {
    try {
      const healthScore = await this.calculateHealthScore();
      let recommendations = healthScore.recommendations;

      if (filters) {
        if (filters.priority) {
          recommendations = recommendations.filter(r => r.priority === filters.priority);
        }
        if (filters.category) {
          recommendations = recommendations.filter(r => r.category === filters.category);
        }
        if (filters.status) {
          recommendations = recommendations.filter(r => r.status === filters.status);
        }
      }

      // Sort by priority and expected improvement
      return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.expected_improvement - a.expected_improvement;
      });

    } catch (error) {
      this.logger.error('Failed to get security recommendations', error);
      return [];
    }
  }

  /**
   * Calculate authentication health score
   */
  private async calculateAuthenticationHealth(
    metrics24h: SecurityMetrics,
    metrics7d: SecurityMetrics
  ): Promise<HealthComponent> {
    const authFailureRate = metrics24h.authFailures / Math.max(metrics24h.totalEvents, 1);
    const weeklyTrend = metrics7d.authFailures > metrics24h.authFailures ? 'declining' : 'improving';
    
    let score = 100;
    
    // Penalize high failure rates
    score -= authFailureRate * 100 * 0.5; // Max 50% penalty for 100% failure rate
    
    // Penalize brute force attempts
    const bruteForceAttempts = metrics24h.topThreats
      .filter(t => t.type.includes('brute_force'))
      .reduce((sum, t) => sum + t.count, 0);
    score -= Math.min(bruteForceAttempts * 5, 30); // Max 30 point penalty
    
    score = Math.max(score, 0);

    const metrics: ComponentMetric[] = [
      {
        name: 'Authentication Failure Rate',
        value: authFailureRate * 100,
        target: 5,
        unit: '%',
        status: authFailureRate > 0.1 ? 'critical' : authFailureRate > 0.05 ? 'warning' : 'healthy'
      },
      {
        name: 'Brute Force Attempts',
        value: bruteForceAttempts,
        target: 0,
        unit: 'attempts',
        status: bruteForceAttempts > 10 ? 'critical' : bruteForceAttempts > 0 ? 'warning' : 'healthy'
      }
    ];

    return {
      score: Math.round(score),
      status: this.getHealthStatus(score),
      weight: 0.25,
      metrics,
      trend: weeklyTrend
    };
  }

  /**
   * Calculate threat detection health score
   */
  private async calculateThreatDetectionHealth(
    metrics: SecurityMetrics,
    alertStats: any
  ): Promise<HealthComponent> {
    let score = 100;

    // Factor in critical events
    score -= metrics.criticalEvents * 15; // 15 points per critical event

    // Factor in alert resolution rate
    const resolutionRate = alertStats.resolved / Math.max(alertStats.total, 1);
    score -= (1 - resolutionRate) * 20; // Up to 20 points for poor resolution

    // Factor in false positive rate
    const falsePositiveRate = alertStats.false_positives / Math.max(alertStats.total, 1);
    score -= falsePositiveRate * 15; // Up to 15 points for high false positives

    score = Math.max(score, 0);

    const metrics_array: ComponentMetric[] = [
      {
        name: 'Critical Events',
        value: metrics.criticalEvents,
        target: 0,
        unit: 'events',
        status: metrics.criticalEvents > 5 ? 'critical' : metrics.criticalEvents > 0 ? 'warning' : 'healthy'
      },
      {
        name: 'Alert Resolution Rate',
        value: resolutionRate * 100,
        target: 95,
        unit: '%',
        status: resolutionRate < 0.8 ? 'critical' : resolutionRate < 0.9 ? 'warning' : 'healthy'
      }
    ];

    return {
      score: Math.round(score),
      status: this.getHealthStatus(score),
      weight: 0.3,
      metrics: metrics_array,
      trend: 'stable' // Would calculate from historical data
    };
  }

  /**
   * Calculate compliance health score
   */
  private async calculateComplianceHealth(complianceData: any): Promise<HealthComponent> {
    const ferpaScore = complianceData?.ferpa?.score || 0;
    const gdprScore = complianceData?.gdpr?.score || 0;
    
    // Weighted average of compliance frameworks
    const score = (ferpaScore * 0.7) + (gdprScore * 0.3); // FERPA more important for academic system

    const metrics: ComponentMetric[] = [
      {
        name: 'FERPA Compliance',
        value: ferpaScore,
        target: 95,
        unit: '%',
        status: ferpaScore < 85 ? 'critical' : ferpaScore < 95 ? 'warning' : 'healthy'
      },
      {
        name: 'Data Protection',
        value: gdprScore,
        target: 90,
        unit: '%',
        status: gdprScore < 80 ? 'critical' : gdprScore < 90 ? 'warning' : 'healthy'
      }
    ];

    return {
      score: Math.round(score),
      status: this.getHealthStatus(score),
      weight: 0.2,
      metrics,
      trend: 'stable'
    };
  }

  /**
   * Calculate system integrity health score
   */
  private async calculateSystemIntegrityHealth(metrics: SecurityMetrics): Promise<HealthComponent> {
    let score = 100;

    // Factor in rate limiting hits (could indicate attacks)
    score -= Math.min(metrics.rateLimit * 0.5, 25); // Max 25 point penalty

    // Factor in suspicious activities
    score -= Math.min(metrics.suspiciousActivities * 3, 30); // Max 30 point penalty

    score = Math.max(score, 0);

    const metrics_array: ComponentMetric[] = [
      {
        name: 'Rate Limit Violations',
        value: metrics.rateLimit,
        target: 10,
        unit: 'violations',
        status: metrics.rateLimit > 50 ? 'critical' : metrics.rateLimit > 20 ? 'warning' : 'healthy'
      },
      {
        name: 'Suspicious Activities',
        value: metrics.suspiciousActivities,
        target: 0,
        unit: 'activities',
        status: metrics.suspiciousActivities > 5 ? 'critical' : metrics.suspiciousActivities > 0 ? 'warning' : 'healthy'
      }
    ];

    return {
      score: Math.round(score),
      status: this.getHealthStatus(score),
      weight: 0.15,
      metrics: metrics_array,
      trend: 'stable'
    };
  }

  /**
   * Calculate user behavior health score
   */
  private async calculateUserBehaviorHealth(metrics: SecurityMetrics): Promise<HealthComponent> {
    // This would analyze user behavior patterns
    // For now, use a simplified calculation based on anomalies
    
    let score = 100;
    
    // Simple heuristic based on auth failures and suspicious activities
    const anomalyIndicator = (metrics.authFailures + metrics.suspiciousActivities) / Math.max(metrics.totalEvents, 1);
    score -= anomalyIndicator * 100 * 0.3;
    
    score = Math.max(score, 0);

    const metrics_array: ComponentMetric[] = [
      {
        name: 'Behavioral Anomalies',
        value: anomalyIndicator * 100,
        target: 5,
        unit: '%',
        status: anomalyIndicator > 0.1 ? 'critical' : anomalyIndicator > 0.05 ? 'warning' : 'healthy'
      }
    ];

    return {
      score: Math.round(score),
      status: this.getHealthStatus(score),
      weight: 0.1,
      metrics: metrics_array,
      trend: 'stable'
    };
  }

  /**
   * Calculate data protection health score
   */
  private async calculateDataProtectionHealth(complianceData: any): Promise<HealthComponent> {
    // Based on FERPA violations and data access patterns
    let score = 100;
    
    const ferpaViolations = complianceData?.ferpa?.violations?.length || 0;
    score -= ferpaViolations * 10; // 10 points per violation
    
    score = Math.max(score, 0);

    const metrics_array: ComponentMetric[] = [
      {
        name: 'FERPA Violations',
        value: ferpaViolations,
        target: 0,
        unit: 'violations',
        status: ferpaViolations > 3 ? 'critical' : ferpaViolations > 0 ? 'warning' : 'healthy'
      }
    ];

    return {
      score: Math.round(score),
      status: this.getHealthStatus(score),
      weight: 0.15,
      metrics: metrics_array,
      trend: 'stable'
    };
  }

  /**
   * Calculate overall score from component scores
   */
  private calculateOverallScore(components: Record<string, HealthComponent>): number {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.values(components).forEach(component => {
      weightedSum += component.score * component.weight;
      totalWeight += component.weight;
    });

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Determine health status from score
   */
  private getHealthStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 60) return 'poor';
    return 'critical';
  }

  /**
   * Calculate trend from historical data
   */
  private async calculateTrend(_currentScore: number): Promise<'improving' | 'declining' | 'stable'> {
    try {
      const history = await this.getHealthScoreHistory(7);
      if (history.length < 3) return 'stable';

      const recentAvg = history.slice(-3).reduce((sum, h) => sum + h.overall_score, 0) / 3;
      const olderAvg = history.slice(-6, -3).reduce((sum, h) => sum + h.overall_score, 0) / 3;

      const diff = recentAvg - olderAvg;
      if (Math.abs(diff) < 2) return 'stable';
      return diff > 0 ? 'improving' : 'declining';

    } catch {
      return 'stable';
    }
  }

  /**
   * Identify risk factors from component analysis
   */
  private async identifyRiskFactors(
    components: Record<string, HealthComponent>,
    metrics: SecurityMetrics
  ): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = [];

    // High authentication failures
    if (components.authentication.score < 70) {
      riskFactors.push({
        id: 'auth_high_failure_rate',
        category: 'Authentication',
        description: 'High authentication failure rate indicates potential brute force attacks',
        severity: 'high',
        impact_score: 80,
        likelihood: 0.7,
        mitigation_status: 'open',
        first_detected: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });
    }

    // FERPA compliance issues
    if (components.compliance.score < 85) {
      riskFactors.push({
        id: 'ferpa_compliance_risk',
        category: 'Compliance',
        description: 'FERPA compliance issues may result in regulatory violations',
        severity: 'critical',
        impact_score: 95,
        likelihood: 0.5,
        mitigation_status: 'open',
        first_detected: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });
    }

    // Critical security events
    if (metrics.criticalEvents > 0) {
      riskFactors.push({
        id: 'critical_events_active',
        category: 'Threat Detection',
        description: 'Active critical security events require immediate attention',
        severity: 'critical',
        impact_score: 90,
        likelihood: 0.9,
        mitigation_status: 'open',
        first_detected: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });
    }

    return riskFactors;
  }

  /**
   * Generate actionable security recommendations
   */
  private async generateRecommendations(
    components: Record<string, HealthComponent>,
    _riskFactors: RiskFactor[]
  ): Promise<SecurityRecommendation[]> {
    const recommendations: SecurityRecommendation[] = [];

    // Authentication improvements
    if (components.authentication.score < 80) {
      recommendations.push({
        id: 'improve_auth_monitoring',
        priority: 'high',
        category: 'Authentication',
        title: 'Enhance Authentication Monitoring',
        description: 'Implement additional authentication monitoring and alerting',
        impact: 'Reduce authentication-related security risks by 60%',
        effort: 'medium',
        implementation_steps: [
          'Configure advanced authentication failure monitoring',
          'Implement account lockout policies',
          'Set up real-time brute force detection',
          'Enable multi-factor authentication for admin accounts'
        ],
        expected_improvement: 15,
        status: 'open'
      });
    }

    // Compliance improvements
    if (components.compliance.score < 90) {
      recommendations.push({
        id: 'ferpa_compliance_review',
        priority: 'critical',
        category: 'Compliance',
        title: 'FERPA Compliance Review',
        description: 'Conduct comprehensive FERPA compliance audit and remediation',
        impact: 'Achieve full FERPA compliance and avoid regulatory penalties',
        effort: 'high',
        implementation_steps: [
          'Audit all academic data access points',
          'Implement missing access controls',
          'Update data handling procedures',
          'Train staff on FERPA requirements'
        ],
        expected_improvement: 20,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open'
      });
    }

    // Threat detection improvements
    if (components.threat_detection.score < 85) {
      recommendations.push({
        id: 'enhance_threat_detection',
        priority: 'medium',
        category: 'Threat Detection',
        title: 'Enhance Threat Detection Capabilities',
        description: 'Improve threat detection accuracy and response times',
        impact: 'Reduce mean time to detection by 50%',
        effort: 'medium',
        implementation_steps: [
          'Tune alert thresholds to reduce false positives',
          'Implement behavioral analytics',
          'Enhance incident response procedures',
          'Add automated threat hunting capabilities'
        ],
        expected_improvement: 12,
        status: 'open'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get compliance data from various sources
   */
  private async getComplianceData(): Promise<any> {
    // This would integrate with compliance monitoring systems
    // For now, return simulated data
    return {
      ferpa: {
        score: 92,
        violations: []
      },
      gdpr: {
        score: 88,
        violations: []
      }
    };
  }

  /**
   * Get detailed compliance status
   */
  private async getDetailedComplianceStatus(): Promise<ComplianceStatus> {
    // This would be more comprehensive in production
    return {
      ferpa: {
        name: 'FERPA',
        score: 92,
        status: 'compliant',
        requirements: [],
        last_audit: new Date().toISOString(),
        violations: []
      },
      gdpr: {
        name: 'GDPR',
        score: 88,
        status: 'partial',
        requirements: [],
        last_audit: new Date().toISOString(),
        violations: []
      },
      sox: {
        name: 'SOX',
        score: 85,
        status: 'partial',
        requirements: [],
        last_audit: new Date().toISOString(),
        violations: []
      },
      custom: []
    };
  }

  /**
   * Generate predictive insights
   */
  private async generatePredictiveInsights(
    components: Record<string, HealthComponent>,
    weeklyMetrics: SecurityMetrics
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Predict potential compliance issues
    if (components.compliance.score < 90) {
      insights.push({
        type: 'compliance_alert',
        confidence: 0.8,
        description: 'FERPA compliance score trending downward - potential violation risk in next 30 days',
        predicted_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        impact_assessment: 'High - Regulatory penalties and reputation damage',
        preventive_actions: [
          'Conduct immediate compliance review',
          'Implement additional access controls',
          'Train staff on FERPA requirements'
        ]
      });
    }

    // Predict authentication issues
    if (weeklyMetrics.authFailures > weeklyMetrics.totalEvents * 0.1) {
      insights.push({
        type: 'risk_prediction',
        confidence: 0.7,
        description: 'Authentication failure rate indicates potential brute force attack escalation',
        predicted_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        impact_assessment: 'Medium - Account compromise risk',
        preventive_actions: [
          'Implement account lockout policies',
          'Enable additional monitoring',
          'Consider IP blocking for repeat offenders'
        ]
      });
    }

    return insights;
  }

  /**
   * Store health score in database for historical tracking
   */
  private async storeHealthScore(healthScore: SecurityHealthScore): Promise<void> {
    try {
      const record = {
        calculated_at: healthScore.last_calculated,
        overall_score: healthScore.overall_score,
        trend: healthScore.trend,
        component_scores: Object.fromEntries(
          Object.entries(healthScore.components).map(([key, component]) => [key, component.score])
        ),
        risk_factor_count: healthScore.risk_factors.length,
        recommendation_count: healthScore.recommendations.length,
        metadata: {
          components: healthScore.components,
          predictive_insights: healthScore.predictive_insights
        }
      };

      await supabaseAdmin()
        .from('security_health_history')
        .insert([record]);

    } catch (error) {
      this.logger.error('Failed to store health score history', error);
      // Don't throw - this is not critical
    }
  }
}

// Export singleton instance
export const securityHealth = new SecurityHealthService();

// Export utility functions
export const calculateSecurityHealthScore = () => securityHealth.calculateHealthScore();

export const getSecurityRecommendations = (filters?: any) => 
  securityHealth.getSecurityRecommendations(filters);

export const getHealthScoreHistory = (days?: number) => 
  securityHealth.getHealthScoreHistory(days);