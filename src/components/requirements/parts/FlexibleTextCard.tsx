"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlexibleTextCardProps {
    text: string;
    code?: string;
    isCompleted?: boolean;
    onToggleComplete?: (identifier: string) => void;
}

export const FlexibleTextCard: React.FC<FlexibleTextCardProps> = ({ 
    text,
    code,
    isCompleted = false,
    onToggleComplete
}) => {
    // Use code if available, otherwise use text as identifier
    const identifier = code || text;

    const handleCheckboxToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleComplete) {
            onToggleComplete(identifier);
        }
    };

    const getCardTheme = () => {
        if (isCompleted) {
            return 'border-green-200 bg-green-50 hover:border-green-300';
        }
        return 'border-amber-200 bg-amber-50 hover:border-amber-300';
    };


    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ 
                scale: 1.01,
                y: -1,
                transition: { duration: 0.2, ease: "easeOut" }
            }}
            transition={{ duration: 0.3 }}
        >
            <Card 
                className={cn(
                    `${getCardTheme()} transition-all duration-200 group relative overflow-hidden border-2`,
                    isCompleted && "ring-2 ring-green-200"
                )}
            >
                <CardContent className="p-2 relative">
                    <div className="flex items-start space-x-2">
                        {/* Checkbox */}
                        {onToggleComplete && (
                            <div onClick={handleCheckboxToggle} className="mt-1">
                                <Checkbox
                                    checked={isCompleted}
                                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                />
                            </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1 mb-1">
                                {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                                <Sparkles className="h-3 w-3 text-amber-600" />
                                <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-amber-100 text-amber-700">Flex</Badge>
                                {code && <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-slate-100 text-slate-700">{code}</Badge>}
                            </div>
                            
                            <div className={cn(
                                "text-xs leading-tight font-medium line-clamp-2",
                                isCompleted ? "text-green-700 line-through" : "text-amber-800"
                            )}>
                                {text}
                            </div>
                            
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};