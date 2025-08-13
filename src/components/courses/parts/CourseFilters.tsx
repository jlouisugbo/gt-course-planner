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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
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
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((credits) => (
              <Badge
                key={credits}
                variant={filters.creditHours.includes(credits) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
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
          <div className="flex flex-wrap gap-2">
            {['core', 'elective', 'lab'].map((type) => (
              <Badge
                key={type}
                variant={filters.courseTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 capitalize"
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
          <div className="flex flex-wrap gap-2">
            {['Fall', 'Spring', 'Summer'].map((semester) => (
              <Badge
                key={semester}
                variant={filters.semesters.includes(semester) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
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
            <div className="flex flex-wrap gap-1">
              {filters.colleges.map((college) => (
                <Badge key={college} variant="secondary" className="text-xs">
                  {college}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleCollege(college)}
                  />
                </Badge>
              ))}
              {filters.creditHours.map((credits) => (
                <Badge key={credits} variant="secondary" className="text-xs">
                  {credits} cr
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleCreditHour(credits)}
                  />
                </Badge>
              ))}
              {filters.courseTypes.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs capitalize">
                  {type}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleCourseType(type)}
                  />
                </Badge>
              ))}
              {filters.semesters.map((semester) => (
                <Badge key={semester} variant="secondary" className="text-xs">
                  {semester}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleSemester(semester)}
                  />
                </Badge>
              ))}
              {filters.hasPrerequisites !== null && (
                <Badge variant="secondary" className="text-xs">
                  {filters.hasPrerequisites ? 'Has' : 'No'} Prerequisites
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('hasPrerequisites', null)}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};