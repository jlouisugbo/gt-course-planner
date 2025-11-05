import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

interface RequirementsFilters {
  searchQuery: string;
  showCompleted: boolean;
  showIncomplete: boolean;
  selectedSemester: string;
  courseType: string;
}

interface RequirementsSearchProps {
  filters: RequirementsFilters;
  onFiltersChange: (filters: RequirementsFilters) => void;
}

export const RequirementsSearch: React.FC<RequirementsSearchProps> = ({
  filters,
  onFiltersChange
}) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const toggleFilter = (key: keyof RequirementsFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleCompletionFilter = (filterType: 'completed' | 'incomplete') => {
    const currentCompleted = filters.showCompleted;
    const currentIncomplete = filters.showIncomplete;

    if (filterType === 'completed') {
      // If both are currently on, show only completed
      if (currentCompleted && currentIncomplete) {
        onFiltersChange({ ...filters, showCompleted: true, showIncomplete: false });
      }
      // If only completed is on, show both
      else if (currentCompleted && !currentIncomplete) {
        onFiltersChange({ ...filters, showCompleted: true, showIncomplete: true });
      }
      // If completed is off, turn it on and turn incomplete off
      else {
        onFiltersChange({ ...filters, showCompleted: true, showIncomplete: false });
      }
    } else {
      // Similar logic for incomplete
      if (currentCompleted && currentIncomplete) {
        onFiltersChange({ ...filters, showCompleted: false, showIncomplete: true });
      }
      else if (!currentCompleted && currentIncomplete) {
        onFiltersChange({ ...filters, showCompleted: true, showIncomplete: true });
      }
      else {
        onFiltersChange({ ...filters, showCompleted: false, showIncomplete: true });
      }
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      showCompleted: true,
      showIncomplete: true,
      selectedSemester: 'all',
      courseType: 'all'
    });
  };

  const hasActiveFilters = filters.searchQuery || 
    !filters.showCompleted || 
    !filters.showIncomplete || 
    filters.selectedSemester !== 'all' || 
    filters.courseType !== 'all';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses, requirements..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
        </div>

        {/* Completion Status Filters */}
        <Button
          variant={filters.showCompleted ? "default" : "outline"}
          size="sm"
          onClick={() => handleCompletionFilter('completed')}
        >
          Completed
        </Button>

        <Button
          variant={filters.showIncomplete ? "default" : "outline"}
          size="sm"
          onClick={() => handleCompletionFilter('incomplete')}
        >
          Incomplete
        </Button>

        {/* Course Type Filter */}
        <div className="flex gap-1">
          {['all', 'regular', 'or_group', 'flexible', 'selection'].map((type) => (
            <Button
              key={type}
              variant={filters.courseType === type ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter('courseType', type)}
            >
              {type === 'all' ? 'All Types' : 
               type === 'or_group' ? 'OR Groups' :
               type === 'regular' ? 'Regular' : 
               type === 'selection' ? 'Selection' : 'Flexible'}
            </Button>
          ))}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.searchQuery && (
            <Badge variant="secondary">
              Search: &ldquo;{filters.searchQuery}&rdquo;
            </Badge>
          )}
          {(!filters.showCompleted || !filters.showIncomplete) && (
            <Badge variant="secondary">
              {filters.showCompleted ? 'Completed only' : 'Incomplete only'}
            </Badge>
          )}
          {filters.selectedSemester !== 'all' && (
            <Badge variant="secondary">
              {filters.selectedSemester} semester
            </Badge>
          )}
          {filters.courseType !== 'all' && (
            <Badge variant="secondary">
              {filters.courseType === 'or_group' ? 'OR Groups' :
               filters.courseType === 'regular' ? 'Regular courses' : 
               filters.courseType === 'selection' ? 'Selection courses' : 'Flexible requirements'}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};