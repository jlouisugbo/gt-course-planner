"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Lock, AlertTriangle } from 'lucide-react';
import { Course } from '@/types/courses';
import { evaluatePrerequisites, PrereqValidationResult } from '@/lib/prereqUtils';
import { cn } from '@/lib/utils';

interface PrereqModalProps {
    course: Course | null;
    isOpen: boolean;
    onClose: () => void;
    completedCourses: Set<string>;
    plannedCourses: Set<string>;
    allCourses: Course[];
}

export const PrereqModal: React.FC<PrereqModalProps> = ({
    course,
    isOpen,
    onClose,
    completedCourses,
    plannedCourses,
    allCourses
}) => {
    if (!course) return null;

    const prereqResult: PrereqValidationResult = evaluatePrerequisites(
        course.prerequisites,
        completedCourses,
        plannedCourses
    );

    

    const renderPrereqStructure = (prereqData: any, level = 0) => {
        if (!prereqData || !Array.isArray(prereqData) || prereqData.length === 0) {
            return (
                <div className="text-sm text-slate-500 italic">
                    No prerequisites required
                </div>
            );
        }

        const [operator, ...requirements] = prereqData;
        
        if (operator === 'and' || operator === 'or') {
            return (
                <div className={`space-y-3 ${level > 0 ? 'ml-4 pl-4 border-l-2 border-slate-200' : ''}`}>
                    <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={cn(
                            "text-xs font-semibold",
                            operator === 'and' ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
                        )}>
                            {operator.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-slate-600">
                            {operator === 'and' ? 'All of the following:' : 'Any one of the following:'}
                        </span>
                    </div>
                    
                    <div className="space-y-2">
                        {requirements.map((req, index) => {
                            if (typeof req === 'object' && req.id) {
                                const isCompleted = completedCourses.has(req.id);
                                const isPlanned = plannedCourses.has(req.id);
                                const courseDetail = allCourses.find(c => c.code === req.id);
                                
                                return (
                                    <Card key={index} className={cn(
                                        "border-2 transition-colors",
                                        isCompleted ? "border-green-200 bg-green-50" :
                                        isPlanned ? "border-blue-200 bg-blue-50" :
                                        "border-red-200 bg-red-50"
                                    )}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {isCompleted ? (
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                    ) : isPlanned ? (
                                                        <Clock className="h-5 w-5 text-blue-600" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{req.id}</div>
                                                        <div className="text-sm text-slate-600">
                                                            {courseDetail?.title || 'Course not found'}
                                                        </div>
                                                        {req.grade && req.grade !== 'D' && (
                                                            <div className="text-xs text-slate-500">
                                                                Minimum grade: {req.grade}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge variant={isCompleted ? "default" : isPlanned ? "secondary" : "destructive"}>
                                                    {isCompleted ? "Completed" : isPlanned ? "Planned" : "Missing"}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            } else if (Array.isArray(req)) {
                                return (
                                    <div key={index}>
                                        {renderPrereqStructure(req, level + 1)}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            prereqResult.isValid ? "bg-green-100" : "bg-red-100"
                        )}>
                            {prereqResult.isValid ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                                <Lock className="h-5 w-5 text-red-600" />
                            )}
                        </div>
                        <div>
                            <span className="text-xl font-bold">{course.code} Prerequisites</span>
                            <p className="text-sm text-slate-600 font-normal">{course.title}</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status Summary */}
                    <Card className={cn(
                        "border-2",
                        prereqResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                    )}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {prereqResult.isValid ? (
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="h-6 w-6 text-red-600" />
                                    )}
                                    <div>
                                        <div className="font-semibold">
                                            {prereqResult.isValid 
                                                ? "Prerequisites Satisfied" 
                                                : "Prerequisites Not Met"
                                            }
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            {prereqResult.isValid 
                                                ? "You can take this course" 
                                                : `${prereqResult.missingCourses.length} requirement(s) missing`
                                            }
                                        </div>
                                    </div>
                                </div>
                                <Badge 
                                    variant={prereqResult.isValid ? "default" : "destructive"}
                                    className="text-sm px-3 py-1"
                                >
                                    {prereqResult.isValid ? "Available" : "Locked"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Prerequisites Structure */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Prerequisite Requirements</h3>
                        {renderPrereqStructure(course.prerequisites)}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        {!prereqResult.isValid && (
                            <Button variant="secondary" onClick={onClose}>
                                Plan Missing Prerequisites
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};