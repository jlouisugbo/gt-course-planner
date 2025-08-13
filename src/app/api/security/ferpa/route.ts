import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth-server';
import { createAPILogger } from '@/lib/security/logger';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { trackSecurityEvent } from '@/lib/security/monitoring';

const logger = createAPILogger('api', 'ferpa-compliance');

/**
 * GET /api/security/ferpa - Get FERPA compliance logs (admin-only)
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
        endpoint: '/api/security/ferpa',
        method: 'GET',
        data: { attempted_ferpa_access: true }
      });

      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const filters = {
      user_id: url.searchParams.get('user_id') || undefined,
      data_type: url.searchParams.get('data_type') || undefined,
      operation: url.searchParams.get('operation') || undefined,
      since: url.searchParams.get('since') || undefined,
      limit: url.searchParams.get('limit') ? 
        Math.min(parseInt(url.searchParams.get('limit')!), 1000) : 100
    };

    // Build query
    let query = supabaseAdmin()
      .from('ferpa_access_logs')
      .select(`
        id,
        user_id,
        data_type,
        operation,
        justification,
        accessed_at,
        users!inner(
          id,
          full_name,
          email,
          gt_student_id
        )
      `)
      .order('accessed_at', { ascending: false });

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.data_type) {
      query = query.eq('data_type', filters.data_type);
    }
    if (filters.operation) {
      query = query.eq('operation', filters.operation);
    }
    if (filters.since) {
      query = query.gte('accessed_at', filters.since);
    }

    const { data: logs, error } = await query.limit(filters.limit);

    if (error) throw error;

    // Generate compliance summary
    const complianceSummary = await generateComplianceSummary(filters);

    logger.info('FERPA logs retrieved', {
      admin_user: user.id,
      filters,
      log_count: logs?.length || 0
    });

    return Response.json({
      success: true,
      logs: logs || [],
      total: logs?.length || 0,
      filters,
      compliance_summary: complianceSummary
    });

  } catch (error) {
    logger.error('Failed to retrieve FERPA logs', error);
    return Response.json({ 
      error: 'Failed to retrieve FERPA compliance logs' 
    }, { status: 500 });
  }
}

/**
 * POST /api/security/ferpa/audit - Generate compliance audit report
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

    const body = await request.json();
    const { 
      start_date, 
      end_date, 
      audit_type = 'full', // 'full', 'violations', 'access_patterns'
      include_user_details = false 
    } = body;

    // Validate date range
    if (!start_date || !end_date) {
      return Response.json({ 
        error: 'start_date and end_date are required' 
      }, { status: 400 });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (endDate <= startDate) {
      return Response.json({ 
        error: 'end_date must be after start_date' 
      }, { status: 400 });
    }

    // Generate comprehensive audit report
    const auditReport = await generateFERPAAuditReport({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      audit_type,
      include_user_details,
      requested_by: user.id
    });

    // Log the audit request
    await trackSecurityEvent({
      event_type: 'ferpa_violation', // Will be reclassified as audit
      severity: 'MEDIUM',
      user_id: user.id,
      data: {
        audit_type,
        date_range: { start_date, end_date },
        audit_request: true
      }
    });

    logger.info('FERPA audit report generated', {
      admin_user: user.id,
      audit_type,
      date_range: { start_date, end_date },
      total_records: auditReport.total_records
    });

    return Response.json({
      success: true,
      audit_report: auditReport,
      generated_at: new Date().toISOString(),
      generated_by: user.id
    });

  } catch (error) {
    logger.error('Failed to generate FERPA audit report', error);
    return Response.json({ 
      error: 'Failed to generate FERPA audit report' 
    }, { status: 500 });
  }
}

/**
 * Generate compliance summary for dashboard
 */
