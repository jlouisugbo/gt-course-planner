// app/planner/page.tsx
'use client'

import PlannerGrid from '@/components/planner/PlannerGrid'
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';

export default function PlannerPage() {
  return (
    <AsyncErrorBoundary context="planner">
      <PlannerGrid />
    </AsyncErrorBoundary>
  );
}