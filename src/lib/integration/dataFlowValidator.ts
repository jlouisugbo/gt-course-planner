/**
 * Data Flow Validator
 * Comprehensive integration testing for all data connections
 * Validates that database, Zustand store, and UI components are properly connected
 */

import { userDataService } from '@/lib/database/userDataService';
import { gpaCalculationService } from '@/lib/gpa/gpaCalculationService';
import { flexibleCourseService } from '@/lib/flexible/flexibleCourseService';
import { supabase } from '@/lib/supabaseClient';

export interface ValidationResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  data?: any;
}

export interface ValidationSummary {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;  
  results: ValidationResult[];
  overallStatus: 'pass' | 'fail' | 'warning';
}

class DataFlowValidator {
  private results: ValidationResult[] = [];

  /**
   * Run all validation tests
   */
  async validateAll(): Promise<ValidationSummary> {
    this.results = [];
    
    console.log('🔍 Starting comprehensive data flow validation...');

    // Test categories
    await this.validateDatabaseConnections();
    await this.validateUserDataService();
    await this.validateGPACalculations();
    await this.validateRequirementsSystem();
    await this.validateFlexibleCourses();
    await this.validatePlannerIntegration();
    await this.validateDashboardData();

    // Calculate summary
    const summary = this.calculateSummary();
    
    console.log(`✅ Validation complete: ${summary.passed}/${summary.totalTests} tests passed`);
    
    return summary;
  }

