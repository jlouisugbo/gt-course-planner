import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth-server';
import { getSecurityEvents, trackSecurityEvent } from '@/lib/security/monitoring';
import { createAPILogger } from '@/lib/security/logger';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const logger = createAPILogger('api', 'security-events');

/**
 * GET /api/security/events - Retrieve security events (admin-only)
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
      await trackSecurityEvent({
        event_type: 'unauthorized_access',
        severity: 'HIGH',
        user_id: user.id,
        endpoint: '/api/security/events',
        method: 'GET',
        data: { attempted_admin_access: true }
      });

      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const filters = {
      event_type: url.searchParams.get('event_type') || undefined,
      severity: url.searchParams.get('severity') || undefined,
      user_id: url.searchParams.get('user_id') || undefined,
      since: url.searchParams.get('since') || undefined,
      limit: url.searchParams.get('limit') ? 
        Math.min(parseInt(url.searchParams.get('limit')!), 1000) : 100
    };

    const events = await getSecurityEvents(filters);

    logger.info('Security events retrieved', {
      admin_user: user.id,
      filters,
      event_count: events.length
    });

    return Response.json({
      success: true,
      events,
      total: events.length,
      filters
    });

  } catch (error) {
    logger.error('Failed to retrieve security events', error);
    return Response.json({ 
      error: 'Failed to retrieve security events' 
    }, { status: 500 });
  }
}

/**
 * POST /api/security/events - Create security event (internal API)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateRequest(request);
    if (!user) {
      return Response.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const {
      event_type,
      severity,
      endpoint,
      method,
      data,
      threat_indicators
    } = body;

    // Validate required fields
    if (!event_type || !severity) {
      return Response.json({ 
        error: 'event_type and severity are required' 
      }, { status: 400 });
    }

    // Extract request metadata
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    await trackSecurityEvent({
      event_type,
      severity,
      user_id: user.id,
      ip_address,
      user_agent,
      endpoint: endpoint || request.url,
      method: method || 'POST',
      data,
      threat_indicators
    });

    logger.info('Security event created', {
      event_type,
      severity,
      user_id: user.id
    });

    return Response.json({
      success: true,
      message: 'Security event tracked successfully'
    });

  } catch (error) {
    logger.error('Failed to create security event', error);
    return Response.json({ 
      error: 'Failed to create security event' 
    }, { status: 500 });
  }
}