// src/app/test/page.tsx
import { CourseCombobox } from '@/components/course/CourseExplorer';
import { Dashboard } from '@/components/dashboard/Dashboard';
export default function TestPage() {
    

    return (
    <div className="p-8 space-y-8">
        <h1>Majors Testing</h1>
        
        <section>
        <h2>Major and Minor Combobox </h2>
        <CourseCombobox />
        </section>

        <section>
            <h2>Drag Drop testing</h2>
            <Dashboard />
        </section>
    </div>
    );
}