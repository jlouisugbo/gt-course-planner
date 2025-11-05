/**
 * New degree program methods using major text column instead of degree_program_id
 */

// Using broad types to avoid tight coupling with UI-specific shapes
type VisualDegreeProgram = {
    id: number;
    name: string;
    degreeType?: string;
    college?: string;
    totalCredits?: number;
    requirements: any[];
    footnotes?: any[];
};

type VisualMinorProgram = {
    id: number;
    name: string;
    requirements: any[];
    footnotes?: any[];
};
import { userDataService } from './database/userDataService';

export async function fetchDegreeProgramRequirementsByMajor(): Promise<VisualDegreeProgram | null> {
    try {
        // Use userDataService to get current user's profile and major
        const userProfile = await userDataService.getUserProfile();
        if (!userProfile || !userProfile.major) {
            console.error('User has no major assigned or profile missing.');
            return null;
        }

        const majorName = userProfile.major;
        try {
            const response = await fetch(`/api/degree-programs?major=${encodeURIComponent(majorName)}`);
            if (!response.ok) {
                console.error('API request failed for major:', majorName);
                return null;
            }
            const program = await response.json();
            if (!program) return null;

            const visualProgram: VisualDegreeProgram = {
                id: program.id,
                name: program.name,
                degreeType: program.degree_type,
                college: undefined,
                totalCredits: program.total_credits || undefined,
                requirements: Array.isArray(program.requirements) ? program.requirements : [],
                footnotes: Array.isArray(program.footnotes) ? program.footnotes : []
            };

            return visualProgram;
        } catch (fetchError) {
            console.error('Error fetching degree program via API:', fetchError);
            return null;
        }

    } catch (error) {
        console.error('Error in fetchDegreeProgramRequirementsByMajor:', error);
        return null;
    }
}

export async function fetchMinorRequirementsByMinorsColumn(): Promise<VisualMinorProgram[]> {
    try {
        // Use userDataService to get current user's minors
        const userProfile = await userDataService.getUserProfile();
        if (!userProfile || !Array.isArray(userProfile.minors) || userProfile.minors.length === 0) {
            console.log('User has no minors selected');
            return [];
        }

        const minorNames = userProfile.minors;
        console.log('Fetching minor program requirements for minors:', minorNames);

        // Fetch each minor program via the public API route and aggregate
        const fetchPromises = minorNames.map(async (minorName: string) => {
            try {
                const resp = await fetch(`/api/degree-programs?major=${encodeURIComponent(minorName)}&degree_type=Minor`);
                if (!resp.ok) return null;
                const program = await resp.json();
                return program;
            } catch (err) {
                console.error('Error fetching minor program for', minorName, err);
                return null;
            }
        });

        const programs = (await Promise.all(fetchPromises)).filter(Boolean);

        const visualMinors: VisualMinorProgram[] = (programs || []).map((program: any) => ({
            id: program.id,
            name: program.name,
            requirements: Array.isArray(program.requirements) ? program.requirements : [],
            footnotes: []
        }));

        return visualMinors;

    } catch (error) {
        console.error('Error in fetchMinorRequirementsByMinorsColumn:', error);
        return [];
    }
}