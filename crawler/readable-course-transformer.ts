// readable-course-transformer.ts
// Complete transformer to convert complex course data to readable format

import fs from 'fs/promises';

// Type definitions to match your data structure
interface PrerequisiteCourse {
  id: string;
  grade?: string;
}

type PrerequisiteClause = PrerequisiteCourse | PrerequisiteSet;
type PrerequisiteSet = [string, ...PrerequisiteClause[]]; // ["and", clause1, clause2, ...]
type Prerequisites = PrerequisiteSet | [];

/**
 * Convert complex prerequisite tree to readable English with proper AND/OR logic
 */
function convertPrerequisitesToReadableLogic(prerequisites: Prerequisites): string {
  if (!prerequisites || prerequisites.length === 0) {
    return "No prerequisites";
  }

  function clauseToReadable(clause: PrerequisiteClause, parentOperator?: string): string {
    // If it's a single course
    if (typeof clause === 'object' && !Array.isArray(clause)) {
      const course = clause as PrerequisiteCourse;
      return course.id; // Remove grade requirements as requested
    }

    // If it's an array (operator with clauses)
    if (Array.isArray(clause)) {
      const [operator, ...children] = clause;
      
      if (children.length === 0) return "";
      if (children.length === 1) return clauseToReadable(children[0], operator);

      // Process all children
      const childStrings = children
        .map(child => clauseToReadable(child, operator))
        .filter(str => str.length > 0);

      if (childStrings.length === 0) return "";
      if (childStrings.length === 1) return childStrings[0];

      // Join with appropriate operator
      const connector = operator.toUpperCase() === "AND" ? " AND " : " OR ";
      const result = childStrings.join(connector);

      // Add parentheses if this is nested under a different operator
      if (parentOperator && parentOperator !== operator && childStrings.length > 1) {
        return `(${result})`;
      }

      return result;
    }

    return "";
  }

  // Handle empty array case before calling clauseToReadable
  if (Array.isArray(prerequisites) && prerequisites.length === 0) {
    return "No prerequisites";
  }
  
  const result = clauseToReadable(prerequisites as PrerequisiteClause);
  return result || "No prerequisites";
}

/**
 * Extract just the course IDs from prerequisites as a simple list
 */
function extractPrerequisiteCourseIds(prerequisites: Prerequisites): string[] {
  if (!prerequisites || prerequisites.length === 0) {
    return [];
  }

  const courseIds: string[] = [];

  function extractFromClause(clause: PrerequisiteClause): void {
    // If it's a single course
    if (typeof clause === 'object' && !Array.isArray(clause)) {
      const course = clause as PrerequisiteCourse;
      courseIds.push(course.id);
      return;
    }

    // If it's an array (operator with clauses)
    if (Array.isArray(clause)) {
      const [operator, ...children] = clause;
      
      // Recursively extract from all children
      children.forEach(child => extractFromClause(child));
    }
  }

  // Handle empty array case before calling extractFromClause
  if (Array.isArray(prerequisites) && prerequisites.length > 0) {
    extractFromClause(prerequisites as PrerequisiteClause);
  }
  
  // Remove duplicates and sort
  return [...new Set(courseIds)].sort();
}

/**
 * Convert attribute codes to readable descriptions
 */
