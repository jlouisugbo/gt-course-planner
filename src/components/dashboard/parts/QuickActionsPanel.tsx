// QuickActionsPanel.tsx - With safety checks
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickActionsPanelProps {
    delay?: number;
}

const QuickActionsPanel = ({ delay = 0 }: QuickActionsPanelProps) => {
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
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
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
                        const Icon = action?.icon || Calendar;
                        const title = action?.title || "Unknown Action";
                        const description = action?.description || "No description available";
                        const href = action?.href || "/";
                        const primary = action?.primary || false;
                        const color = action?.color || "bg-gray-500";
                        const badge = action?.badge;

                        return (
                            <Link key={index} href={href}>
                                <Button
                                    variant={primary ? "default" : "outline"}
                                    className={`w-full justify-start h-auto p-4 ${
                                        primary
                                            ? "bg-[#003057] hover:bg-[#002041]"
                                            : "border-slate-300"
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={cn("p-2 rounded-lg", color)}>
                                            <Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">{title}</div>
                                            <div className="text-sm opacity-70">
                                                {description}
                                            </div>
                                        </div>
                                        {badge && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-auto text-xs"
                                            >
                                                {badge}
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
    );
};

export default QuickActionsPanel;