'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Lock, 
  Eye, 
  TrendingUp, 
  Users, 
  Clock,
  CheckCircle,
  // XCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  authFailures: number;
  suspiciousActivities: number;
  ferpaViolations: number;
  rateLimit: number;
  topThreats: Array<{
    type: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  riskScore: number;
  complianceScore: number;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  user_id?: string;
  ip_address?: string;
  created_at: string;
  data?: any;
  threat_indicators?: Array<{
    type: string;
    confidence: number;
    description: string;
  }>;
}

interface SecurityHealth {
  overall_score: number;
  overall_status: 'healthy' | 'warning' | 'critical';
  components: {
    authentication: {
      score: number;
      status: string;
      details: any;
    };
    threats: {
      score: number;
      status: string;
      details: any;
    };
    compliance: {
      score: number;
      status: string;
      details: any;
    };
    performance: {
      score: number;
      status: string;
      details: any;
    };
  };
  recommendations: string[];
}

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [health, setHealth] = useState<SecurityHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch security data
  const fetchSecurityData = useCallback(async () => {
    try {
      setError(null);
      
        const [metricsResponse, eventsResponse, healthResponse] = await Promise.all([
        fetch(`/api/security/metrics?timeframe=${selectedTimeframe}`),
        fetch('/api/security/events?limit=50'),
        fetch('/api/security/metrics/health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      if (!metricsResponse.ok || !eventsResponse.ok || !healthResponse.ok) {
        throw new Error('Failed to fetch security data');
      }

      const [metricsData, eventsData, healthData] = await Promise.all([
        metricsResponse.json(),
        eventsResponse.json(),
        healthResponse.json()
      ]);

      setMetrics(metricsData.metrics);
      setEvents(eventsData.events || []);
      setHealth(healthData.health);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Security dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchSecurityData();

    let interval: ReturnType<typeof setInterval> | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchSecurityData, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedTimeframe, autoRefresh, fetchSecurityData]);

  // Export security report
  const exportSecurityReport = async () => {
    try {
      const response = await fetch('/api/security/events?format=csv');
      
      if (!response.ok) throw new Error('Failed to export report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export security report');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="animate-spin h-6 w-6" />
          <span>Loading security dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchSecurityData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
            <p className="text-gray-600">Real-time security monitoring and threat detection</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Timeframe:</span>
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button onClick={exportSecurityReport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Health Overview */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Security Health Status</span>
              <Badge variant={health.overall_status === 'healthy' ? 'default' : 'destructive'}>
                {health.overall_status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getHealthStatusColor(health.overall_status)}`}>
                  {health.overall_score}
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              
              {Object.entries(health.components).map(([component, data]) => (
                <div key={component} className="text-center">
                  <div className={`text-2xl font-semibold ${getHealthStatusColor(data.status)}`}>
                    {data.score}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {component.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>

            {health.recommendations.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  {health.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{metrics.totalEvents}</div>
                  <div className="text-sm text-gray-600">Total Events</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</div>
                  <div className="text-sm text-gray-600">Critical Events</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{metrics.authFailures}</div>
                  <div className="text-sm text-gray-600">Auth Failures</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className={`h-5 w-5 ${getRiskScoreColor(metrics.riskScore)}`} />
                <div>
                  <div className={`text-2xl font-bold ${getRiskScoreColor(metrics.riskScore)}`}>
                    {metrics.riskScore}
                  </div>
                  <div className="text-sm text-gray-600">Risk Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Security Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
          <TabsTrigger value="compliance">FERPA Compliance</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No security events found for the selected timeframe
                  </div>
                ) : (
                  events.map((event) => (
                    <div 
                      key={event.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge variant={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        
                        <div>
                          <div className="font-medium capitalize">
                            {event.event_type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {event.ip_address && `IP: ${event.ip_address}`}
                            {event.user_id && ` • User: ${event.user_id.substring(0, 8)}...`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {event.threat_indicators && event.threat_indicators.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{event.threat_indicators.length} indicators</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(event.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Security Threats</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.topThreats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No threats detected in the selected timeframe
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics?.topThreats.map((threat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium capitalize">
                            {threat.type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {threat.count} occurrences
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={threat.trend === 'up' ? 'destructive' : threat.trend === 'down' ? 'default' : 'secondary'}>
                          {threat.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>FERPA Compliance Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics?.complianceScore || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Compliance Score</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {metrics?.ferpaViolations || 0}
                  </div>
                  <div className="text-sm text-gray-600">Potential Violations</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">100%</div>
                  <div className="text-sm text-gray-600">Access Logged</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Compliance Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Automatic access logging</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Data anonymization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Audit trail maintenance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Role-based access control</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Activity Monitoring</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                User activity analytics will be displayed here.
                This includes authentication patterns, access frequency, and behavioral analysis.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}