import Dashboard from '@/components/dashboard/Dashboard'
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';

export default function DashboardPage() {
    return (
        <AsyncErrorBoundary context="dashboard">
            <Dashboard />
        </AsyncErrorBoundary>
    )
}