function convertAttributesToEnglish(attributes: string[]): string[] {
  const attributeMap: Record<string, string> = {
    // Ethics attributes
    'ETH5': 'Ethics Requirement',
    'ETHC': 'Ethics Course',
    'ETHICS': 'Ethics Course',
    
    // Course format attributes
    'LAB': 'Laboratory Course',
    'STUDIO': 'Studio Course', 
    'SEMINAR': 'Seminar Course',
    'RECITATION': 'Recitation Course',
    'LECTURE': 'Lecture Course',
    
    // Special programs
    'HONORS': 'Honors Program',
    'CAPSTONE': 'Capstone Course',
    'VIP': 'Vertically Integrated Project',
    
    // Course delivery
    'HYBRID': 'Hybrid Course',
    'ONLINE': 'Online Course',
    'DISTANCE': 'Distance Learning',
    'REMOTE': 'Remote Learning',
    
    // Credit types
    'PASS_FAIL': 'Pass/Fail Grading',
    'AUDIT': 'Audit Available',
    'CREDIT': 'Credit Course',
    
    // Prerequisites/restrictions
    'PERM_REQ': 'Permission Required',
    'MAJOR_REST': 'Major Restriction',
    'CLASS_REST': 'Class Level Restriction',
    'PREREQ': 'Has Prerequisites',
    
    // Special designations
    'WRIT_INT': 'Writing Intensive',
    'COMM_INT': 'Communication Intensive',
    'TECH_COMM': 'Technical Communication',
    'ORAL_COMM': 'Oral Communication',
    
    // Research/thesis
    'RESEARCH': 'Research Course',
    'THESIS': 'Thesis Course',
    'DISSERTATION': 'Dissertation Course',
    'INDEPENDENT': 'Independent Study',
    
    // International
    'STUDY_ABROAD': 'Study Abroad',
    'INTERNATIONAL': 'International Course',
    'GLOBAL': 'Global Perspectives',
    
    // Math/Science requirements
    'MATH_ELEC': 'Mathematics Elective',
    'SCI_ELEC': 'Science Elective',
    'TECH_ELEC': 'Technical Elective',
    'FREE_ELEC': 'Free Elective',
    
    // General Education
    'SOCIAL_SCI': 'Social Science',
    'HUMANITIES': 'Humanities',
    'FINE_ARTS': 'Fine Arts',
    'LIBERAL_ARTS': 'Liberal Arts',
    
    // Special topics
    'SPECIAL_TOP': 'Special Topics',
    'INTERNSHIP': 'Internship',
    'COOP': 'Cooperative Education',
    'PRACTICUM': 'Practicum',
    
    // Common GT-specific codes
    'ENGR': 'Engineering Course',
    'DESIGN': 'Design Course',
    'PROJECT': 'Project Course',
    'TEAM': 'Team-based Course'
  };

  return attributes.map(attr => {
    // Try exact match first
    if (attributeMap[attr]) {
      return attributeMap[attr];
    }
    
    // Try partial matches for common patterns
    if (attr.includes('ETH')) return 'Ethics Course';
    if (attr.includes('LAB')) return 'Laboratory Component';
    if (attr.includes('WRIT')) return 'Writing Intensive';
    if (attr.includes('COMM')) return 'Communication Component';
    if (attr.includes('TECH')) return 'Technical Course';
    if (attr.includes('ELEC')) return 'Elective Course';
    if (attr.includes('REQ')) return 'Required Course';
    if (attr.includes('REST')) return 'Restricted Enrollment';
    if (attr.includes('MATH')) return 'Mathematics Course';
    if (attr.includes('SCI')) return 'Science Course';
    if (attr.includes('ENGR')) return 'Engineering Course';
    if (attr.includes('DESIGN')) return 'Design Course';
    if (attr.includes('RESEARCH')) return 'Research Course';
    if (attr.includes('HONORS')) return 'Honors Program';
    
    // Default: make it readable by adding spaces and title case
    return attr
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });
}

/**
 * Clean up HTML entities and formatting in text
 */
