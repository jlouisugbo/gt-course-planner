"use client";

import React, { useRef } from "react";
import { StandardizedModal, ModalActions } from "@/components/ui/standardized-modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
    BookOpen, 
    Clock, 
    Building, 
    Users, 
    CheckCircle, 
    AlertTriangle,
    ExternalLink
} from "lucide-react";
import { EnhancedCourse } from "@/types/requirements";
import { Button } from "@/components/ui/button";

interface CourseModalProps {
    course: EnhancedCourse;
    isOpen: boolean;
    onClose: () => void;
    programType: 'degree' | 'minor';
    isCompleted?: boolean;
    isPlanned?: boolean;
    onToggleComplete?: (courseCode: string) => void;
    onAddToPlanner?: (courseCode: string) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
    course,
    isOpen,
    onClose,
    programType,
    isCompleted = false,
    isPlanned = false,
    onToggleComplete,
    onAddToPlanner
}) => {
    const getThemeColors = () => {
        return programType === 'degree' 
            ? { accent: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
            : { accent: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    };

    const { accent, bg, border } = getThemeColors();

    // Focus management
    const primaryActionRef = useRef<HTMLButtonElement>(null);

    return (
        <StandardizedModal
            isOpen={isOpen}
            onClose={onClose}
            title={course.code}
            description={`${course.title} • ${course.credits || 3} Credits`}
            size="lg"
            initialFocus={primaryActionRef}
        >

                <div className="p-6 space-y-6">
                    {/* Course Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Credits */}
                        <Card className={`${border} ${bg}`}>
                            <CardContent className="py-2 px-2">
                                <div className="flex items-center space-x-3">
                                    <Clock className={`h-5 w-5 ${accent}`} />
                                    <div>
                                        <div className="font-medium text-slate-900">Credits</div>
                                        <div className="text-sm text-slate-600">
                                            {course.credits || 3} credit hours
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Department */}
                        {course.department && (
                            <Card className={`${border} ${bg}`}>
                                <CardContent className="py-2 px-2">
                                    <div className="flex items-center space-x-3">
                                        <Users className={`h-5 w-5 ${accent}`} />
                                        <div>
                                            <div className="font-medium text-slate-900">Department</div>
                                            <div className="text-sm text-slate-600">
                                                {course.department}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* College */}
                        {course.college && (
                            <Card className={`${border} ${bg}`}>
                                <CardContent className="py-2 px-2">
                                    <div className="flex items-center space-x-3">
                                        <Building className={`h-5 w-5 ${accent}`} />
                                        <div>
                                            <div className="font-medium text-slate-900">College</div>
                                            <div className="text-sm text-slate-600">
                                                {course.college}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Course Type */}
                        <Card className={`${border} ${bg}`}>
                            <CardContent className="py-2 px-2">
                                <div className="flex items-center space-x-3">
                                    <BookOpen className={`h-5 w-5 ${accent}`} />
                                    <div>
                                        <div className="font-medium text-slate-900">Type</div>
                                        <div className="text-sm text-slate-600">
                                            {course.courseType === 'regular' ? 'Required' : 
                                             course.courseType === 'or_option' ? 'Option' :
                                             course.courseType}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Course Description */}
                    {course.description && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                                <BookOpen className={`h-5 w-5 ${accent} mr-2`} />
                                Course Description
                            </h3>
                            <Card>
                                <CardContent className="py-2 px-2">
                                    <p className="text-slate-700 leading-relaxed">
                                        {course.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Prerequisites */}
                    {course.prerequisites && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                                Prerequisites
                            </h3>
                            <Card className="border-orange-200 bg-orange-50">
                                <CardContent className="py-2 px-2">
                                    <p className="text-slate-700">
                                        {course.prerequisites}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Additional Information */}
                    {(course.isOption || course.footnoteRefs.length > 0) && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                                <CheckCircle className={`h-5 w-5 ${accent} mr-2`} />
                                Additional Information
                            </h3>
                            <div className="space-y-3">
                                {course.isOption && (
                                    <Card className="border-orange-200 bg-orange-50">
                                        <CardContent className="py-2 px-2">
                                            <div className="flex items-center space-x-2">
                                                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                                    Option Course
                                                </Badge>
                                                <span className="text-sm text-slate-600">
                                                    This is an optional course within the requirement
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                
                                {course.footnoteRefs.length > 0 && (
                                    <Card>
                                        <CardContent className="py-2 px-2">
                                            <div className="space-y-2">
                                                <div className="font-medium text-slate-900">Footnote References:</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {course.footnoteRefs.map((ref) => (
                                                        <Badge key={ref} variant="outline">
                                                            Note {ref}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}

                    <Separator />

                </div>
                
                <ModalActions>
                    {/* Completion Toggle Button */}
                    {onToggleComplete && (
                        <Button
                            ref={primaryActionRef}
                            variant={isCompleted ? "default" : "outline"}
                            onClick={() => onToggleComplete(course.code)}
                            className={`flex items-center space-x-2 ${
                                isCompleted 
                                    ? "bg-green-600 hover:bg-green-700 text-white" 
                                    : "border-green-600 text-green-600 hover:bg-green-50"
                            }`}
                        >
                            <CheckCircle className="h-4 w-4" />
                            <span>{isCompleted ? "Completed" : "Mark Complete"}</span>
                        </Button>
                    )}
                    
                    {/* Add to Planner Button */}
                    {onAddToPlanner && !isPlanned && (
                        <Button
                            ref={!onToggleComplete ? primaryActionRef : undefined}
                            variant="outline"
                            onClick={() => onAddToPlanner(course.code)}
                            className="flex items-center space-x-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                            <Building className="h-4 w-4" />
                            <span>Add to Planner</span>
                        </Button>
                    )}
                    
                    <Button
                        variant="outline"
                        onClick={() => {
                            // Open course catalog or more details
                            window.open(`https://catalog.gatech.edu/courses/${course.code.toLowerCase().replace(' ', '')}/`, '_blank');
                        }}
                        className="flex items-center space-x-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span>View in Catalog</span>
                    </Button>
                    
                    <Button onClick={onClose} className={`${accent} hover:opacity-90`}>
                        Close
                    </Button>
                </ModalActions>
        </StandardizedModal>
    );
};