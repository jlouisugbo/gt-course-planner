import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SortAsc, SortDesc, Grid3X3, List, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseSearchFiltersProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  selectedFilters?: string[];
  setSelectedFilters?: (filters: string[] | ((prev: string[]) => string[])) => void;
  sortBy?: 'code' | 'difficulty' | 'credits' | 'popularity';
  setSortBy?: (sort: 'code' | 'difficulty' | 'credits' | 'popularity') => void;
  sortOrder?: 'asc' | 'desc';
  setSortOrder?: (order: 'asc' | 'desc') => void;
  viewMode?: 'grid' | 'list';
  setViewMode?: (mode: 'grid' | 'list') => void;
}

const filterOptions = [
  'CS Core', 'Math', 'Science', 'Intelligence Thread', 'Systems Thread',
  'Fall Offerings', 'Spring Offerings', 'Summer Offerings',
  'Easy (1-2)', 'Medium (3)', 'Hard (4-5)'
];

export const CourseSearchFilters: React.FC<CourseSearchFiltersProps> = ({
  searchQuery = '',
  setSearchQuery,
  selectedFilters = [],
  setSelectedFilters,
  sortBy = 'code',
  setSortBy,
  sortOrder = 'asc',
  setSortOrder,
  viewMode = 'grid',
  setViewMode,
}) => {
  const toggleFilter = (filter: string) => {
    if (setSelectedFilters) {
      setSelectedFilters(prev => {
        const safeFilters = Array.isArray(prev) ? prev : [];
        return safeFilters.includes(filter)
          ? safeFilters.filter(f => f !== filter)
          : [...safeFilters, filter];
      });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (setSearchQuery) {
      setSearchQuery(e.target.value);
    }
  };

  const handleSortChange = (value: string) => {
    if (setSortBy && ['code', 'difficulty', 'credits', 'popularity'].includes(value)) {
      setSortBy(value as any);
    }
  };

  const handleSortOrderToggle = () => {
    if (setSortOrder) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    }
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    if (setViewMode) {
      setViewMode(mode);
    }
  };

  const handleClearFilters = () => {
    if (setSelectedFilters) {
      setSelectedFilters([]);
    }
  };

  const safeSelectedFilters = Array.isArray(selectedFilters) ? selectedFilters : [];

  return (
    <Card className="border-slate-300">
      <CardContent className="px-6">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search courses by code, title, description, or instructor..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 border-slate-300"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40 border-slate-300 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value="code" className='rounded-none shadow border-slate-300 border-b cursor-pointer'>Course Code</SelectItem>
                  <SelectItem value="difficulty" className='rounded-none shadow border-slate-300 border-b cursor-pointer'>Difficulty</SelectItem>
                  <SelectItem value="credits" className='rounded-none shadow border-slate-300 border-b cursor-pointer'>Credits</SelectItem>
                  <SelectItem value="popularity" className='rounded-none shadow border-slate-300 border-b cursor-pointer'>Popularity</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSortOrderToggle}
                className="border-slate-300 cursor-pointer hover:bg-gray-200/75"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
              
              <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  className="rounded-none border-slate-300 border-r hover:bg-gray-200/75 cursor-pointer"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  className="rounded-none hover:bg-gray-200/75 cursor-pointer"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">Filters</h4>
              {safeSelectedFilters.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleClearFilters}
                  className="hover:bg-gray-200/75 border border-slate-300 cursor-pointer"
                >
                  Clear all
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <Button
                  key={filter}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-sm hover:bg-gray-200/75 border border-slate-300 cursor-pointer",
                    safeSelectedFilters.includes(filter) && "bg-[#003057] text-white hover:text-white border-[#003057] hover:bg-[#002041]"
                  )}
                  onClick={() => toggleFilter(filter)}
                >
                  {filter}
                  {safeSelectedFilters.includes(filter) && (
                    <CheckCircle className="h-3 w-3 ml-1" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};