function cleanText(text: string): string {
  if (!text) return text;
  
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Transform course data to readable format
 */
function transformToReadableFormat(courseData: any): any {
  const readableCourses: any[] = [];

  console.log(`🔄 Processing ${Object.keys(courseData.courses).length} courses...`);

  Object.entries(courseData.courses).forEach(([courseId, course]: [string, any]) => {
    try {
      const [title, sections, prerequisites, description] = course;
      const firstSection = Object.values(sections)[0] as any;

      if (firstSection) {
        const [
          crn,
          isAvailable, // Based on your example: true/false
          creditHours,
          scheduleTypeIndex,
          campusIndex,
          attributeIndices,
          gradeBaseIndex
        ] = firstSection;

        // Get readable attribute names
        const rawAttributes = attributeIndices.map((idx: number) => {
          return courseData.caches.attributes[idx] || 'Unknown';
        });
        const readableAttributes = convertAttributesToEnglish(rawAttributes);

        // Convert prerequisites to readable logic AND extract course list
        const prerequisiteLogic = convertPrerequisitesToReadableLogic(prerequisites);
        const prerequisiteCourses = extractPrerequisiteCourseIds(prerequisites);

        // Clean up title and description
        const cleanTitle = cleanText(title);
        const cleanDescription = cleanText(description);

        readableCourses.push({
          courseId: courseId,
          title: cleanTitle,
          credits: creditHours,
          prerequisiteLogic: prerequisiteLogic, // Readable AND/OR logic
          prerequisiteCourses: prerequisiteCourses, // Simple array of course IDs
          description: cleanDescription || "No description available",
          attributes: readableAttributes, // Human readable array
          campus: courseData.caches.campuses[campusIndex] || 'Unknown',
          courseType: courseData.caches.scheduleTypes[scheduleTypeIndex] || 'Unknown',
          isOffered: isAvailable,
          crn: crn
        });
      }
    } catch (error) {
      console.warn(`⚠️  Error processing course ${courseId}:`, error instanceof Error ? error.message : String(error));
    }
  });

  // Sort by course ID for easier reading
  readableCourses.sort((a, b) => a.courseId.localeCompare(b.courseId));

  return {
    courses: readableCourses,
    metadata: {
      totalCourses: readableCourses.length,
      lastUpdated: courseData.updatedAt,
      termVersion: courseData.version,
      generatedAt: new Date().toISOString(),
      note: "Prerequisites converted to readable logic. Attributes converted to English. Grade requirements removed."
    }
  };
}

/**
 * Main function to process course data file
 */
async function createReadableCourseData(inputFile: string, outputFile: string): Promise<void> {
  try {
    console.log(`📖 Reading course data from ${inputFile}...`);
    
    // Check if file exists
    try {
      await fs.access(inputFile);
    } catch {
      throw new Error(`File not found: ${inputFile}`);
    }

    const rawData = await fs.readFile(inputFile, 'utf8');
    const courseData = JSON.parse(rawData);

    // Validate data structure
    if (!courseData.courses || typeof courseData.courses !== 'object') {
      throw new Error('Invalid course data format: missing courses object');
    }

    if (!courseData.caches || typeof courseData.caches !== 'object') {
      throw new Error('Invalid course data format: missing caches object');
    }

    console.log(`🔄 Converting ${Object.keys(courseData.courses).length} courses to readable format...`);
    const readableData = transformToReadableFormat(courseData);

    console.log(`💾 Saving readable course data to ${outputFile}...`);
    await fs.writeFile(outputFile, JSON.stringify(readableData, null, 2));

    console.log(`✅ Success! Readable course data saved with:`);
    console.log(`   📚 ${readableData.courses.length} courses`);
    console.log(`   📝 Human-readable prerequisites with AND/OR logic`);
    console.log(`   🏷️  Human-readable attributes`);
    console.log(`   🚫 Grade requirements removed`);

    // Show a few examples
    console.log(`\n📋 Sample courses:`);
    readableData.courses.slice(0, 3).forEach((course: any) => {
      console.log(`\n${course.courseId}: ${course.title}`);
      console.log(`  Prerequisites: ${course.prerequisiteLogic}`);
      console.log(`  Prerequisite Courses: [${course.prerequisiteCourses.join(', ')}]`);
      console.log(`  Attributes: ${course.attributes.join(', ')}`);
      console.log(`  Credits: ${course.credits}`);
    });

  } catch (error) {
    console.error('❌ Error processing course data:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Export functions for use in other scripts
export { 
  convertPrerequisitesToReadableLogic,
  extractPrerequisiteCourseIds, 
  convertAttributesToEnglish, 
  transformToReadableFormat,
  createReadableCourseData,
  cleanText
};

// Run if called directly
if (require.main === module) {
  const inputFile = process.argv[2] || 'data/202408.json';
  const outputFile = process.argv[3] || 'data/readable-courses-fall-2024.json';
  
  createReadableCourseData(inputFile, outputFile).catch(console.error);
}