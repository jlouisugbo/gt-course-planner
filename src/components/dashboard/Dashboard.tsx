"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    BookOpen,
    CheckCircle,
    TrendingUp,
    Clock,
    GraduationCap,
    Plus,
    Target,
    Award,
    BarChart3,
    PieChart,
    Activity,
    Brain,
    Lightbulb,
    Trophy,
    Zap,
    MapPin,
    Eye,
    ChevronRight,
    TrendingDown,
} from "lucide-react";

import { usePlannerStore } from "@/hooks/usePlannerStore";
import { motion } from "framer-motion";
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    ResponsiveContainer,
    BarChart,
    Bar,
    Area,
    AreaChart,
} from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";

const Dashboard = () => {
    const { 
        studentInfo, 
        academicProgress, 
        recentActivity, 
        semesters,
        getGPAHistory,
        getThreadProgress,
        getUpcomingDeadlines 
    } = usePlannerStore();

    // Calculate all course data from store
    const allCourses = Object.values(semesters).flatMap(
        (semester) => semester.courses,
    );
    const completedCourses = allCourses.filter(
        (course) => course.status === "completed",
    );
    const plannedCourses = allCourses.filter(
        (course) => course.status === "planned",
    );
    const inProgressCourses = allCourses.filter(
        (c) => c.status === "in-progress",
    );

    // Use store data for charts
    const gpaHistory = getGPAHistory();
    const threadProgress = getThreadProgress();
    
    // Calculate credit distribution from store data
    const creditDistribution = [
        {
            name: "Completed",
            value: academicProgress.creditsCompleted,
            color: "#10B981",
            percentage: (academicProgress.creditsCompleted / academicProgress.totalCreditsRequired) * 100,
        },
        {
            name: "In Progress",
            value: academicProgress.creditsInProgress,
            color: "#3B82F6",
            percentage: (academicProgress.creditsInProgress / academicProgress.totalCreditsRequired) * 100,
        },
        {
            name: "Planned",
            value: academicProgress.creditsPlanned,
            color: "#F59E0B",
            percentage: (academicProgress.creditsPlanned / academicProgress.totalCreditsRequired) * 100,
        },
        {
            name: "Remaining",
            value:
                academicProgress.totalCreditsRequired -
                academicProgress.creditsCompleted -
                academicProgress.creditsInProgress -
                academicProgress.creditsPlanned,
            color: "#E5E7EB",
            percentage:
                ((academicProgress.totalCreditsRequired -
                    academicProgress.creditsCompleted -
                    academicProgress.creditsInProgress -
                    academicProgress.creditsPlanned) /
                    academicProgress.totalCreditsRequired) *
                100,
        },
    ];

    // Calculate difficulty distribution from store data
    const difficultyDistribution = [
        {
            difficulty: "1-2 (Easy)",
            count: allCourses.filter((c) => c.difficulty && c.difficulty <= 2).length,
            color: "#10B981",
        },
        {
            difficulty: "3 (Medium)",
            count: allCourses.filter((c) => c.difficulty === 3).length,
            color: "#F59E0B",
        },
        {
            difficulty: "4-5 (Hard)",
            count: allCourses.filter((c) => c.difficulty && c.difficulty >= 4).length,
            color: "#EF4444",
        },
    ];

    const remainingCourses = plannedCourses.length + (academicProgress.totalCreditsRequired - academicProgress.creditsCompleted - academicProgress.creditsInProgress - academicProgress.creditsPlanned) / 3; // Assuming avg 3 credits per course

    const quickActions = [
        {
            title: "Plan Next Semester",
            description: `Add courses to upcoming semester`,
            icon: Calendar,
            href: "/planner",
            primary: true,
            color: "bg-[#003057]",
            badge: "Priority",
        },
        {
            title: "Explore Courses",
            description: "Browse course catalog",
            icon: BookOpen,
            href: "/courses",
            color: "bg-[#B3A369]",
            badge: "New",
        },
        {
            title: "Check Requirements",
            description: "View graduation progress",
            icon: CheckCircle,
            href: "/requirements",
            color: "bg-emerald-600",
            badge: "Updated",
        },
        {
            title: "Academic Roadmap",
            description: "Visual journey overview",
            icon: MapPin,
            href: "/roadmap",
            color: "bg-purple-600",
            badge: "Interactive",
        },
    ];

    // AI Insights Shell - You can implement the AI logic here
    const generateAIInsights = () => {
        // TODO: Implement AI-powered insights based on user data
        // This is where you would analyze:
        // - academicProgress
        // - course difficulty trends
        // - GPA trends
        // - upcoming requirements
        // - semester workload
        
        return [
            {
                type: "success",
                icon: Trophy,
                title: "Progress Analysis",
                description: `You're ${Math.round((academicProgress.creditsCompleted / academicProgress.totalCreditsRequired) * 100)}% complete with your degree`,
                action: "View Details"
            },
            {
                type: "info", 
                icon: Lightbulb,
                title: "Course Recommendations",
                description: `${remainingCourses} courses remaining - consider planning ahead`,
                action: "Explore Courses"
            },
            // Add more AI-generated insights here
        ];
    };

    const aiInsights = generateAIInsights();

    const progressPercentage =
        (academicProgress.creditsCompleted /
            academicProgress.totalCreditsRequired) *
        100;

    const StatCard = ({
        title,
        value,
        subtitle,
        icon: Icon,
        color,
        trend,
        trendValue,
        delay,
    }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="stats-card hover:shadow-lg transition-all duration-200 border-slate-300">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">
                                {title}
                            </p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">
                                {value}
                            </p>
                            {subtitle && (
                                <p className="text-sm text-slate-500 mt-1">
                                    {subtitle}
                                </p>
                            )}
                            {trend && (
                                <div
                                    className={cn(
                                        "flex items-center mt-2 text-sm",
                                        trend === "up"
                                            ? "text-green-600"
                                            : trend === "down"
                                              ? "text-red-600"
                                              : "text-slate-600",
                                    )}
                                >
                                    {trend === "up" ? (
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                    ) : trend === "down" ? (
                                        <TrendingDown className="h-3 w-3 mr-1" />
                                    ) : (
                                        <Activity className="h-3 w-3 mr-1" />
                                    )}
                                    {trendValue}
                                </div>
                            )}
                        </div>
                        <div className={cn("p-3 rounded-full", color)}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );

    const InsightCard = ({
        insight,
        delay,
    }: {
        insight: any;
        delay: number;
    }) => {
        const Icon = insight.icon;
        const colors = {
            success: "border-green-200 bg-green-50 text-green-800",
            warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
            info: "border-blue-200 bg-blue-50 text-blue-800",
            tip: "border-purple-200 bg-purple-50 text-purple-800",
        };

        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay }}
            >
                <Card
                    className={cn(
                        "transition-all duration-200 hover:shadow-md",
                        colors[insight.type],
                    )}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-medium text-sm">
                                    {insight.title}
                                </h4>
                                <p className="text-sm opacity-90 mt-1">
                                    {insight.description}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 h-7 px-2 text-xs"
                                >
                                    {insight.action}
                                    <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden"
            >
                <Card className="gt-gradient text-white border-0 shadow-xl">
                    <CardContent className="p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-bold">
                                    Welcome back,{" "}
                                    {studentInfo.name.split(" ")[0]}! 👋
                                </h1>
                                <p className="text-xl opacity-90">
                                    {studentInfo.major} • Expected Graduation:{" "}
                                    {studentInfo.expectedGraduation}
                                </p>
                                <div className="flex items-center space-x-4 mt-4">
                                    <Badge
                                        variant="secondary"
                                        className="bg-white/20 text-white border-white/30"
                                    >
                                        <Target className="w-3 h-3 mr-1" />
                                        {Math.round(progressPercentage)}%
                                        Complete
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="bg-white/20 text-white border-white/30"
                                    >
                                        <Award className="w-3 h-3 mr-1" />
                                        {academicProgress.currentGPA} GPA
                                    </Badge>
                                </div>
                            </div>
                            <div className="mt-6 lg:mt-0 text-center lg:text-right">
                                <div className="text-5xl font-bold mb-2">
                                    {Math.round(progressPercentage)}%
                                </div>
                                <div className="text-lg opacity-90">
                                    Degree Progress
                                </div>
                                <Progress
                                    value={progressPercentage}
                                    className="mt-3 h-3 bg-white/20"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Credit Progress"
                    value={`${academicProgress.creditsCompleted + academicProgress.creditsInProgress}/${academicProgress.totalCreditsRequired}`}
                    subtitle={`${Math.round(progressPercentage)}% complete`}
                    icon={GraduationCap}
                    color="bg-[#B3A369]"
                    trend="up"
                    trendValue={`${academicProgress.creditsCompleted} completed`}
                    delay={0.1}
                />

                <StatCard
                    title="Current GPA"
                    value={academicProgress.currentGPA}
                    subtitle={`Target: ${academicProgress.projectedGPA}`}
                    icon={TrendingUp}
                    color="bg-green-600"
                    trend="stable"
                    trendValue="On track"
                    delay={0.2}
                />

                <StatCard
                    title="Courses Remaining"
                    value={Math.ceil(remainingCourses)}
                    subtitle={`${plannedCourses.length} planned`}
                    icon={BookOpen}
                    color="bg-blue-600"
                    trend="down"
                    trendValue={`${completedCourses.length} completed`}
                    delay={0.3}
                />

                <StatCard
                    title="Graduation Timeline"
                    value={studentInfo.expectedGraduation}
                    subtitle="Expected completion"
                    icon={Clock}
                    color="bg-emerald-600"
                    trend="stable"
                    trendValue="On schedule"
                    delay={0.4}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Credit Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="border-slate-300">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <PieChart className="h-5 w-5 mr-2" />
                                Credit Distribution
                            </CardTitle>
                            <CardDescription>
                                Breakdown of your {academicProgress.totalCreditsRequired} required credits
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={creditDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            dataKey="value"
                                        >
                                            {creditDistribution.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {creditDistribution.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor: item.color,
                                            }}
                                        />
                                        <span className="text-sm text-slate-600">
                                            {item.name}: {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* GPA Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-slate-300">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2" />
                                GPA Trend
                            </CardTitle>
                            <CardDescription>
                                Historical and projected GPA performance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={gpaHistory}>
                                        <XAxis
                                            dataKey="semester"
                                            tick={{ fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis domain={[3.0, 4.0]} tick={{ fontSize: 12 }} />
                                        <Area
                                            type="monotone"
                                            dataKey="gpa"
                                            stroke="#B3A369"
                                            fill="#B3A369"
                                            fillOpacity={0.3}
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card className="border-slate-300">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Zap className="h-5 w-5 mr-2" />
                                Quick Actions
                            </CardTitle>
                            <CardDescription>Common planning tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {quickActions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <Link key={index} href={action.href}>
                                        <Button
                                            variant={action.primary ? "default" : "outline"}
                                            className={`w-full justify-start h-auto p-4 ${
                                                action.primary
                                                    ? "bg-[#003057] hover:bg-[#002041]"
                                                    : "border-slate-300"
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={cn("p-2 rounded-lg", action.color)}>
                                                    <Icon className="h-4 w-4 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium">{action.title}</div>
                                                    <div className="text-sm opacity-70">
                                                        {action.description}
                                                    </div>
                                                </div>
                                                {action.badge && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="ml-auto text-xs"
                                                    >
                                                        {action.badge}
                                                    </Badge>
                                                )}
                                            </div>
                                        </Button>
                                    </Link>
                                );
                            })}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Difficulty Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <Card className="border-slate-300">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <BarChart3 className="h-5 w-5 mr-2" />
                                Course Difficulty Distribution
                            </CardTitle>
                            <CardDescription>
                                Breakdown of course difficulty levels
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={difficultyDistribution}>
                                        <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Bar dataKey="count" fill="#B3A369" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Thread Progress */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                >
                    <Card className="border-slate-300">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Target className="h-5 w-5 mr-2" />
                                CS Thread Progress
                            </CardTitle>
                            <CardDescription>
                                Progress toward specialization threads
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {threadProgress.map((thread, index) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium">{thread.name}</span>
                                        <span>
                                            {thread.completed}/{thread.required} credits
                                        </span>
                                    </div>
                                    <Progress
                                        value={(thread.completed / thread.required) * 100}
                                        className="h-3"
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Insights and Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI-Powered Insights Shell */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                >
                    <Card className="border-slate-300">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Brain className="h-5 w-5 mr-2" />
                                AI Insights
                            </CardTitle>
                            <CardDescription>
                                Personalized recommendations based on your progress
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {aiInsights.map((insight, index) => (
                                <InsightCard
                                    key={index}
                                    insight={insight}
                                    delay={1.1 + index * 0.1}
                                />
                            ))}
                            {/* TODO: Add more sophisticated AI insights here */}
                            <div className="text-center py-4 text-slate-500 text-sm">
                                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                More AI insights coming soon...
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                >
                    <Card className="border-slate-300">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Activity className="h-5 w-5 mr-2" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>
                                Your latest planning updates and changes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.slice(0, 5).map((activity, index) => (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.2 + index * 0.1 }}
                                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Plus className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900">
                                                {activity.title}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(activity.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                ))}
                                {recentActivity.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Timeline Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
            >
                <Card className="border-slate-300">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2" />
                            Academic Timeline Overview
                        </CardTitle>
                        <CardDescription>
                            Your semester-by-semester journey
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                            {Object.values(semesters).slice(0, 8).map((semester, index) => (
                                <motion.div
                                    key={semester.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.4 + index * 0.1 }}
                                    className={cn(
                                        "p-3 rounded-lg border-2 transition-colors",
                                        semester.courses.every(c => c.status === "completed")
                                            ? "bg-green-50 border-green-200"
                                            : semester.isActive
                                            ? "bg-blue-50 border-blue-300 border-dashed"
                                            : "bg-slate-50 border-slate-200"
                                    )}
                                >
                                    <div className="text-xs font-medium text-slate-600 mb-1">
                                        {semester.season} {semester.year}
                                    </div>
                                    <div className="text-lg font-bold text-slate-900">
                                        {semester.totalCredits}cr
                                    </div>
                                    <div className="flex items-center mt-2">
                                        {semester.courses.every(
                                            c => c.status === "completed"
                                        ) && <CheckCircle className="h-3 w-3 text-green-600" />}
                                        {semester.isActive && (
                                            <Clock className="h-3 w-3 text-blue-600" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default Dashboard;