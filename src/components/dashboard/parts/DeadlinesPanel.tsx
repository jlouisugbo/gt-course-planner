"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Eye, Clock } from "lucide-react";
import Link from "next/link";
import { Deadline } from "@/types/dashboard";

interface DeadlinesPanelProps {
    deadlines?: Deadline[];
    delay?: number;
}

const DeadlinesPanel = ({ deadlines, delay = 0 }: DeadlinesPanelProps) => {
    // Mock data that matches the actual database structure (using 'date' field)
    const mockDeadlines: Deadline[] = [
        {
            id: 1,
            title: "Fall 2024 Registration Deadline",
            description: "Last day to register for Fall 2024 semester without a late fee.",
            date: "2024-08-16T17:00:00-04:00",
            type: "registration",
            category: "academic",
            urgent: true,
            is_active: true,
            source: "https://registrar.gatech.edu/calendars"
        },
        {
            id: 2,
            title: "Thread Declaration Deadline",
            description: "Deadline to declare computing threads for Computer Science majors.",
            date: "2024-08-30T23:59:59-04:00",
            type: "thread-confirmation",
            category: "academic",
            urgent: false,
            is_active: true,
            source: "https://catalog.gatech.edu/colleges/cc/cs/undergraduate/#threadstext"
        },
        {
            id: 3,
            title: "Fall 2024 Withdrawal Deadline (W)",
            description: "Last day to withdraw from a course with a 'W' grade.",
            date: "2024-10-20T16:00:00-04:00",
            type: "withdrawal",
            category: "academic",
            urgent: false,
            is_active: true,
            source: "https://registrar.gatech.edu/calendars"
        },
        {
            id: 4,
            title: "Fall 2024 Graduation Application Due",
            description: "Submit graduation application for Fall 2024 commencement.",
            date: "2024-09-10T23:59:59-04:00",
            type: "graduation",
            category: "academic",
            urgent: true,
            is_active: true,
            source: "https://registrar.gatech.edu/students/graduation"
        },
        {
            id: 5,
            title: "Spring 2025 FAFSA Deadline",
            description: "Priority deadline for submitting Free Application for Federal Student Aid.",
            date: "2024-11-15T23:59:59-05:00",
            type: "financial",
            category: "financial aid",
            urgent: false,
            is_active: true,
            source: "https://finaid.gatech.edu/"
        }
    ];

    // Safe array access and validation
    const safeDeadlines = Array.isArray(deadlines) ? deadlines : mockDeadlines;
    
    // Filter and validate deadline items
    const validDeadlines = safeDeadlines.filter(deadline => 
        deadline && 
        typeof deadline === 'object' &&
        deadline.id !== undefined
    );

    // Take only first 5 deadlines
    const displayDeadlines = validDeadlines.slice(0, 5);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="border-slate-300">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Deadlines
                    </CardTitle>
                    <CardDescription>
                        Upcoming deadlines to keep in mind
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {displayDeadlines.length > 0 ? (
                            displayDeadlines.map((deadline, index) => {
                                // Safe property access for each deadline
                                const deadlineId = deadline?.id || `deadline-${index}`;
                                const title = deadline?.title || "Unknown Deadline";
                                const description = deadline?.description || "No description available";
                                const dateString = deadline?.date;
                                const source = deadline?.source;
                                const isUrgent = deadline?.urgent || false;
                                
                                // Safe date and time formatting from date field
                                let formattedDate = "Unknown date";
                                let formattedTime = "";
                                if (dateString) {
                                    try {
                                        const date = new Date(dateString);
                                        if (!isNaN(date.getTime())) {
                                            formattedDate = date.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            });
                                            formattedTime = date.toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            });
                                        }
                                    } catch (error) {
                                        console.warn("Invalid date:", dateString, error);
                                    }
                                }

                                return (
                                    <motion.div
                                        key={deadlineId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.2 + index * 0.1 }}
                                        className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border transition-colors group ${
                                            isUrgent
                                                ? 'border-red-300 bg-red-50 hover:bg-red-100'
                                                : 'border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className={`text-sm font-medium truncate ${
                                                    isUrgent ? 'text-red-900' : 'text-slate-900'
                                                }`}>
                                                    {title}
                                                </p>
                                                {isUrgent && (
                                                    <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-200 rounded-full flex-shrink-0">
                                                        URGENT
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs mt-1 ${
                                                isUrgent ? 'text-red-600' : 'text-slate-400'
                                            }`}>
                                                {formattedDate} {formattedTime && `at ${formattedTime}`}
                                            </p>
                                        </div>

                                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                                            <p className="text-sm text-slate-500 line-clamp-2 break-words">
                                                {description}
                                            </p>
                                        </div>

                                        {source && (
                                            <Link 
                                                href={source} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-2 hover:bg-slate-100 rounded"
                                                title="View official GT page"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        )}
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No upcoming deadlines</p>
                                <p className="text-xs mt-1">
                                    Be sure to check for other important dates not listed here!
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default DeadlinesPanel;