  /**
   * Test basic database connections
   */
  private async validateDatabaseConnections(): Promise<void> {
    try {
      // Test authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      this.addResult('Database', 'Authentication', 
        !authError && user ? 'pass' : 'fail',
        authError ? authError.message : user ? 'User authenticated' : 'No user found'
      );

      if (!user) return;

      // Test user table access
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, full_name, major')
        .eq('auth_id', user.id)
        .single();

      this.addResult('Database', 'User Table Access',
        !userError && userRecord ? 'pass' : 'fail',
        userError ? userError.message : `Found user: ${userRecord?.full_name}`
      );

      // Test all user tables exist and are accessible
      const tables = [
        'user_course_completions',
        'user_semester_plans', 
        'user_requirement_progress',
        'user_flexible_mappings'
      ];

      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('id')
            .limit(1);

          this.addResult('Database', `${table} Table Access`,
            !error ? 'pass' : 'fail',
            error ? error.message : `Table ${table} accessible`
          );
        } catch (err) {
          this.addResult('Database', `${table} Table Access`, 'fail',
            `Failed to access ${table}: ${err}`
          );
        }
      }

    } catch (error) {
      this.addResult('Database', 'Connection Test', 'fail',
        `Database connection failed: ${error}`
      );
    }
  }

  /**
   * Test UserDataService functionality
   */
  private async validateUserDataService(): Promise<void> {
    try {
      // Test user ID retrieval
      const userId = await userDataService.getCurrentUserId();
      this.addResult('UserDataService', 'Get User ID',
        userId ? 'pass' : 'fail',
        userId ? `User ID: ${userId}` : 'Failed to get user ID'
      );

      // Test user profile retrieval
      const userProfile = await userDataService.getUserProfile();
      this.addResult('UserDataService', 'Get User Profile',
        userProfile ? 'pass' : 'warning',
        userProfile ? `Profile loaded for ${userProfile.full_name}` : 'No user profile found'
      );

      // Test course completions
      const completions = await userDataService.getCourseCompletions();
      this.addResult('UserDataService', 'Get Course Completions',
        Array.isArray(completions) ? 'pass' : 'fail',
        `Found ${completions.length} course completions`
      );

      // Test semester plans
      const plans = await userDataService.getSemesterPlans();
      this.addResult('UserDataService', 'Get Semester Plans',
        Array.isArray(plans) ? 'pass' : 'fail',
        `Found${plans.length} semester plans`
      );

      // Test comprehensive dashboard data
      const dashboardData = await userDataService.getDashboardData();
      this.addResult('UserDataService', 'Get Dashboard Data',
        dashboardData ? 'pass' : 'fail',
        dashboardData ? 'Dashboard data loaded successfully' : 'Failed to load dashboard data'
      );

    } catch (error) {
      this.addResult('UserDataService', 'Service Test', 'fail',
        `UserDataService failed: ${error}`
      );
    }
  }

  /**
   * Test GPA calculation service
   */
  private async validateGPACalculations(): Promise<void> {
    try {
      // Test comprehensive GPA calculation
      const gpaData = await gpaCalculationService.calculateComprehensiveGPA();
      this.addResult('GPA Service', 'Calculate Comprehensive GPA', 'pass',
        `GPA: ${gpaData.currentGPA.toFixed(2)}, Credits: ${gpaData.totalCredits}, Semesters: ${gpaData.semesterGPAs.length}`
      );

      // Test GPA trend analysis
      const hasTrend = gpaData.trendAnalysis && typeof gpaData.trendAnalysis.direction === 'string';
      this.addResult('GPA Service', 'Trend Analysis',
        hasTrend ? 'pass' : 'warning',
        hasTrend ? `Trend: ${gpaData.trendAnalysis.direction}` : 'Trend analysis not available'
      );

      // Test required GPA calculation
      if (gpaData.totalCredits > 0) {
        const requiredGPA = await gpaCalculationService.calculateRequiredGPA(3.5, 4);
        this.addResult('GPA Service', 'Required GPA Calculation',
          requiredGPA ? 'pass' : 'fail',
          requiredGPA ? `Required GPA: ${requiredGPA.requiredGPA.toFixed(2)}` : 'Failed to calculate required GPA'
        );
      }

    } catch (error) {
      this.addResult('GPA Service', 'GPA Calculations', 'fail',
        `GPA service failed: ${error}`
      );
    }
  }

  /**
   * Test requirements system integration
   */
  private async validateRequirementsSystem(): Promise<void> {
    try {
      // Test requirement progress retrieval
      const progress = await userDataService.getRequirementProgress();
      this.addResult('Requirements', 'Get Requirement Progress',
        Array.isArray(progress) ? 'pass' : 'fail',
        `Found ${progress.length} requirement progress entries`
      );

      // Test degree program requirements fetching
      // This would require the enhanced requirements hook to be working
      this.addResult('Requirements', 'Degree Program Integration', 'warning',
        'Degree program integration needs manual testing'
      );

    } catch (error) {
      this.addResult('Requirements', 'Requirements Test', 'fail',
        `Requirements system failed: ${error}`
      );
    }
  }

  /**
   * Test flexible course service
   */
  private async validateFlexibleCourses(): Promise<void> {
    try {
      // Test flexible requirements retrieval
      const flexibleReqs = await flexibleCourseService.getFlexibleRequirements();
      this.addResult('Flexible Courses', 'Get Flexible Requirements',
        Array.isArray(flexibleReqs) ? 'pass' : 'fail',
        `Found ${flexibleReqs.length} flexible requirements`
      );

      // Test flexible progress
      const progress = await flexibleCourseService.getFlexibleProgress();
      this.addResult('Flexible Courses', 'Progress Calculation',
        progress ? 'pass' : 'fail',
        progress ? `${progress.completedRequirements}/${progress.totalRequirements} complete` : 'Failed to get progress'
      );

      // Test validation
      const validation = await flexibleCourseService.validateSelections();
      this.addResult('Flexible Courses', 'Selection Validation',
        validation ? 'pass' : 'fail',
        validation ? `Valid: ${validation.isValid}, Errors: ${validation.errors.length}` : 'Validation failed'
      );

    } catch (error) {
      this.addResult('Flexible Courses', 'Flexible Course Service', 'fail',
        `Flexible course service failed: ${error}`
      );
    }
  }

  /**
   * Test planner integration
   */
  private async validatePlannerIntegration(): Promise<void> {
    try {
      // Test semester plans loading
      const plans = await userDataService.getSemesterPlans();
      this.addResult('Planner', 'Semester Plans Loading',
        Array.isArray(plans) ? 'pass' : 'fail',
        `Loaded ${plans.length} semester plans`
      );

      // Test plan settings integration (would need to mock this)
      this.addResult('Planner', 'Plan Settings Integration', 'warning',
        'Plan settings integration needs manual testing with useEnhancedPlannerStore'
      );

    } catch (error) {
      this.addResult('Planner', 'Planner Integration', 'fail',
        `Planner integration failed: ${error}`
      );
    }
  }

  /**
   * Test dashboard data integration
   */
  private async validateDashboardData(): Promise<void> {
    try {
      // Test comprehensive dashboard data
      const [dashboardData, gpaData] = await Promise.all([
        userDataService.getDashboardData(),
        gpaCalculationService.calculateComprehensiveGPA()
      ]);

      this.addResult('Dashboard', 'Data Integration',
        dashboardData && gpaData ? 'pass' : 'fail',
        'Dashboard data and GPA data loaded successfully'
      );

      // Test that placeholder values are eliminated
      if (dashboardData?.userProfile) {
        const hasTBD = JSON.stringify(dashboardData).includes('TBD');
        this.addResult('Dashboard', 'No TBD Placeholders',
          !hasTBD ? 'pass' : 'warning',
          hasTBD ? 'Found TBD placeholder values' : 'No TBD values found'
        );
      }

    } catch (error) {
      this.addResult('Dashboard', 'Dashboard Integration', 'fail',
        `Dashboard integration failed: ${error}`
      );
    }
  }

  /**
   * Add a test result
   */
  private addResult(category: string, test: string, status: 'pass' | 'fail' | 'warning', message: string, data?: any): void {
    this.results.push({
      category,
      test,
      status,
      message,
      data
    });

    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${emoji} ${category} - ${test}: ${message}`);
  }

  /**
   * Calculate validation summary
   */
  private calculateSummary(): ValidationSummary {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    let overallStatus: 'pass' | 'fail' | 'warning' = 'pass';
    if (failed > 0) {
      overallStatus = 'fail';
    } else if (warnings > 0) {
      overallStatus = 'warning';
    }

    return {
      totalTests,
      passed,
      failed,
      warnings,
      results: this.results,
      overallStatus
    };
  }

  /**
   * Generate a detailed report
   */
  generateReport(summary: ValidationSummary): string {
    let report = `
# Data Flow Validation Report

## Summary
- Total Tests: ${summary.totalTests}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Warnings: ${summary.warnings}
- Overall Status: ${summary.overallStatus.toUpperCase()}

## Test Results by Category
`;

    const categories = [...new Set(summary.results.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = summary.results.filter(r => r.category === category);
      report += `\n### ${category}\n`;
      
      categoryResults.forEach(result => {
        const emoji = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
        report += `${emoji} **${result.test}**: ${result.message}\n`;
      });
    });

    return report;
  }
}

// Export singleton instance
export const dataFlowValidator = new DataFlowValidator();
export default dataFlowValidator;