async function generateComplianceSummary(filters: any) {
  try {
    const since = filters.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get access statistics
    const { data: accessStats } = await supabaseAdmin()
      .from('ferpa_access_logs')
      .select('operation, data_type, accessed_at')
      .gte('accessed_at', since);

    if (!accessStats) {
      return {
        total_accesses: 0,
        operations: {},
        data_types: {},
        compliance_score: 100,
        potential_violations: 0
      };
    }

    // Analyze operations
    const operations: Record<string, number> = {};
    const dataTypes: Record<string, number> = {};
    
    accessStats.forEach((log: any) => {
      operations[log.operation] = (operations[log.operation] || 0) + 1;
      dataTypes[log.data_type] = (dataTypes[log.data_type] || 0) + 1;
    });

    // Check for potential violations
    const potentialViolations = await checkFERPAViolations(since);

    // Calculate compliance score
    const complianceScore = Math.max(0, 100 - (potentialViolations * 10));

    return {
      total_accesses: accessStats.length,
      operations,
      data_types: dataTypes,
      compliance_score: complianceScore,
      potential_violations: potentialViolations,
      timeframe: since
    };

  } catch (error) {
    logger.error('Failed to generate compliance summary', error);
    return {
      total_accesses: 0,
      operations: {},
      data_types: {},
      compliance_score: 0,
      potential_violations: 0,
      error: 'Failed to calculate compliance metrics'
    };
  }
}

/**
 * Check for potential FERPA violations
 */
async function checkFERPAViolations(since: string): Promise<number> {
  try {
    // Check for suspicious patterns that might indicate violations
    const violations = [];

    // 1. Excessive data access by single user
    const { data: userAccess } = await supabaseAdmin()
      .from('ferpa_access_logs')
      .select('user_id')
      .gte('accessed_at', since);

    if (userAccess) {
      const userCounts: Record<string, number> = {};
      userAccess.forEach((log: any) => {
        userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
      });

      // Flag users with excessive access (>50 records in timeframe)
      Object.values(userCounts).forEach(count => {
        if (count > 50) violations.push('excessive_access');
      });
    }

    // 2. Access without clear justification
    const { data: unjustifiedAccess } = await supabaseAdmin()
      .from('ferpa_access_logs')
      .select('id')
      .gte('accessed_at', since)
      .or('justification.is.null,justification.eq.');

    if (unjustifiedAccess && unjustifiedAccess.length > 0) {
      violations.push('missing_justification');
    }

    // 3. After-hours access to sensitive data
    const { data: afterHoursAccess } = await supabaseAdmin()
      .from('ferpa_access_logs')
      .select('accessed_at, data_type')
      .gte('accessed_at', since)
      .in('data_type', ['grades', 'transcripts', 'disciplinary_records']);

    if (afterHoursAccess) {
      const afterHoursViolations = afterHoursAccess.filter((log: any) => {
        const hour = new Date(log.accessed_at).getHours();
        return hour < 6 || hour > 22; // Outside business hours
      });
      
      if (afterHoursViolations.length > 0) {
        violations.push('after_hours_sensitive_access');
      }
    }

    return violations.length;

  } catch (error) {
    logger.error('Failed to check FERPA violations', error);
    return 0;
  }
}

/**
 * Generate comprehensive FERPA audit report
 */
async function generateFERPAAuditReport(params: {
  start_date: string;
  end_date: string;
  audit_type: string;
  include_user_details: boolean;
  requested_by: string;
}) {
  try {
    const { start_date, end_date, audit_type, include_user_details } = params;

    // Base query for audit period
    const query = supabaseAdmin()
      .from('ferpa_access_logs')
      .select(`
        id,
        user_id,
        data_type,
        operation,
        justification,
        accessed_at,
        ${include_user_details ? `
          users!inner(
            id,
            full_name,
            email,
            role,
            gt_student_id
          )
        ` : ''}
      `)
      .gte('accessed_at', start_date)
      .lte('accessed_at', end_date)
      .order('accessed_at', { ascending: false });

    const { data: auditLogs, error } = await query;
    
    if (error) throw error;

    // Generate different report types
    const reportData: any = {
      audit_period: { start_date, end_date },
      total_records: auditLogs?.length || 0,
      audit_type
    };

    if (audit_type === 'full' || audit_type === 'access_patterns') {
      reportData.access_patterns = analyzeAccessPatterns(auditLogs || []);
    }

    if (audit_type === 'full' || audit_type === 'violations') {
      reportData.potential_violations = await analyzePotentialViolations(auditLogs || []);
    }

    if (audit_type === 'full') {
      reportData.compliance_metrics = calculateComplianceMetrics(auditLogs || []);
      reportData.recommendations = generateComplianceRecommendations(reportData);
    }

    // Store audit report for records
    await supabaseAdmin()
      .from('security_events')
      .insert({
        event_type: 'ferpa_violation', // Audit event
        severity: 'LOW',
        user_id: params.requested_by,
        data: {
          audit_report: true,
          audit_type,
          date_range: { start_date, end_date },
          total_records: auditLogs?.length || 0
        }
      });

    return reportData;

  } catch (error) {
    logger.error('Failed to generate FERPA audit report', error);
    throw error;
  }
}

