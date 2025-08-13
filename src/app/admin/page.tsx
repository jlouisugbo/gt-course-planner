"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
    Users, MousePointer, Clock, 
    Activity, RefreshCw, Shield, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import AdminDashboardWidgets from '@/components/admin/AdminDashboardWidgets';

interface AnalyticsData {
    overview?: any;
    pages?: any;
    features?: any;
    users?: any;
    realtime?: any;
}

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData>({});
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [dateRange, setDateRange] = useState('7d');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [error, setError] = useState<string>('');

    const checkAdminAccess = useCallback(async () => {
        if (!user) {
            router.push('/dashboard');
            return;
        }

        try {
            // Try to fetch analytics - will fail if not admin
            const response = await fetch('/api/analytics/report?type=overview');
            if (response.status === 403) {
                setError('Admin access required. Please contact an administrator.');
                setIsAdmin(false);
            } else if (response.ok) {
                setIsAdmin(true);
            } else {
                setError('Failed to verify admin access');
            }
        } catch {
            setError('Failed to verify admin access');
        } finally {
            setLoading(false);
        }
    }, [user, router]);

    const fetchAnalytics = useCallback(async () => {
        if (!isAdmin) return;
        
        setLoading(true);
        try {
            const endDate = new Date().toISOString();
            const startDate = getStartDate(dateRange);

            // Fetch all report types
            const reports = await Promise.all([
                fetchReport('overview', startDate, endDate),
                fetchReport('pages', startDate, endDate),
                fetchReport('features', startDate, endDate),
                fetchReport('users', startDate, endDate),
                fetchReport('realtime', startDate, endDate)
            ]);

            setData({
                overview: reports[0],
                pages: reports[1],
                features: reports[2],
                users: reports[3],
                realtime: reports[4]
            });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setError('Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    }, [isAdmin, dateRange]);

    const fetchReport = async (type: string, startDate: string, endDate: string) => {
        const response = await fetch(`/api/analytics/report?type=${type}&startDate=${startDate}&endDate=${endDate}`);
        if (response.ok) {
            return await response.json();
        }
        throw new Error(`Failed to fetch ${type} report`);
    };

    const fetchRealtimeData = useCallback(async () => {
        if (!isAdmin) return;
        
        try {
            const response = await fetch('/api/analytics/report?type=realtime');
            if (response.ok) {
                const realtimeData = await response.json();
                setData(prev => ({ ...prev, realtime: realtimeData }));
            }
        } catch (error) {
            console.error('Failed to fetch realtime data:', error);
        }
    }, [isAdmin]);

    const getStartDate = (range: string): string => {
        const now = new Date();
        switch (range) {
            case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
            default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        }
    };

    // Check admin status on mount
    useEffect(() => {
        checkAdminAccess();
    }, [user, checkAdminAccess]);

    useEffect(() => {
        if (isAdmin) {
            fetchAnalytics();
            // Refresh realtime data every 30 seconds
            const interval = setInterval(() => {
                if (activeTab === 'realtime' || activeTab === 'dashboard') {
                    fetchRealtimeData();
                }
            }, 30000);
            return () => clearInterval(interval);
        }
        return () => {}; // Return empty cleanup function when not admin
    }, [isAdmin, dateRange, activeTab, fetchAnalytics, fetchRealtimeData]);

    // Show error if not admin
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Button onClick={() => router.push('/dashboard')} className="w-full">
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gt-navy mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    const COLORS = ['#003057', '#B3A369', '#54585A', '#00664F', '#C6920E'];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Shield className="h-8 w-8 text-gt-gold" />
                            <div>
                                <h1 className="text-2xl font-bold text-gt-navy">Admin Dashboard</h1>
                                <p className="text-sm text-gray-600">Analytics & User Activity Monitoring</p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => router.push('/dashboard')} 
                            variant="outline"
                        >
                            Back to App
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto p-6 space-y-6">
                {/* Controls */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <select 
                            value={dateRange} 
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-3 py-2 border rounded-md bg-white"
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>
                        <Button onClick={fetchAnalytics} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        Last updated: {new Date().toLocaleTimeString()}
                    </div>
                </div>

                {/* Quick Stats */}
                {data.overview && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100">Total Users</p>
                                        <p className="text-3xl font-bold">{data.overview.summary.total_users || 0}</p>
                                    </div>
                                    <Users className="h-8 w-8 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100">Page Views</p>
                                        <p className="text-3xl font-bold">{data.overview.summary.total_page_views || 0}</p>
                                    </div>
                                    <MousePointer className="h-8 w-8 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100">Sessions</p>
                                        <p className="text-3xl font-bold">{data.overview.summary.total_sessions || 0}</p>
                                    </div>
                                    <Activity className="h-8 w-8 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-orange-100">Avg Duration</p>
                                        <p className="text-3xl font-bold">
                                            {Math.round(data.overview.summary.avg_session_duration / 60 || 0)}m
                                        </p>
                                    </div>
                                    <Clock className="h-8 w-8 text-orange-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-red-100">Active Now</p>
                                        <p className="text-3xl font-bold">{data.realtime?.activeUsers || 0}</p>
                                    </div>
                                    <Activity className="h-8 w-8 text-red-200 animate-pulse" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="pages">Pages</TabsTrigger>
                        <TabsTrigger value="features">Features</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="realtime">Live</TabsTrigger>
                    </TabsList>

                    {/* Real-time Dashboard Tab */}
                    <TabsContent value="dashboard">
                        <AdminDashboardWidgets 
                            refreshInterval={30000}
                            autoRefresh={true}
                        />
                    </TabsContent>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Daily Trend */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Page Views Trend</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {data.overview?.dailyTrend && data.overview.dailyTrend.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={data.overview.dailyTrend}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="pageViews" stroke="#003057" strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-gray-500">
                                            No data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Device Breakdown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Device Usage</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {data.overview?.deviceBreakdown && Object.keys(data.overview.deviceBreakdown).length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(data.overview.deviceBreakdown).map(([name, value]) => ({ 
                                                        name: name.charAt(0).toUpperCase() + name.slice(1), 
                                                        value 
                                                    }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {Object.entries(data.overview.deviceBreakdown).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-gray-500">
                                            No device data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Top Pages */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Most Popular Pages</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {data.overview?.topPages && data.overview.topPages.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={data.overview.topPages.slice(0, 10)}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis 
                                                    dataKey="page_name" 
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={100}
                                                />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="view_count" fill="#003057" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-gray-500">
                                            No page data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Pages Tab */}
                    <TabsContent value="pages">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detailed Page Analytics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3 font-medium">Page Name</th>
                                                <th className="text-right p-3 font-medium">Views</th>
                                                <th className="text-right p-3 font-medium">Avg Duration</th>
                                                <th className="text-right p-3 font-medium">Bounce Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.pages?.pages?.map((page: any, index: number) => (
                                                <tr key={page.pageName} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                                    <td className="p-3 font-medium">{page.pageName}</td>
                                                    <td className="text-right p-3">{page.views.toLocaleString()}</td>
                                                    <td className="text-right p-3">{Math.round(page.avgDuration || 0)}s</td>
                                                    <td className="text-right p-3">{(page.bounceRate || 0).toFixed(1)}%</td>
                                                </tr>
                                            )) || (
                                                <tr>
                                                    <td colSpan={4} className="text-center p-8 text-gray-500">
                                                        No page data available
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Features Tab */}
                    <TabsContent value="features">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Features</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {data.features?.features?.slice(0, 15).map((feature: any, index: number) => (
                                            <div key={feature.featureName} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                                                    <span className="text-sm font-medium">{feature.featureName}</span>
                                                </div>
                                                <span className="font-bold text-gt-navy">{feature.totalUses.toLocaleString()}</span>
                                            </div>
                                        )) || (
                                            <div className="text-center py-8 text-gray-500">
                                                No feature data available
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Feature Categories</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {data.features?.categories && data.features.categories.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={data.features.categories}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="uses"
                                                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {data.features.categories.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-gray-500">
                                            No category data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Users Tab */}
                    <TabsContent value="users">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>User Types</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-medium">New Users</span>
                                                <span className="font-bold text-green-600">{data.users?.newUsers || 0}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div 
                                                    className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                                                    style={{ width: `${Math.min(100, (data.users?.newUsers / Math.max(1, data.users?.totalUsers || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-medium">Returning Users</span>
                                                <span className="font-bold text-blue-600">{data.users?.returningUsers || 0}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div 
                                                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                                                    style={{ width: `${Math.min(100, (data.users?.returningUsers / Math.max(1, data.users?.totalUsers || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Engagement Levels</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {data.users?.engagementDistribution ? (
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={[
                                                { level: 'High', count: data.users.engagementDistribution.high, color: '#10B981' },
                                                { level: 'Medium', count: data.users.engagementDistribution.medium, color: '#F59E0B' },
                                                { level: 'Low', count: data.users.engagementDistribution.low, color: '#EF4444' }
                                            ]}>
                                                <XAxis dataKey="level" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#003057" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[200px] flex items-center justify-center text-gray-500">
                                            No engagement data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Usage Metrics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                            <span className="text-sm font-medium">Avg Sessions/User</span>
                                            <span className="font-bold">{(data.users?.avgSessionsPerUser || 0).toFixed(1)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                            <span className="text-sm font-medium">Total Users</span>
                                            <span className="font-bold">{data.users?.totalUsers || 0}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Real-time Tab */}
                    <TabsContent value="realtime">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                                        <span>Live Activity</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="font-medium">Active Users</span>
                                            </div>
                                            <span className="text-2xl font-bold text-green-600">
                                                {data.realtime?.activeUsers || 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span className="font-medium">Active Sessions</span>
                                            </div>
                                            <span className="text-2xl font-bold text-blue-600">
                                                {data.realtime?.activeSessions?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity Feed</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {data.realtime?.recentActions?.slice(0, 20).map((action: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-2 h-2 bg-gt-gold rounded-full"></div>
                                                    <span>
                                                        <span className="font-medium capitalize">{action.type?.replace('_', ' ')}</span>
                                                        {action.item && <span className="text-gray-600"> • {action.item}</span>}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(action.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        )) || (
                                            <div className="text-center py-8 text-gray-500">
                                                No recent activity
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}