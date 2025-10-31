import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { CourseSearchFilters } from '@/types';

interface CourseFiltersProps {
  filters: CourseSearchFilters;
  onFiltersChange: (filters: CourseSearchFilters) => void;
  availableColleges: string[];
  isLoading?: boolean;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({
  filters,
  onFiltersChange,
  availableColleges,
  isLoading = false
}) => {
  const updateFilter = (key: keyof CourseSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleCollege = (college: string) => {
    const newColleges = filters.colleges.includes(college)
      ? filters.colleges.filter(c => c !== college)
      : [...filters.colleges, college];
    updateFilter('colleges', newColleges);
  };

  const toggleCreditHour = (credits: number) => {
    const newCredits = filters.creditHours.includes(credits)
      ? filters.creditHours.filter(c => c !== credits)
      : [...filters.creditHours, credits];
    updateFilter('creditHours', newCredits);
  };

  const toggleCourseType = (type: string) => {
    const newTypes = filters.courseTypes.includes(type)
      ? filters.courseTypes.filter(t => t !== type)
      : [...filters.courseTypes, type];
    updateFilter('courseTypes', newTypes);
  };

  const toggleSemester = (semester: string) => {
    const newSemesters = filters.semesters.includes(semester)
      ? filters.semesters.filter(s => s !== semester)
      : [...filters.semesters, semester];
    updateFilter('semesters', newSemesters);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      query: '',
      colleges: [],
      creditHours: [],
      courseTypes: [],
      semesters: [],
      hasPrerequisites: null
    });
  };

  const hasActiveFilters = filters.colleges.length > 0 || 
                          filters.creditHours.length > 0 || 
                          filters.courseTypes.length > 0 || 
                          filters.semesters.length > 0 || 
                          filters.hasPrerequisites !== null;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground w-fit self-start sm:self-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Colleges */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Colleges</h3>
          <div className="space-y-2">
            {availableColleges.map((college) => (
              <div key={college} className="flex items-center space-x-2">
                <Checkbox
                  id={`college-${college}`}
                  checked={filters.colleges.includes(college)}
                  onCheckedChange={() => toggleCollege(college)}
                />
                <label
                  htmlFor={`college-${college}`}
                  className="text-sm text-foreground cursor-pointer"
                >
                  {college}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Hours */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Credit Hours</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {[1, 2, 3, 4, 5].map((credits) => (
              <Badge
                key={credits}
                variant={filters.creditHours.includes(credits) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 text-xs px-2 py-1 whitespace-nowrap"
                onClick={() => toggleCreditHour(credits)}
              >
                {credits} {credits === 1 ? 'credit' : 'credits'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Course Types */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Course Types</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {['core', 'elective', 'lab'].map((type) => (
              <Badge
                key={type}
                variant={filters.courseTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 capitalize text-xs px-2 py-1 whitespace-nowrap"
                onClick={() => toggleCourseType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Semesters Offered */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Semesters Offered</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {['Fall', 'Spring', 'Summer'].map((semester) => (
              <Badge
                key={semester}
                variant={filters.semesters.includes(semester) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 text-xs px-2 py-1 whitespace-nowrap"
                onClick={() => toggleSemester(semester)}
              >
                {semester}
              </Badge>
            ))}
          </div>
        </div>

        {/* Prerequisites */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Prerequisites</h3>
          <Select
            value={filters.hasPrerequisites === null ? "all" : filters.hasPrerequisites ? "yes" : "no"}
            onValueChange={(value) => {
              const hasPrereqs = value === "all" ? null : value === "yes";
              updateFilter('hasPrerequisites', hasPrereqs);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="yes">Has Prerequisites</SelectItem>
              <SelectItem value="no">No Prerequisites</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground mb-2">Active Filters</h3>
            <div className="flex flex-wrap gap-2 items-center">
              {filters.colleges.map((college) => (
                <Badge key={college} variant="secondary" className="text-xs px-2 py-1 flex items-center gap-1">
                  <span className="truncate max-w-[120px]">{college}</span>
                  <button
                    type="button"
                    className="h-4 w-4 flex items-center justify-center cursor-pointer hover:bg-destructive/20 rounded"
                    onClick={() => toggleCollege(college)}
                    aria-label={`Remove ${college} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.creditHours.map((credits) => (
                <Badge key={credits} variant="secondary" className="text-xs px-2 py-1 flex items-center gap-1">
                  <span>{credits} cr</span>
                  <button
                    type="button"
                    className="h-4 w-4 flex items-center justify-center cursor-pointer hover:bg-destructive/20 rounded"
                    onClick={() => toggleCreditHour(credits)}
                    aria-label={`Remove ${credits} credits filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.courseTypes.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs px-2 py-1 flex items-center gap-1 capitalize">
                  <span>{type}</span>
                  <button
                    type="button"
                    className="h-4 w-4 flex items-center justify-center cursor-pointer hover:bg-destructive/20 rounded"
                    onClick={() => toggleCourseType(type)}
                    aria-label={`Remove ${type} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.semesters.map((semester) => (
                <Badge key={semester} variant="secondary" className="text-xs px-2 py-1 flex items-center gap-1">
                  <span>{semester}</span>
                  <button
                    type="button"
                    className="h-4 w-4 flex items-center justify-center cursor-pointer hover:bg-destructive/20 rounded"
                    onClick={() => toggleSemester(semester)}
                    aria-label={`Remove ${semester} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.hasPrerequisites !== null && (
                <Badge variant="secondary" className="text-xs px-2 py-1 flex items-center gap-1">
                  <span>{filters.hasPrerequisites ? 'Has' : 'No'} Prerequisites</span>
                  <button
                    type="button"
                    className="h-4 w-4 flex items-center justify-center cursor-pointer hover:bg-destructive/20 rounded"
                    onClick={() => updateFilter('hasPrerequisites', null)}
                    aria-label="Remove prerequisites filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};