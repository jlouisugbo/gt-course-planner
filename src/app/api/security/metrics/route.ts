import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth-server';
import { getSecurityMetrics } from '@/lib/security/monitoring';
import { createAPILogger } from '@/lib/security/logger';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const logger = createAPILogger('api', 'security-metrics');

/**
 * GET /api/security/metrics - Get real-time security metrics (admin-only)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateRequest(request);
    if (!user) {
      return Response.json({ error: authError }, { status: 401 });
    }

    // Verify admin access
    const { data: userRecord } = await supabaseAdmin()
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (userRecord?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get timeframe parameter
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') as '1h' | '24h' | '7d' | '30d' || '24h';

    // Validate timeframe
    if (!['1h', '24h', '7d', '30d'].includes(timeframe)) {
      return Response.json({ 
        error: 'Invalid timeframe. Must be one of: 1h, 24h, 7d, 30d' 
      }, { status: 400 });
    }

    // Check cache first for performance
    const cacheKey = timeframe;
    const { data: cachedMetrics } = await supabaseAdmin()
      .from('security_metrics_cache')
      .select('metrics, expires_at')
      .eq('timeframe', cacheKey)
      .single();

    if (cachedMetrics && new Date(cachedMetrics.expires_at) > new Date()) {
      logger.info('Security metrics retrieved from cache', {
        admin_user: user.id,
        timeframe
      });

      return Response.json({
        success: true,
        metrics: cachedMetrics.metrics,
        timeframe,
        cached: true
      });
    }

    // Get fresh metrics
    const metrics = await getSecurityMetrics(timeframe);

    // Cache the results for performance (cache for 1-5 minutes based on timeframe)
    const cacheMinutes = timeframe === '1h' ? 1 : timeframe === '24h' ? 2 : 5;
    const expiresAt = new Date(Date.now() + cacheMinutes * 60 * 1000);

    await supabaseAdmin()
      .from('security_metrics_cache')
      .upsert({
        timeframe: cacheKey,
        metrics,
        expires_at: expiresAt.toISOString()
      });

    logger.info('Security metrics calculated and cached', {
      admin_user: user.id,
      timeframe,
      risk_score: metrics.riskScore,
      total_events: metrics.totalEvents
    });

    return Response.json({
      success: true,
      metrics,
      timeframe,
      cached: false
    });

  } catch (error) {
    logger.error('Failed to retrieve security metrics', error);
    return Response.json({ 
      error: 'Failed to retrieve security metrics' 
    }, { status: 500 });
  }
}

/**
 * GET /api/security/metrics/health - Get security health score
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateRequest(request);
    if (!user) {
      return Response.json({ error: authError }, { status: 401 });
    }

    const url = new URL(request.url);
    if (!url.pathname.endsWith('/health')) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Verify admin access for detailed health data
    const { data: userRecord } = await supabaseAdmin()
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (userRecord?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Calculate comprehensive security health
    const [last24h, last7d] = await Promise.all([
      getSecurityMetrics('24h'),
      getSecurityMetrics('7d')
    ]);

    // Calculate health score components
    const healthComponents = {
      authentication: {
        score: Math.max(0, 100 - (last24h.authFailures * 5)),
        status: last24h.authFailures > 10 ? 'warning' : last24h.authFailures > 20 ? 'critical' : 'healthy',
        details: {
          failures_24h: last24h.authFailures,
          trend: last7d.authFailures > last24h.authFailures ? 'improving' : 'stable'
        }
      },
      threats: {
        score: Math.max(0, 100 - (last24h.criticalEvents * 20)),
        status: last24h.criticalEvents > 0 ? 'critical' : last24h.riskScore > 50 ? 'warning' : 'healthy',
        details: {
          critical_events: last24h.criticalEvents,
          risk_score: last24h.riskScore,
          top_threats: last24h.topThreats.slice(0, 3)
        }
      },
      compliance: {
        score: last24h.complianceScore,
        status: last24h.complianceScore > 90 ? 'healthy' : last24h.complianceScore > 70 ? 'warning' : 'critical',
        details: {
          ferpa_violations: last24h.ferpaViolations,
          compliance_score: last24h.complianceScore
        }
      },
      performance: {
        score: Math.max(0, 100 - (last24h.rateLimit * 2)),
        status: last24h.rateLimit > 20 ? 'warning' : last24h.rateLimit > 50 ? 'critical' : 'healthy',
        details: {
          rate_limit_hits: last24h.rateLimit,
          total_events: last24h.totalEvents
        }
      }
    };

    // Calculate overall health score
    const overallScore = Math.round(
      (healthComponents.authentication.score * 0.3 +
       healthComponents.threats.score * 0.4 +
       healthComponents.compliance.score * 0.2 +
       healthComponents.performance.score * 0.1)
    );

    const overallStatus = overallScore > 90 ? 'healthy' : 
                         overallScore > 70 ? 'warning' : 'critical';

    logger.info('Security health calculated', {
      admin_user: user.id,
      overall_score: overallScore,
      overall_status: overallStatus
    });

    return Response.json({
      success: true,
      health: {
        overall_score: overallScore,
        overall_status: overallStatus,
        components: healthComponents,
        last_updated: new Date().toISOString(),
        recommendations: generateSecurityRecommendations(healthComponents)
      }
    });

  } catch (error) {
    logger.error('Failed to calculate security health', error);
    return Response.json({ 
      error: 'Failed to calculate security health' 
    }, { status: 500 });
  }
}

/**
 * Generate security recommendations based on health components
 */
function generateSecurityRecommendations(components: any): string[] {
  const recommendations: string[] = [];

  if (components.authentication.score < 80) {
    recommendations.push('Review authentication logs for unusual patterns');
    recommendations.push('Consider implementing additional MFA requirements');
  }

  if (components.threats.score < 70) {
    recommendations.push('Investigate recent security events immediately');
    recommendations.push('Review and update security monitoring rules');
  }

  if (components.compliance.score < 90) {
    recommendations.push('Review FERPA compliance procedures');
    recommendations.push('Audit academic data access patterns');
  }

  if (components.performance.score < 80) {
    recommendations.push('Optimize API rate limiting configurations');
    recommendations.push('Review system performance metrics');
  }

  if (recommendations.length === 0) {
    recommendations.push('Security posture is healthy - continue monitoring');
  }

  return recommendations;
}