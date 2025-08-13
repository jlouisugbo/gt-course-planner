// app/planner/page.tsx
'use client'

import { PlannerDashboard } from '@/components/planner/PlannerDashboard'
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';

export default function PlannerPage() {
  return (
    <AsyncErrorBoundary context="planner">
      <PlannerDashboard />
    </AsyncErrorBoundary>
  );
}