"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PrerequisiteNode = string | 
  { id: string; grade?: string } | 
  ["and" | "or", ...PrerequisiteNode[]];

interface PrerequisiteDisplayProps {
  prerequisites: PrerequisiteNode[] | PrerequisiteNode;
  compact?: boolean;
  showGrades?: boolean;
  className?: string;
  onCourseClick?: (courseCode: string) => void;
}

export const PrerequisiteDisplay: React.FC<PrerequisiteDisplayProps> = ({
  prerequisites,
  compact = false,
  showGrades = true,
  className,
  onCourseClick
}) => {
  // Parse a single prerequisite node
  const parsePrerequisite = (prereq: PrerequisiteNode, depth = 0): React.ReactNode => {
    // Handle simple string (course code)
    if (typeof prereq === 'string') {
      if (prereq === 'and' || prereq === 'or') {
        return null; // These should be part of an array structure
      }
      return (
        <Badge 
          key={prereq}
          variant="outline" 
          className={cn(
            "text-xs cursor-pointer hover:bg-slate-100",
            compact ? "h-5 px-1.5" : "h-6 px-2"
          )}
          onClick={() => onCourseClick?.(prereq)}
        >
          {prereq}
        </Badge>
      );
    }

    // Handle object with id and grade
    if (typeof prereq === 'object' && !Array.isArray(prereq) && 'id' in prereq) {
      return (
        <Badge 
          key={prereq.id}
          variant="outline" 
          className={cn(
            "text-xs cursor-pointer hover:bg-slate-100",
            compact ? "h-5 px-1.5" : "h-6 px-2"
          )}
          onClick={() => onCourseClick?.(prereq.id)}
        >
          {prereq.id}{showGrades && prereq.grade && ` (${prereq.grade})`}
        </Badge>
      );
    }

    // Handle array with operator (and/or)
    if (Array.isArray(prereq)) {
      const [operator, ...operands] = prereq;
      
      if (operator === 'and' || operator === 'or') {
        const operatorBadge = operator.toUpperCase();
        const items = operands.map((item, index) => parsePrerequisite(item, depth + 1));
        
        if (compact && depth > 0) {
          // In compact mode, just show the operator inline
          return (
            <span key={`group-${depth}`} className="inline-flex items-center gap-1">
              {items.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="text-xs text-muted-foreground px-0.5">
                      {operatorBadge}
                    </span>
                  )}
                  {item}
                </React.Fragment>
              ))}
            </span>
          );
        }
        
        return (
          <div key={`group-${depth}`} className={cn(
            "inline-flex items-center gap-1",
            depth > 0 && "ml-2"
          )}>
            {depth === 0 && items.length > 1 && (
              <Badge variant="secondary" className="text-xs h-5 px-1">
                {operatorBadge}
              </Badge>
            )}
            <div className="inline-flex flex-wrap items-center gap-1">
              {items.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && depth > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {operator === 'and' ? '&' : '|'}
                    </span>
                  )}
                  {item}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      }
    }

    return null;
  };

  // Handle empty or invalid prerequisites
  if (!prerequisites || (Array.isArray(prerequisites) && prerequisites.length === 0)) {
    return (
      <Badge variant="secondary" className="text-xs">
        None
      </Badge>
    );
  }

  // Parse prerequisites based on structure
  const renderPrerequisites = () => {
    if (Array.isArray(prerequisites)) {
      // Check if it's an operator array or a list of prerequisites
      if (prerequisites.length > 0 && (prerequisites[0] === 'and' || prerequisites[0] === 'or')) {
        // It's a single operator expression
        return parsePrerequisite(prerequisites);
      } else {
        // It's a list of independent prerequisites (implicit AND)
        return (
          <div className="inline-flex flex-wrap items-center gap-1">
            {prerequisites.map((prereq, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="text-xs text-muted-foreground">
                    &
                  </span>
                )}
                {parsePrerequisite(prereq)}
              </React.Fragment>
            ))}
          </div>
        );
      }
    } else {
      // Single prerequisite
      return parsePrerequisite(prerequisites);
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {!compact && (
        <p className="text-xs font-medium text-muted-foreground">Prerequisites:</p>
      )}
      <div className="flex flex-wrap items-center gap-1">
        {renderPrerequisites()}
      </div>
    </div>
  );
};

// Additional component for showing in course cards
export const PrerequisiteBadges: React.FC<{
  prerequisites: PrerequisiteNode[] | PrerequisiteNode;
  maxShow?: number;
}> = ({ prerequisites, maxShow = 3 }) => {
  // Flatten prerequisites to get course codes
  const getCourseCodesFromPrereq = (prereq: PrerequisiteNode): string[] => {
    if (typeof prereq === 'string' && prereq !== 'and' && prereq !== 'or') {
      return [prereq];
    }
    if (typeof prereq === 'object' && !Array.isArray(prereq) && 'id' in prereq) {
      return [prereq.id];
    }
    if (Array.isArray(prereq)) {
      const [operator, ...operands] = prereq;
      if (operator === 'and' || operator === 'or') {
        return operands.flatMap(getCourseCodesFromPrereq);
      }
    }
    return [];
  };

  const allCodes = Array.isArray(prerequisites) 
    ? prerequisites.flatMap(getCourseCodesFromPrereq)
    : getCourseCodesFromPrereq(prerequisites);

  const uniqueCodes = [...new Set(allCodes)];

  if (uniqueCodes.length === 0) {
    return <Badge variant="secondary" className="text-xs h-4 px-1">None</Badge>;
  }

  return (
    <>
      {uniqueCodes.slice(0, maxShow).map(code => (
        <Badge key={code} variant="outline" className="text-xs h-4 px-1">
          {code}
        </Badge>
      ))}
      {uniqueCodes.length > maxShow && (
        <Badge variant="outline" className="text-xs h-4 px-1">
          +{uniqueCodes.length - maxShow} more
        </Badge>
      )}
    </>
  );
};