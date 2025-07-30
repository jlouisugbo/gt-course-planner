import RequirementsPanel from '@/components/requirements/RequirementsPanel';
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';

export default function RequirementsPage() {
  return (
    <AsyncErrorBoundary context="requirements">
      <RequirementsPanel />
    </AsyncErrorBoundary>
  );
}