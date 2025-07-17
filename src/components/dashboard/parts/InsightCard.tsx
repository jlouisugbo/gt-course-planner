// InsightCard.tsx - With safety checks
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
    insight?: {
        type?: "success" | "warning" | "info" | "tip";
        icon?: React.ComponentType<any>;
        title?: string;
        description?: string;
        action?: string;
    } | null;
    delay?: number;
}

const InsightCard = ({ insight, delay = 0 }: InsightCardProps) => {
    // Safe property access with fallbacks
    const safeInsight = insight || {};
    const type = safeInsight.type || "info";
    const Icon = safeInsight.icon || AlertCircle;
    const title = safeInsight.title || "No Title";
    const description = safeInsight.description || "No description available";
    const action = safeInsight.action || "Learn More";

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
                    colors[type],
                )}
            >
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="font-medium text-sm">
                                {title}
                            </h4>
                            <p className="text-sm opacity-90 mt-1">
                                {description}
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-7 px-2 text-xs"
                            >
                                {action}
                                <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default InsightCard;
