// src/app/test/page.tsx
'use client';

import { useState } from 'react';
import { CourseCombobox } from '@/components/course/CourseExplorer';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { MajorMinorSelection } from '@/types/types';

export default function TestPage() {
    const [majorMinorSelection, setMajorMinorSelection] = useState<MajorMinorSelection>({
        major: '',
        minor: ''
    });

    const handleMajorMinorSelection = (selection: MajorMinorSelection) => {
        setMajorMinorSelection(selection);
        console.log('Selection changed:', selection);
    };

    return (
        <div className="p-8 space-y-8">
            <h1>Majors Testing</h1>
            
            <section>
                <h2>Major and Minor Combobox</h2>
                <CourseCombobox 
                    onSelectionChange={handleMajorMinorSelection}
                    initialMajor={majorMinorSelection.major}
                    initialMinor={majorMinorSelection.minor}
                />
            </section>

            <section>
                <h2>Drag Drop testing</h2>
                <Dashboard />
            </section>
        </div>
    );
}