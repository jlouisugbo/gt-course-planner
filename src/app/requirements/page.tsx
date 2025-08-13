import { RequirementsDashboard } from '@/components/requirements/RequirementsDashboard';
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';

export default function RequirementsPage() {
  return (
    <AsyncErrorBoundary context="requirements">
      <RequirementsDashboard />
    </AsyncErrorBoundary>
  );
}