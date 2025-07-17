import React from 'react';

interface CourseExplorerHeaderProps {
  bookmarkedCount?: number;
}

export const CourseExplorerHeader: React.FC<CourseExplorerHeaderProps> = ({
  bookmarkedCount = 0,
}) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Course Explorer</h1>
      <p className="text-lg text-slate-600 mt-2">
        Discover and explore courses for your academic plan
        {bookmarkedCount > 0 && (
          <span className="ml-2 text-sm text-[#B3A369] font-medium">
            • {bookmarkedCount} bookmarked
          </span>
        )}
      </p>
    </div>
  );
};