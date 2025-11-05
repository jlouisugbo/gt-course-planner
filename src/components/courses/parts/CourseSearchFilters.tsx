import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/lib/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
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
  onSearchSubmit?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isSearching?: boolean;
  onRequirementFilter?: (requirementName: string) => void;
}

// Comprehensive filter options organized by category
const filterCategories = {
  difficulty: [
    'Easy (1-2)', 'Medium (3)', 'Hard (4-5)'
  ],
  credits: [
    '1 Credit', '2 Credits', '3 Credits', '4 Credits', '5+ Credits'
  ],
  offerings: [
    'Fall Offerings', 'Spring Offerings', 'Summer Offerings', 'All Semesters'
  ],
  subjects: [
    'CS', 'MATH', 'PHYS', 'CHEM', 'BIOL', 'ECE', 'ME', 'AE', 'CEE', 'MSE', 'ISYE'
  ],
  level: [
    '1000-Level', '2000-Level', '3000-Level', '4000-Level', '6000+ Level'
  ],
  requirements: [
    'Has Prerequisites', 'No Prerequisites', 'Lab Component', 'Core Course'
  ]
};


const CourseSearchFiltersComponent: React.FC<CourseSearchFiltersProps> = ({
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
  onSearchSubmit,
  isSearching = false,
  onRequirementFilter,
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [requirementCategories, setRequirementCategories] = useState<string[]>([]);
  const [, setIsLoadingCategories] = useState(true);

  // Fetch requirement categories from degree program
  useEffect(() => {
    const fetchRequirementCategories = async () => {
      if (!user || !profile?.major) {
        setIsLoadingCategories(false);
        return;
      }

      try {
        // Get degree program requirements with authentication
        const { data: sessionData } = await authService.getSession();
        if (!sessionData.session?.access_token) return;

        const degreeResponse = await fetch(`/api/degree-programs?major=${encodeURIComponent(profile.major)}&degree_type=BS`, {
            headers: {
                'Authorization': `Bearer ${sessionData.session.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!degreeResponse.ok) return;

        const degreeData = await degreeResponse.json();

        if (degreeData.requirements && Array.isArray(degreeData.requirements)) {
          const categories = degreeData.requirements.map((req: any) => req.name).filter(Boolean);
          setRequirementCategories(categories);
        }
      } catch (error) {
        console.warn('Failed to fetch requirement categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchRequirementCategories();
  }, [user, profile]);

  const toggleFilter = useCallback((filter: string) => {
    if (setSelectedFilters) {
      setSelectedFilters(prev => {
        const safeFilters = Array.isArray(prev) ? prev : [];
        return safeFilters.includes(filter)
          ? safeFilters.filter(f => f !== filter)
          : [...safeFilters, filter];
      });
    }
  }, [setSelectedFilters]);

  const handleRequirementClick = useCallback((filter: string) => {
    // Check if this is a degree requirement filter
    if (requirementCategories.includes(filter)) {
      if (onRequirementFilter) {
        onRequirementFilter(filter);
        return;
      }
    }
    // Otherwise, use normal filter logic
    toggleFilter(filter);
  }, [requirementCategories, onRequirementFilter, toggleFilter]);

  const [localSearchValue, setLocalSearchValue] = useState(searchQuery);

  // Update local value when external searchQuery changes
  useEffect(() => {
    setLocalSearchValue(searchQuery);
  }, [searchQuery]);

  // Debounce the search query updates to prevent lag
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (setSearchQuery && localSearchValue !== searchQuery) {
        setSearchQuery(localSearchValue);
      }
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [localSearchValue, setSearchQuery, searchQuery]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchValue(e.target.value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    if (setSortBy && ['code', 'difficulty', 'credits', 'popularity'].includes(value)) {
      setSortBy(value as any);
    }
  }, [setSortBy]);

  const handleSortOrderToggle = useCallback(() => {
    if (setSortOrder) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    }
  }, [setSortOrder, sortOrder]);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    if (setViewMode) {
      setViewMode(mode);
    }
  }, [setViewMode]);

  const handleClearFilters = useCallback(() => {
    if (setSelectedFilters) {
      setSelectedFilters([]);
    }
  }, [setSelectedFilters]);

  const safeSelectedFilters = useMemo(() => 
    Array.isArray(selectedFilters) ? selectedFilters : [], 
    [selectedFilters]
  );

  return (
    <Card className="border-slate-300 py-3">
      <CardContent className="px-4">
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
            <div className="flex-1 relative flex">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search courses by code, title, description, or instructor... (Press Enter to search)"
                  value={localSearchValue}
                  onChange={handleSearchChange}
                  onKeyDown={onSearchSubmit}
                  className="pl-10 pr-4 border-slate-300 rounded-r-none h-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => onSearchSubmit?.(new KeyboardEvent('keydown', { key: 'Enter' }) as any)}
                disabled={isSearching}
                className="border-slate-300 border-l-0 rounded-l-none hover:bg-blue-50 px-3 h-9"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-32 border-slate-300 cursor-pointer h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value="code" className='rounded-none shadow border-slate-300 border-b cursor-pointer text-sm'>Code</SelectItem>
                  <SelectItem value="difficulty" className='rounded-none shadow border-slate-300 border-b cursor-pointer text-sm'>Difficulty</SelectItem>
                  <SelectItem value="credits" className='rounded-none shadow border-slate-300 border-b cursor-pointer text-sm'>Credits</SelectItem>
                  <SelectItem value="popularity" className='rounded-none shadow border-slate-300 border-b cursor-pointer text-sm'>Popular</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSortOrderToggle}
                className="border-slate-300 cursor-pointer hover:bg-gray-200/75 h-9 w-9 p-0"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
              
              <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  className={`rounded-none border-slate-300 border-r hover:bg-gray-200/75 cursor-pointer h-9 w-9 p-0 ${viewMode === 'grid' && 'bg-slate-300/50'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  className={`rounded-none hover:bg-gray-200/75 cursor-pointer h-9 w-9 p-0 ${viewMode === 'list' && 'bg-slate-300/50'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Tags */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">
                Filters {safeSelectedFilters.length > 0 && (
                  <span className="text-xs text-slate-500 ml-1">({safeSelectedFilters.length} active)</span>
                )}
              </h4>
              {safeSelectedFilters.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="hover:bg-gray-200/75 border border-slate-300 cursor-pointer text-xs h-6 px-2"
                >
                  Clear all
                </Button>
              )}
            </div>
            
            {/* Organized Filter Categories */}
            <div className="space-y-2">
              {/* Popular/Quick Filters */}
              <div>
                <h5 className="text-xs font-medium text-slate-600 mb-1.5">Quick Filters</h5>
                <div className="flex flex-wrap gap-1">
                  {filterCategories.difficulty.map((filter) => (
                    <Button
                      key={filter}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "text-xs hover:bg-gray-200/75 border border-slate-300 cursor-pointer h-6 px-1.5",
                        safeSelectedFilters.includes(filter) && "bg-[#003057] text-white hover:text-white border-[#003057] hover:bg-[#002041]"
                      )}
                      onClick={() => toggleFilter(filter)}
                    >
                      {filter}
                      {safeSelectedFilters.includes(filter) && (
                        <CheckCircle className="h-2 w-2 ml-1" />
                      )}
                    </Button>
                  ))}
                  {filterCategories.level.map((filter) => (
                    <Button
                      key={filter}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "text-xs hover:bg-gray-200/75 border border-slate-300 cursor-pointer h-6 px-1.5",
                        safeSelectedFilters.includes(filter) && "bg-[#003057] text-white hover:text-white border-[#003057] hover:bg-[#002041]"
                      )}
                      onClick={() => toggleFilter(filter)}
                    >
                      {filter}
                      {safeSelectedFilters.includes(filter) && (
                        <CheckCircle className="h-2 w-2 ml-1" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Subject Filters */}
              <div>
                <h5 className="text-xs font-medium text-slate-600 mb-1.5">Subjects</h5>
                <div className="flex flex-wrap gap-1">
                  {filterCategories.subjects.map((filter) => (
                    <Button
                      key={filter}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "text-xs hover:bg-gray-200/75 border border-slate-300 cursor-pointer h-6 px-1.5 font-mono",
                        safeSelectedFilters.includes(filter) && "bg-blue-600 text-white hover:text-white border-blue-600 hover:bg-blue-700"
                      )}
                      onClick={() => toggleFilter(filter)}
                    >
                      {filter}
                      {safeSelectedFilters.includes(filter) && (
                        <CheckCircle className="h-2 w-2 ml-1" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Additional Filters */}
              <div>
                <h5 className="text-xs font-medium text-slate-600 mb-1.5">Additional</h5>
                <div className="flex flex-wrap gap-1">
                  {[...filterCategories.credits, ...filterCategories.offerings, ...filterCategories.requirements].map((filter) => (
                    <Button
                      key={filter}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "text-xs hover:bg-gray-200/75 border border-slate-300 cursor-pointer h-6 px-1.5",
                        safeSelectedFilters.includes(filter) && "bg-green-600 text-white hover:text-white border-green-600 hover:bg-green-700"
                      )}
                      onClick={() => toggleFilter(filter)}
                    >
                      {filter}
                      {safeSelectedFilters.includes(filter) && (
                        <CheckCircle className="h-2 w-2 ml-1" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Requirement Categories from User's Degree */}
              {requirementCategories.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-slate-600 mb-1.5">Your Degree Requirements</h5>
                  <div className="flex flex-wrap gap-1">
                    {requirementCategories.map((filter) => (
                      <Button
                        key={filter}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "text-xs hover:bg-gray-200/75 border border-slate-300 cursor-pointer h-6 px-1.5",
                          safeSelectedFilters.includes(filter) && "bg-[#B3A369] text-white hover:text-white border-[#B3A369] hover:bg-[#9c8f5c]"
                        )}
                        onClick={() => handleRequirementClick(filter)}
                      >
                        {filter}
                        {safeSelectedFilters.includes(filter) && (
                          <CheckCircle className="h-2 w-2 ml-1" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CourseSearchFilters = React.memo(CourseSearchFiltersComponent);