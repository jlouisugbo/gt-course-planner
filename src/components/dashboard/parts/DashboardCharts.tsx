"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { DashboardStats } from "@/hooks/useDashboardData";

interface DashboardChartsProps {
    gpaHistory: Array<{
        semester: string;
        gpa: number;
        credits: number;
    }>;
    stats: DashboardStats;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ gpaHistory, stats }) => {
    // Create GPA trend data
    const gpaData = gpaHistory.length > 0 ? gpaHistory : [
        { semester: "Current", gpa: stats.currentGPA, credits: stats.creditsCompleted }
    ];

    // Create credit distribution data
    const creditData = [
        { name: "Completed", value: stats.creditsCompleted, color: "#22c55e" },
        { name: "In Progress", value: stats.creditsInProgress, color: "#3b82f6" },
        { name: "Planned", value: stats.creditsPlanned, color: "#f59e0b" },
        { name: "Remaining", value: Math.max(0, stats.totalCredits - stats.creditsCompleted - stats.creditsInProgress - stats.creditsPlanned), color: "#e5e7eb" }
    ].filter(item => item.value > 0);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
        >
            {/* GPA Trend Chart */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span>GPA Trend</span>
                        <Badge variant="outline" className="ml-auto">
                            {stats.currentGPA >= 3.0 ? "Good Standing" : "Needs Improvement"}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={gpaData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="semester" 
                                    tick={{ fontSize: 12 }}
                                    stroke="#64748b"
                                />
                                <YAxis 
                                    domain={[0, 4.0]}
                                    tick={{ fontSize: 12 }}
                                    stroke="#64748b"
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    formatter={(value: any, name: string) => [
                                        `${Number(value).toFixed(2)}`, 
                                        name === 'gpa' ? 'GPA' : name
                                    ]}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="gpa" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                                    activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                                />
                                {/* Target GPA line */}
                                <Line 
                                    type="monotone" 
                                    dataKey={() => stats.targetGPA} 
                                    stroke="#10b981" 
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                <span>Current GPA</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-dashed border-green-600"></div>
                                <span>Target GPA</span>
                            </div>
                        </div>
                        <Badge variant={stats.currentGPA >= stats.targetGPA ? "default" : "secondary"}>
                            {stats.currentGPA >= stats.targetGPA ? "Meeting Goal" : "Below Goal"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Credit Distribution Chart */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2">
                        <PieChartIcon className="h-5 w-5 text-[#B3A369]" />
                        <span>Credit Distribution</span>
                        <Badge variant="outline" className="ml-auto">
                            {stats.creditsCompleted + stats.creditsInProgress} / {stats.totalCredits}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={creditData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    innerRadius={40}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {creditData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    formatter={(value: any) => [`${value} credits`, '']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {creditData.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: item.color }}
                                ></div>
                                <span className="text-sm text-slate-600">
                                    {item.name}: {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};