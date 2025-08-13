"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  Star,
  Filter
} from 'lucide-react';
import { Course } from '@/types/courses';
import { usePrerequisiteValidation, PrerequisiteValidation } from '@/hooks/usePrereqValidation';
import { useCourseFiltering } from '@/hooks/useCourseFiltering';

interface CourseSuggestion extends Course {
  relevanceScore: number;
  reason: string;
  validation: PrerequisiteValidation;
  difficulty?: number;
  popularity?: number;
}

interface SmartCourseSuggestionDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseSelect: (course: Course) => void;
  semesterId?: number;
  userMajor?: string;
  userThreads?: string[];
  placeholder?: string;
  className?: string;
  maxSuggestions?: number;
}

export default function SmartCourseSuggestionDropdown({
  isOpen,
  onOpenChange,
  onCourseSelect,
  semesterId,
  userMajor,
  userThreads = [],
  placeholder = "Search and add courses...",
  className = "",
  maxSuggestions = 20
}: SmartCourseSuggestionDropdownProps) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  const { validatePrerequisites } = usePrerequisiteValidation();
  const { 
    courses, 
    filteredCourses, 
    filters, 
    updateFilters,
    isLoading 
  } = useCourseFiltering();

  // Generate smart course suggestions
  const suggestions = useMemo(() => {
    if (!courses.length) return [];

    const courseSuggestions: CourseSuggestion[] = courses.map(course => {
      const validation = validatePrerequisites(course, semesterId);
      
      let relevanceScore = 0;
      let reason = "Available course";

      // Score based on prerequisite readiness
      if (validation.canAdd) {
        relevanceScore += 30;
        reason = "Prerequisites satisfied";
      } else if (validation.warnings.length > 0 && validation.missingPrereqs.length === 0) {
        relevanceScore += 20;
        reason = "Prerequisites satisfied (with warnings)";
      } else {
        // Penalize based on number of missing prerequisites
        relevanceScore -= validation.missingPrereqs.length * 5;
        reason = `Missing ${validation.missingPrereqs.length} prerequisite(s)`;
      }

      // Boost courses related to user's major
      if (userMajor && (
        course.department === userMajor ||
        course.code.startsWith(userMajor) ||
        course.college.includes(userMajor)
      )) {
        relevanceScore += 25;
        reason = `${userMajor} major requirement`;
      }

      // Boost courses related to user's threads
      userThreads.forEach(thread => {
        if (course.title.toLowerCase().includes(thread.toLowerCase()) ||
            course.description?.toLowerCase().includes(thread.toLowerCase())) {
          relevanceScore += 15;
          reason = `${thread} thread course`;
        }
      });

      // Boost popular foundational courses
      if (course.code.match(/1\d{3}$/)) {
        relevanceScore += 10;
        reason = "Foundational course";
      }

      // Penalize high-difficulty courses early in program
      if (course.difficulty && course.difficulty > 3 && semesterId && semesterId <= 2) {
        relevanceScore -= 10;
      }

      // Boost courses with good prerequisites flow
      if (validation.suggestedSemesters?.includes(semesterId || 1)) {
        relevanceScore += 15;
        reason = "Optimal timing for prerequisites";
      }

      return {
        ...course,
        relevanceScore,
        reason,
        validation
      };
    });

    // Filter based on search
    const searchFiltered = courseSuggestions.filter(course => {
      if (!searchValue) return true;
      
      const searchLower = searchValue.toLowerCase();
      return (
        course.code.toLowerCase().includes(searchLower) ||
        course.title.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        course.department.toLowerCase().includes(searchLower)
      );
    });

    // Sort by relevance score and take top suggestions
    return searchFiltered
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxSuggestions);
  }, [courses, searchValue, validatePrerequisites, semesterId, userMajor, userThreads, maxSuggestions]);

  // Group suggestions by validation status
  const groupedSuggestions = useMemo(() => {
    const ready = suggestions.filter(s => s.validation.canAdd);
    const warnings = suggestions.filter(s => !s.validation.canAdd && s.validation.warnings.length > 0 && s.validation.missingPrereqs.length === 0);
    const blocked = suggestions.filter(s => s.validation.missingPrereqs.length > 0);

    return { ready, warnings, blocked };
  }, [suggestions]);

  const getValidationIcon = (validation: PrerequisiteValidation) => {
    if (validation.canAdd) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (validation.warnings.length > 0 && validation.missingPrereqs.length === 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <Clock className="h-4 w-4 text-red-500" />;
  };

  const renderSuggestionItem = (suggestion: CourseSuggestion) => (
    <CommandItem
      key={suggestion.id}
      value={`${suggestion.code} ${suggestion.title}`}
      onSelect={() => {
        onCourseSelect(suggestion);
        setSearchValue("");
        onOpenChange(false);
      }}
      className="p-3 cursor-pointer"
    >
      <div className="flex items-start gap-3 w-full">
        <div className="flex-shrink-0 mt-1">
          {getValidationIcon(suggestion.validation)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{suggestion.code}</span>
            <Badge variant="secondary" className="text-xs">
              {suggestion.credits} cr
            </Badge>
            {suggestion.difficulty && (
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < suggestion.difficulty! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          <p className="text-sm font-medium text-gray-900 mb-1 truncate">
            {suggestion.title}
          </p>
          
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {suggestion.description}
          </p>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {suggestion.reason}
            </Badge>
            
            {suggestion.validation.missingPrereqs.length > 0 && (
              <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                Missing: {suggestion.validation.missingPrereqs.length}
              </Badge>
            )}
            
            {suggestion.validation.warnings.length > 0 && (
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                {suggestion.validation.warnings.length} warning(s)
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-400 flex-shrink-0">
          Score: {suggestion.relevanceScore}
        </div>
      </div>
    </CommandItem>
  );

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={isOpen}
          className={`justify-between ${className}`}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {searchValue || placeholder}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search courses..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          
          <CommandList className="max-h-96">
            <CommandEmpty>
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gt-navy mx-auto mb-2"></div>
                  Loading courses...
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  No courses found. Try adjusting your search.
                </div>
              )}
            </CommandEmpty>

            {/* Ready to Add */}
            {groupedSuggestions.ready.length > 0 && (
              <CommandGroup heading="✅ Ready to Add">
                {groupedSuggestions.ready.map(renderSuggestionItem)}
              </CommandGroup>
            )}

            {/* Has Warnings */}
            {groupedSuggestions.warnings.length > 0 && (
              <CommandGroup heading="⚠️ Prerequisites with Warnings">
                {groupedSuggestions.warnings.map(renderSuggestionItem)}
              </CommandGroup>
            )}

            {/* Prerequisites Missing */}
            {groupedSuggestions.blocked.length > 0 && (
              <CommandGroup heading="🚫 Prerequisites Missing">
                {groupedSuggestions.blocked.map(renderSuggestionItem)}
              </CommandGroup>
            )}

            {/* Quick Actions */}
            {searchValue && (
              <CommandGroup heading="Quick Actions">
                <CommandItem
                  onSelect={() => {
                    // This would open advanced search/filter modal
                    console.log('Open advanced search');
                  }}
                  className="p-3"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Advanced Search & Filters</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>

        {/* Quick Stats Footer */}
        <div className="border-t bg-gray-50 p-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {groupedSuggestions.ready.length + groupedSuggestions.warnings.length + groupedSuggestions.blocked.length} courses found
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {groupedSuggestions.ready.length}
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                {groupedSuggestions.warnings.length}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-red-500" />
                {groupedSuggestions.blocked.length}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}