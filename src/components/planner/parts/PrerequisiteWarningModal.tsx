"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Target
} from 'lucide-react';
import { Course } from '@/types';
import { PrerequisiteValidation } from '@/hooks/usePrereqValidation';

interface PrerequisiteWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  validation: PrerequisiteValidation | null;
  onProceedAnyway?: () => void;
  onSuggestSemester?: (semesterId: number) => void;
  showProceedOption?: boolean;
}

export default function PrerequisiteWarningModal({
  isOpen,
  onClose,
  course,
  validation,
  onProceedAnyway,
  onSuggestSemester,
  showProceedOption = true
}: PrerequisiteWarningModalProps) {
  if (!course || !validation) return null;

  const hasErrors = !validation.canAdd;
  const hasWarnings = validation.warnings.length > 0;

  const getSeverityIcon = () => {
    if (hasErrors) return <XCircle className="h-5 w-5 text-red-500" />;
    if (hasWarnings) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getSeverityColor = () => {
    if (hasErrors) return 'border-red-200 bg-red-50';
    if (hasWarnings) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSeverityIcon()}
            Prerequisite Check: {course.code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gt-navy">{course.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{course.description}</p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary">{course.credits} Credits</Badge>
              <Badge variant="outline">{course.department}</Badge>
              <Badge variant="outline">{course.college}</Badge>
            </div>
          </div>

          {/* Validation Status */}
          <Alert className={getSeverityColor()}>
            <AlertDescription className="flex items-center gap-2">
              {getSeverityIcon()}
              <span className="font-medium">
                {hasErrors 
                  ? 'Prerequisites not satisfied' 
                  : hasWarnings 
                  ? 'Prerequisites have warnings' 
                  : 'Prerequisites satisfied'}
              </span>
            </AlertDescription>
          </Alert>

          {/* Missing Prerequisites */}
          {validation.missingPrereqs.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gt-navy flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Missing Prerequisites
              </h4>
              <div className="space-y-2">
                {validation.missingPrereqs.map((prereq, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{prereq}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corequisites */}
          {validation.corequisites && validation.corequisites.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gt-navy flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Corequisites (Must Take Concurrently)
              </h4>
              <div className="space-y-2">
                {validation.corequisites.map((coreq, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{coreq}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gt-navy flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Warnings
              </h4>
              <div className="space-y-2">
                {validation.warnings.map((warning, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions && validation.suggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gt-navy flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {validation.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Semesters */}
          {validation.suggestedSemesters && validation.suggestedSemesters.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gt-navy flex items-center gap-2">
                <Target className="h-4 w-4" />
                Suggested Semesters
              </h4>
              <div className="flex flex-wrap gap-2">
                {validation.suggestedSemesters.map((semesterId) => (
                  <Button
                    key={semesterId}
                    variant="outline"
                    size="sm"
                    onClick={() => onSuggestSemester?.(semesterId)}
                    className="flex items-center gap-1"
                  >
                    <ArrowRight className="h-3 w-3" />
                    Semester {semesterId}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {showProceedOption && hasWarnings && !hasErrors && (
              <Button 
                variant="destructive"
                onClick={() => {
                  onProceedAnyway?.();
                  onClose();
                }}
              >
                Add Anyway
              </Button>
            )}

            {!hasErrors && (
              <Button 
                onClick={() => {
                  onProceedAnyway?.();
                  onClose();
                }}
                className="bg-gt-navy hover:bg-gt-navy/90"
              >
                {hasWarnings ? 'Continue' : 'Add Course'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}