import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth-server';
import { calculateSecurityHealthScore, getSecurityRecommendations, getHealthScoreHistory } from '@/lib/security/health-scoring';
import { createAPILogger } from '@/lib/security/logger';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const logger = createAPILogger('api', 'security-health');

/**
 * GET /api/security/health - Get comprehensive security health assessment (admin-only)
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

    // Parse query parameters
    const url = new URL(request.url);
    const includeHistory = url.searchParams.get('include_history') === 'true';
    const historyDays = parseInt(url.searchParams.get('history_days') || '30');
    const includeRecommendations = url.searchParams.get('include_recommendations') === 'true';

    // Get current health score
    const healthScore = await calculateSecurityHealthScore();

    // Optionally include historical data
    let history = undefined;
    if (includeHistory) {
      history = await getHealthScoreHistory(historyDays);
    }

    // Optionally include recommendations
    let recommendations = undefined;
    if (includeRecommendations) {
      recommendations = await getSecurityRecommendations();
    }

    logger.info('Security health data retrieved', {
      admin_user: user.id,
      overall_score: healthScore.overall_score,
      include_history: includeHistory,
      include_recommendations: includeRecommendations
    });

    return Response.json({
      success: true,
      health_score: healthScore,
      history,
      recommendations,
      metadata: {
        last_updated: healthScore.last_calculated,
        cache_status: 'fresh',
        data_completeness: 'full'
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve security health data', error);
    return Response.json({ 
      error: 'Failed to retrieve security health data' 
    }, { status: 500 });
  }
}

/**
 * POST /api/security/health/recalculate - Force recalculation of health score (admin-only)
 */
export async function POST(request: NextRequest) {
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

    // Force recalculation (bypass cache)
    const healthScore = await calculateSecurityHealthScore();

    logger.info('Security health score recalculated', {
      admin_user: user.id,
      overall_score: healthScore.overall_score,
      trend: healthScore.trend
    });

    return Response.json({
      success: true,
      message: 'Security health score recalculated successfully',
      health_score: healthScore,
      recalculated_at: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to recalculate security health score', error);
    return Response.json({ 
      error: 'Failed to recalculate security health score' 
    }, { status: 500 });
  }
}