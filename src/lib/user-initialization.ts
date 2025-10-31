import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface UserInitializationResult {
    success: boolean;
    tablesInitialized: string[];
    errors: string[];
}

// Keep track of users currently being initialized to prevent concurrent calls
const initializingUsers = new Set<number>();

/**
 * Initialize a user in all required tables if they don't exist
 */
export async function initializeUserInAllTables(userId: number): Promise<UserInitializationResult> {
    const result: UserInitializationResult = {
        success: true,
        tablesInitialized: [],
        errors: []
    };

    try {
        // 1. Initialize user_course_completions (no default records needed)
        // This table is populated when users mark courses as completed
        
        // 2. Initialize user_flexible_mappings (no default records needed)
        // This table is populated when users make flexible course selections
        
        // 3. Initialize user_requirement_progress
        await initializeUserRequirementProgress(userId, result);
        
        // 4. Initialize user_semester_plans (no default records needed)
        // This table is populated when users plan courses for semesters

        console.log(`User ${userId} initialization completed:`, result);
        return result;

    } catch (error) {
        console.error('Error initializing user:', error);
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
        return result;
    }
}

/**
 * Initialize user requirement progress based on their degree program
 */
async function initializeUserRequirementProgress(userId: number, result: UserInitializationResult) {
    try {
        // First, get the user's degree program
        const { data: user, error: userError } = await supabaseAdmin()
            .from('users')
            .select('degree_program_id, major')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            result.errors.push('Could not find user or degree program');
            console.warn(`User ${userId} not found or error:`, userError);
            return;
        }

        console.log(`User ${userId} data for initialization:`, { 
            degree_program_id: user.degree_program_id, 
            major: user.major 
        });

        if (!user.degree_program_id) {
            // User hasn't selected a degree program yet, skip initialization
            console.log(`User ${userId} has no degree_program_id, skipping requirement progress initialization`);
            return;
        }

        // Check if user already has requirement progress records
        const { data: existingProgress, error: progressError } = await supabaseAdmin()
            .from('user_requirement_progress')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (progressError) {
            result.errors.push(`Error checking existing progress: ${progressError.message}`);
            return;
        }

        if (existingProgress && existingProgress.length > 0) {
            // User already has progress records, skip initialization
            return;
        }

        // Get degree program requirements
        const { data: degreeProgram, error: programError } = await supabaseAdmin()
            .from('degree_programs')
            .select('requirements')
            .eq('id', user.degree_program_id)
            .single();

        if (programError || !degreeProgram) {
            result.errors.push(`Could not load degree program: ${programError?.message || 'Not found'}`);
            return;
        }

        // Initialize progress records for each requirement category
        const requirements = (degreeProgram.requirements as any[]) || [];
        const progressRecords = [];

        for (let i = 0; i < requirements.length; i++) {
            const category = requirements[i] as any;
            progressRecords.push({
                user_id: userId,
                degree_program_id: user.degree_program_id,
                requirement_path: `category_${i}`,
                requirement_type: category.type || 'category',
                is_satisfied: false,
                credits_earned: 0,
                credits_required: category.minCredits || 0,
                notes: `${category.name} - ${category.description || ''}`,
            });
        }

        if (progressRecords.length > 0) {
            const { error: insertError } = await supabaseAdmin()
                .from('user_requirement_progress')
                .insert(progressRecords);

            if (insertError) {
                result.errors.push(`Error inserting progress records: ${insertError.message}`);
            } else {
                result.tablesInitialized.push('user_requirement_progress');
                console.log(`Initialized ${progressRecords.length} requirement progress records for user ${userId}`);
            }
        }

    } catch (error) {
        result.errors.push(`Error in requirement progress initialization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check if a user needs initialization in any table
 */
export async function checkUserInitialization(userId: number): Promise<{
    needsInitialization: boolean;
    missingTables: string[];
}> {
    const missingTables: string[] = [];

    try {
        // Check user_requirement_progress
        const { data: progressData, error: progressError } = await supabaseAdmin()
            .from('user_requirement_progress')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (progressError) {
            console.error('Error checking user_requirement_progress:', progressError);
        } else if (!progressData || progressData.length === 0) {
            missingTables.push('user_requirement_progress');
        }

        return {
            needsInitialization: missingTables.length > 0,
            missingTables
        };

    } catch (error) {
        console.error('Error checking user initialization:', error);
        return {
            needsInitialization: false,
            missingTables: []
        };
    }
}

/**
 * Auto-initialize user on first API call
 */
export async function ensureUserInitialized(userId: number): Promise<void> {
    // Prevent concurrent initialization attempts for the same user
    if (initializingUsers.has(userId)) {
        console.log(`🔄 User ${userId} is already being initialized, skipping`);
        return;
    }

    const check = await checkUserInitialization(userId);
    
    if (check.needsInitialization) {
        console.log(`User ${userId} needs initialization in tables:`, check.missingTables);
        
        // Mark user as being initialized
        initializingUsers.add(userId);
        
        try {
            const result = await initializeUserInAllTables(userId);
            
            // Double-check if initialization worked
            const recheckAfterInit = await checkUserInitialization(userId);
            if (recheckAfterInit.needsInitialization) {
                console.warn(`⚠️ User ${userId} still needs initialization after attempt:`, recheckAfterInit.missingTables);
                console.warn('Initialization result was:', result);
            } else {
                console.log(`✅ User ${userId} successfully initialized`);
            }
        } finally {
            // Always remove from the set, even if initialization fails
            initializingUsers.delete(userId);
        }
    }
}