/**
 * Helper functions for audit analysis
 */
function analyzeAccessPatterns(logs: any[]) {
  const patterns = {
    by_user: {} as Record<string, number>,
    by_data_type: {} as Record<string, number>,
    by_operation: {} as Record<string, number>,
    by_hour: Array(24).fill(0),
    by_day: Array(7).fill(0)
  };

  logs.forEach(log => {
    patterns.by_user[log.user_id] = (patterns.by_user[log.user_id] || 0) + 1;
    patterns.by_data_type[log.data_type] = (patterns.by_data_type[log.data_type] || 0) + 1;
    patterns.by_operation[log.operation] = (patterns.by_operation[log.operation] || 0) + 1;
    
    const accessTime = new Date(log.accessed_at);
    patterns.by_hour[accessTime.getHours()]++;
    patterns.by_day[accessTime.getDay()]++;
  });

  return patterns;
}

async function analyzePotentialViolations(logs: any[]) {
  const violations = [];

  // Check for missing justifications
  const missingJustification = logs.filter(log => 
    !log.justification || log.justification.trim() === ''
  );
  
  if (missingJustification.length > 0) {
    violations.push({
      type: 'missing_justification',
      count: missingJustification.length,
      severity: 'MEDIUM',
      description: 'Academic data accessed without proper justification'
    });
  }

  // Check for excessive access
  const userAccess: Record<string, number> = {};
  logs.forEach(log => {
    userAccess[log.user_id] = (userAccess[log.user_id] || 0) + 1;
  });

  const excessiveUsers = Object.entries(userAccess)
    .filter(([, count]) => count > 100)
    .length;

  if (excessiveUsers > 0) {
    violations.push({
      type: 'excessive_access',
      count: excessiveUsers,
      severity: 'HIGH',
      description: 'Users with unusually high access volumes'
    });
  }

  return violations;
}

function calculateComplianceMetrics(logs: any[]) {
  const totalAccess = logs.length;
  const justifiedAccess = logs.filter(log => 
    log.justification && log.justification.trim() !== ''
  ).length;

  const justificationRate = totalAccess > 0 ? 
    (justifiedAccess / totalAccess) * 100 : 100;

  return {
    total_access_events: totalAccess,
    justified_access_events: justifiedAccess,
    justification_rate: Math.round(justificationRate * 100) / 100,
    compliance_score: Math.max(0, justificationRate - 10), // Penalty for violations
    audit_period_days: Math.ceil(
      (new Date().getTime() - new Date(logs[0]?.accessed_at || new Date()).getTime()) 
      / (1000 * 60 * 60 * 24)
    )
  };
}

function generateComplianceRecommendations(reportData: any): string[] {
  const recommendations: string[] = [];

  if (reportData.compliance_metrics?.justification_rate < 90) {
    recommendations.push('Implement mandatory justification for all academic data access');
    recommendations.push('Provide training on FERPA compliance requirements');
  }

  if (reportData.potential_violations?.length > 0) {
    recommendations.push('Investigate potential FERPA violations immediately');
    recommendations.push('Review access controls and audit procedures');
  }

  const patterns = reportData.access_patterns;
  if (patterns) {
    const topUser = Object.entries(patterns.by_user as Record<string, number>)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    if (topUser && (topUser[1] as number) > 50) {
      recommendations.push(`Review high-volume access by user ${topUser[0]}`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('FERPA compliance appears satisfactory - continue monitoring');
  }

  return recommendations;
}