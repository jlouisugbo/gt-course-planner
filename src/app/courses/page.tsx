import CourseExplorer from '@/components/courses/CourseExplorer';
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';

export default function CoursesPage() {
  return (
    <AsyncErrorBoundary context="courses">
      <CourseExplorer />
    </AsyncErrorBoundary>
  );
}