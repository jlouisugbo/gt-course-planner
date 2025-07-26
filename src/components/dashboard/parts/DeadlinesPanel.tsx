"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Clock } from "lucide-react";
import Link from "next/link";

interface DeadlinesPanelProps {
    deadlines?: any[];
    delay?: number;
}

const DeadlinesPanel = ({ deadlines, delay = 0 }: DeadlinesPanelProps) => {
    // Dummy data for deadlines testing
    const dummyDeadlines = [
        {
            "id": 1,
            "title": "Fall 2025 Registration Deadline",
            "description": "Last day to register without a late fee.",
            "type": "registration",
            "date": "2025-08-16",
            "time": "17:00",
            "source": "https://registrar.gatech.edu/calendars"
        },
        {
            "id": 2,
            "title": "Thread Declaration Deadline",
            "description": "Deadline to declare threads for CS majors.",
            "type": "thread-confirmation",
            "date": "2025-08-30",
            "time": null,
            "source": "https://catalog.gatech.edu/colleges/cc/cs/undergraduate/#threadstext"
        },
        {
            "id": 3,
            "title": "Withdrawal Deadline (W)",
            "description": "Last day to withdraw from a course with a W.",
            "type": "withdrawal",
            "date": "2025-10-20",
            "time": "16:00",
            "source": "https://registrar.gatech.edu/calendars"
        },
        {
            "id": 4,
            "title": "Graduation Application Due",
            "description": "Submit graduation application for Fall 2025.",
            "type": "graduation",
            "date": "2025-09-10",
            "time": null,
            "source": "https://registrar.gatech.edu/students/graduation"
        }
    ]

    // Safe array access and validation
    const safeDeadlines = Array.isArray(deadlines) ? deadlines : dummyDeadlines;
    
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
                                const timestamp = deadline?.date;
                                const time = (Number(deadline?.time?.slice(0, 2)) % 12) + deadline?.time?.slice(2);
                                const source = deadline?.source;
                                
                                // Safe date formatting
                                let formattedDate = "Unknown date";
                                if (timestamp) {
                                    try {
                                        const date = new Date(timestamp);
                                        if (!isNaN(date.getTime())) {
                                            formattedDate = date.toLocaleDateString();
                                        }
                                    } catch (error) {
                                        console.warn("Invalid timestamp:", timestamp, error);
                                    }
                                }

                                // Safe time formatting
                                let formattedTime = null;
                                if (typeof time === 'string' && time !== 'NaN') {
                                    formattedTime = time;
                                }

                                return (
                                    <motion.div
                                        key={deadlineId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.2 + index * 0.1 }}
                                        className="flex items-center space-x-3 p-3 rounded-lg border border-slate-300 transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900">
                                                {title}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formattedDate} {formattedTime}
                                            </p>
                                        </div>

                                        <div className="flex-1 min-w-0 text-ellipsis line-clamp-2">
                                            <p className="text-sm text-slate-500">
                                                {description}
                                            </p>
                                        </div>

                                        <Link href={source} target="_blank" className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-2">
                                            <Eye className="h-4 w-4" />
                                        </Link>
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