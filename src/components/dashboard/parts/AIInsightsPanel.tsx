// AIInsightsPanel.tsx - With comprehensive safety checks
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Brain, Trophy, Lightbulb, AlertCircle } from "lucide-react";
import InsightCard from "./InsightCard";

interface AIInsightsPanelProps {
    academicProgress?: {
        creditsCompleted?: number;
        totalCreditsRequired?: number;
        currentGPA?: number;
    } | null;
    remainingCourses?: number;
    delay?: number;
}

interface Insight {
    type: "success" | "warning" | "info" | "tip";
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    action: string;
}

const AIInsightsPanel = ({ 
    academicProgress, 
    remainingCourses = 0, 
    delay = 0 
}: AIInsightsPanelProps) => {
    // Safe data extraction with fallbacks
    const safeAcademicProgress = academicProgress || {};
    const creditsCompleted = safeAcademicProgress.creditsCompleted || 0;
    const totalCreditsRequired = safeAcademicProgress.totalCreditsRequired || 126;
    const currentGPA = safeAcademicProgress.currentGPA || 0;
    const safeRemainingCourses = remainingCourses || 0;

    const generateAIInsights = (): Insight[] => {
        // Safe calculation with validation
        const progressPercentage = totalCreditsRequired > 0 
            ? (creditsCompleted / totalCreditsRequired) * 100 
            : 0;

        const insights: Insight[] = [];

        // Progress Analysis Insight
        if (progressPercentage > 0) {
            insights.push({
                type: progressPercentage >= 75 ? "success" : progressPercentage >= 50 ? "info" : "warning",
                icon: Trophy,
                title: "Progress Analysis",
                description: `You're ${Math.round(progressPercentage)}% complete with your degree`,
                action: "View Details"
            });
        } else {
            insights.push({
                type: "info",
                icon: Trophy,
                title: "Getting Started",
                description: "Ready to begin your academic journey!",
                action: "Plan Courses"
            });
        }

        // Course Recommendations Insight
        if (safeRemainingCourses > 0) {
            const urgencyType = safeRemainingCourses > 20 ? "info" : safeRemainingCourses > 10 ? "warning" : "tip";
            insights.push({
                type: urgencyType,
                icon: Lightbulb,
                title: "Course Recommendations",
                description: `${Math.ceil(safeRemainingCourses)} courses remaining - ${
                    safeRemainingCourses > 15 ? "plenty of time to plan" : "consider planning ahead"
                }`,
                action: "Explore Courses"
            });
        } else if (progressPercentage >= 100) {
            insights.push({
                type: "success",
                icon: Lightbulb,
                title: "Graduation Ready!",
                description: "All course requirements completed - congratulations!",
                action: "View Graduation"
            });
        }

        // GPA Optimization Insight
        if (currentGPA > 0) {
            const gpaType = currentGPA >= 3.5 ? "success" : currentGPA >= 3.0 ? "info" : "warning";
            const gpaMessage = currentGPA >= 3.5 
                ? "Excellent GPA - keep up the great work!"
                : currentGPA >= 3.0 
                ? "Good GPA - consider strategies to improve further"
                : "Focus on improving your GPA with strategic course selection";
            
            insights.push({
                type: gpaType,
                icon: Brain,
                title: "GPA Optimization",
                description: gpaMessage,
                action: "Optimize Plan"
            });
        } else {
            insights.push({
                type: "tip",
                icon: Brain,
                title: "Academic Planning",
                description: "Consider taking lighter course loads during challenging semesters",
                action: "Plan Strategy"
            });
        }

        return insights;
    };

    const aiInsights = generateAIInsights();

    if (!aiInsights || aiInsights.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay }}
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
                    <CardContent className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">
                            Unable to generate insights at this time
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            Please ensure your academic data is properly configured
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
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
                            key={`insight-${index}-${insight.title}`}
                            insight={insight}
                            delay={1.1 + index * 0.1}
                        />
                    ))}
                    <div className="text-center py-4 text-slate-500 text-sm">
                        <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        More AI insights coming soon...
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default AIInsightsPanel;