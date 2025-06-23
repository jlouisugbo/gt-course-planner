/**
 * Georgia Tech Course Catalog Scraper (Refined)
 * Extracts all undergraduate course data from catalog.gatech.edu
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

class GTCourseScraper {
  constructor() {
    this.baseUrl = 'https://catalog.gatech.edu';
    this.coursesUrl = '/courses-undergrad';
    this.departments = [];
    this.courses = [];
    this.errors = [];
    this.requestDelay = 2000; // 2 second delay between requests
    this.maxRetries = 3;
    
    // Configure axios with reasonable defaults
    this.axiosConfig = {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest(url, retries = 0) {
    try {
      const response = await axios.get(url, this.axiosConfig);
      return response;
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`Request failed, retrying... (${retries + 1}/${this.maxRetries})`);
        await this.delay(this.requestDelay * (retries + 1)); // Exponential backoff
        return this.makeRequest(url, retries + 1);
      }
      throw error;
    }
  }

  async getDepartments() {
    try {
      console.log('Fetching department list...');
      const response = await this.makeRequest(`${this.baseUrl}${this.coursesUrl}`);
      const $ = cheerio.load(response.data);
      
      // Updated selectors based on actual GT catalog structure
      const departmentLinks = new Set(); // Use Set to avoid duplicates
      
      // Look for department links in multiple possible locations
      const selectors = [
        'a[href*="/courses-undergrad/"]',
        '.sitemap a[href*="/courses-undergrad/"]',
        '#content a[href*="/courses-undergrad/"]',
        'ul li a[href*="/courses-undergrad/"]'
      ];
      
      selectors.forEach(selector => {
        $(selector).each((i, element) => {
          const href = $(element).attr('href');
          const text = $(element).text().trim();
          
          // Skip the main page link and ensure it's a department
          if (href && href !== '/courses-undergrad/' && 
              href.includes('/courses-undergrad/') && 
              !href.includes('#') && text) {
            
            const deptCode = href.split('/').pop() || '';
            if (deptCode && deptCode.length >= 2) {
              departmentLinks.add(JSON.stringify({
                name: text,
                code: deptCode.toUpperCase(),
                url: href.startsWith('http') ? href : `${this.baseUrl}${href}`
              }));
            }
          }
        });
      });
      
      // Convert back to array of objects
      this.departments = Array.from(departmentLinks).map(dept => JSON.parse(dept));
      
      console.log(`Found ${this.departments.length} departments`);
      if (this.departments.length === 0) {
        // Fallback: try to find department list in a different way
        console.log('No departments found with standard selectors, trying alternative approach...');
        await this.findDepartmentsAlternative($);
      }
      
      return this.departments;
      
    } catch (error) {
      console.error('Error fetching departments:', error.message);
      this.errors.push(`Department fetch error: ${error.message}`);
      return [];
    }
  }

  /**
   * Alternative method to find departments if main method fails
   */
  async findDepartmentsAlternative($) {
    // Look for any links that might be departments
    $('a').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && text && href.includes('courses') && 
          text.match(/^[A-Z]{2,4}(\s|$)/) && text.length < 100) {
        const deptCode = text.split(' ')[0];
        if (deptCode.length >= 2 && deptCode.length <= 4) {
          this.departments.push({
            name: text,
            code: deptCode.toUpperCase(),
            url: href.startsWith('http') ? href : `${this.baseUrl}${href}`
          });
        }
      }
    });
  }

  /**
   * Scrape courses from a specific department page
   */
  async scrapeDepartmentCourses(department) {
    try {
      console.log(`Scraping ${department.name} (${department.code})...`);
      const response = await this.makeRequest(department.url);
      const $ = cheerio.load(response.data);
      
      const departmentCourses = [];
      
      // Multiple selectors for course blocks based on different GT catalog layouts
      const courseSelectors = [
        '.courseblock',
        '.course-block',
        '.course',
        'div[class*="course"]',
        'section[class*="course"]'
      ];
      
      let coursesFound = false;
      
      for (const selector of courseSelectors) {
        $(selector).each((i, element) => {
          const course = this.extractCourseData($, element, department);
          if (course && course.code) {
            departmentCourses.push(course);
            coursesFound = true;
          }
        });
        
        if (coursesFound) break; // Stop if we found courses with this selector
      }
      
      // If no courses found with standard selectors, try parsing text content
      if (!coursesFound) {
        console.log(`  No courses found with standard selectors for ${department.name}, trying text parsing...`);
        const textCourses = this.parseCoursesFromText($.text(), department);
        departmentCourses.push(...textCourses);
      }
      
      console.log(`  Found ${departmentCourses.length} courses in ${department.name}`);
      return departmentCourses;
      
    } catch (error) {
      console.error(`Error scraping ${department.name}:`, error.message);
      this.errors.push(`${department.name} scrape error: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract course data from a course element
   */
  extractCourseData($, element, department) {
    const $course = $(element);
    
    // Try multiple selectors for course title/header
    const titleSelectors = [
      '.courseblocktitle',
      '.course-title',
      '.title',
      'h3',
      'h4',
      '.course-header'
    ];
    
    let header = '';
    for (const selector of titleSelectors) {
      header = $course.find(selector).first().text().trim();
      if (header) break;
    }
    
    // If no header found in child elements, check element text itself
    if (!header) {
      header = $course.clone().children().remove().end().text().trim();
    }
    
    if (!header) return null;
    
    // Enhanced regex for course code extraction
    const codePatterns = [
      /^([A-Z]{2,4}\s+\d+[A-Z]*)/,
      /([A-Z]{2,4}\s+\d+[A-Z]*)/,
      /^([A-Z]+\d+[A-Z]*)/
    ];
    
    let code = null;
    for (const pattern of codePatterns) {
      const match = header.match(pattern);
      if (match) {
        code = match[1].replace(/\s+/g, ' ').trim();
        break;
      }
    }
    
    if (!code) return null;
    
    // Extract title (more flexible pattern)
    const titlePatterns = [
      new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\.]*(.+?)(?:\\s+\\d+(?:\\.\\d+)?(?:-\\d+(?:\\.\\d+)?)?\\s*[Cc]redit|$)`, 'i'),
      new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\.]*(.+)`, 'i')
    ];
    
    let title = '';
    for (const pattern of titlePatterns) {
      const match = header.match(pattern);
      if (match && match[1]) {
        title = match[1].trim().replace(/^[.\-:]\s*/, '');
        break;
      }
    }
    
    // Extract credits with more flexible patterns
    const creditsPatterns = [
      /(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)\s*[Cc]redit/,
      /(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)\s*[Cc]r/,
      /(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)\s*[Hh]ours?/
    ];
    
    let credits = null;
    const fullText = $course.text();
    
    for (const pattern of creditsPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        credits = match[1];
        break;
      }
    }
    
    // Process credits
    if (credits && credits.includes('-')) {
      const range = credits.split('-').map(Number).filter(n => !isNaN(n));
      credits = range.length === 2 ? Math.round((range[0] + range[1]) / 2) : range[0] || 3;
    } else if (credits) {
      credits = parseFloat(credits) || 3;
    } else {
      credits = 3; // Default
    }
    
    // Extract description
    const descSelectors = [
      '.courseblockdesc',
      '.course-description',
      '.description',
      'p'
    ];
    
    let description = '';
    for (const selector of descSelectors) {
      description = $course.find(selector).first().text().trim();
      if (description && description.length > 20) break;
    }
    
    // Extract prerequisites
    let prerequisites = '';
    const prereqPatterns = [
      /Prerequisites?:\s*([^.]+(?:\.[^.]*)*)/i,
      /Prereq(?:uisite)?s?:\s*([^.]+(?:\.[^.]*)*)/i,
      /Required:\s*([^.]+)/i
    ];
    
    for (const pattern of prereqPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        prerequisites = match[1].trim();
        break;
      }
    }
    
    // Extract attributes
    const attributes = [];
    $course.find('.courseblockattr, .attribute, .course-attr').each((j, attr) => {
      const attrText = $(attr).text().trim();
      if (attrText) attributes.push(attrText);
    });
    
    // Determine if it's a lab course
    const isLab = /lab|laboratory/i.test(title) || 
                  /lab|laboratory/i.test(description) ||
                  /lab|laboratory/i.test(code);
    
    return {
      code: code,
      title: title || 'Untitled Course',
      credits: credits,
      description: description,
      prerequisites: prerequisites,
      department: department.code,
      departmentName: department.name,
      attributes: attributes,
      isLab: isLab,
      offerings: {
        fall: true,
        spring: true,
        summer: false
      }
    };
  }

  /**
   * Parse courses from raw text when structured parsing fails
   */
  parseCoursesFromText(text, department) {
    const courses = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const codeMatch = line.match(/^([A-Z]{2,4}\s+\d+[A-Z]*)/);
      
      if (codeMatch) {
        const code = codeMatch[1];
        const title = line.replace(code, '').replace(/^[.\-:\s]*/, '').split(/\d+\s*credit/i)[0].trim();
        
        if (title) {
          courses.push({
            code: code,
            title: title,
            credits: 3,
            description: '',
            prerequisites: '',
            department: department.code,
            departmentName: department.name,
            attributes: [],
            isLab: /lab|laboratory/i.test(title),
            offerings: { fall: true, spring: true, summer: false }
          });
        }
      }
    }
    
    return courses;
  }

  /**
   * Parse prerequisites to extract course relationships
   */
  parsePrerequisites(prereqString) {
    if (!prereqString) return [];
    
    const courses = [];
    // Enhanced regex for course codes
    const coursePatterns = [
      /[A-Z]{2,4}\s+\d+[A-Z]*/g,
      /[A-Z]{2,4}\d+[A-Z]*/g
    ];
    
    for (const pattern of coursePatterns) {
      const matches = prereqString.match(pattern);
      if (matches) {
        courses.push(...matches.map(course => course.replace(/\s+/g, ' ').trim()));
        break;
      }
    }
    
    return [...new Set(courses)]; // Remove duplicates
  }

  /**
   * Add delay between requests
   */
  async delay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Main scraping function
   */
  async scrapeAllCourses() {
    console.log('Starting Georgia Tech course catalog scrape...');
    
    // Get all departments
    await this.getDepartments();
    
    if (this.departments.length === 0) {
      console.error('No departments found. Exiting.');
      return { courses: [], departments: [], errors: this.errors, statistics: {} };
    }
    
    // Scrape each department with progress tracking
    for (let i = 0; i < this.departments.length; i++) {
      const department = this.departments[i];
      console.log(`\nProgress: ${i + 1}/${this.departments.length}`);
      
      const departmentCourses = await this.scrapeDepartmentCourses(department);
      this.courses.push(...departmentCourses);
      
      // Add delay between requests to be respectful
      if (i < this.departments.length - 1) {
        await this.delay(this.requestDelay);
      }
    }
    
    console.log(`\nScraping complete!`);
    console.log(`Total courses found: ${this.courses.length}`);
    console.log(`Errors encountered: ${this.errors.length}`);
    
    return {
      courses: this.courses,
      departments: this.departments,
      errors: this.errors,
      statistics: this.getStatistics()
    };
  }

  /**
   * Generate statistics about the scraped data
   */
  getStatistics() {
    const stats = {
      totalCourses: this.courses.length,
      totalDepartments: this.departments.length,
      coursesByDepartment: {},
      creditsDistribution: {},
      labCourses: 0,
      coursesWithPrereq: 0
    };
    
    this.courses.forEach(course => {
      // Count by department
      stats.coursesByDepartment[course.department] = 
        (stats.coursesByDepartment[course.department] || 0) + 1;
      
      // Count by credits
      const credits = course.credits.toString();
      stats.creditsDistribution[credits] = 
        (stats.creditsDistribution[credits] || 0) + 1;
      
      // Count lab courses
      if (course.isLab) stats.labCourses++;
      
      // Count courses with prerequisites
      if (course.prerequisites) stats.coursesWithPrereq++;
    });
    
    return stats;
  }

  /**
   * Export data to various formats
   */
  async exportData(format = 'json', filename = 'gt_courses') {
    const data = {
      courses: this.courses,
      departments: this.departments,
      statistics: this.getStatistics(),
      scrapedAt: new Date().toISOString(),
      errors: this.errors
    };
    
    try {
      switch (format.toLowerCase()) {
        case 'json':
          await fs.writeFile(`${filename}.json`, JSON.stringify(data, null, 2));
          console.log(`Data exported to ${filename}.json`);
          break;
          
        case 'sql':
          const sqlInserts = this.generateSQLInserts();
          await fs.writeFile(`${filename}.sql`, sqlInserts);
          console.log(`SQL inserts exported to ${filename}.sql`);
          break;
          
        case 'csv':
          const csv = this.generateCSV();
          await fs.writeFile(`${filename}.csv`, csv);
          console.log(`CSV exported to ${filename}.csv`);
          break;
          
        default:
          console.error('Unsupported format. Use: json, sql, or csv');
      }
    } catch (error) {
      console.error(`Error exporting ${format}:`, error.message);
      this.errors.push(`Export error (${format}): ${error.message}`);
    }
  }

  /**
   * Generate SQL INSERT statements (fixed syntax)
   */
  generateSQLInserts() {
    let sql = '-- Georgia Tech Courses Data\n';
    sql += '-- Generated on: ' + new Date().toISOString() + '\n\n';
    
    if (this.courses.length === 0) {
      return sql + '-- No courses to insert\n';
    }
    
    // Insert courses
    sql += 'INSERT INTO courses (code, title, credits, description, department, prerequisites, is_lab) VALUES\n';
    
    const courseValues = this.courses.map((course, index) => {
      const code = this.escapeSql(course.code);
      const title = this.escapeSql(course.title);
      const description = this.escapeSql(course.description);
      const department = this.escapeSql(course.department);
      const prerequisites = this.escapeSql(course.prerequisites);
      
      return `  ('${code}', '${title}', ${course.credits}, '${description}', '${department}', '${prerequisites}', ${course.isLab ? 'TRUE' : 'FALSE'})`;
    });
    
    sql += courseValues.join(',\n') + ';\n\n';
    
    return sql;
  }

  /**
   * Escape SQL strings properly
   */
  escapeSql(str) {
    if (!str) return '';
    return str.toString().replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  /**
   * Generate CSV format (fixed escaping)
   */
  generateCSV() {
    const headers = ['code', 'title', 'credits', 'department', 'description', 'prerequisites', 'isLab'];
    let csv = headers.join(',') + '\n';
    
    this.courses.forEach(course => {
      const row = [
        this.escapeCsv(course.code),
        this.escapeCsv(course.title),
        course.credits,
        this.escapeCsv(course.department),
        this.escapeCsv(course.description),
        this.escapeCsv(course.prerequisites),
        course.isLab
      ];
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }

  /**
   * Properly escape CSV values
   */
  escapeCsv(value) {
    if (!value) return '""';
    const str = value.toString();
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }
}

// Usage example with error handling
async function main() {
  const scraper = new GTCourseScraper();
  
  try {
    console.log('Starting scrape...');
    const results = await scraper.scrapeAllCourses();
    
    if (results.courses.length === 0) {
      console.log('No courses found. Check the website structure or selectors.');
      return;
    }
    
    // Export in multiple formats
    await scraper.exportData('json', 'gt_courses_data');
    await scraper.exportData('sql', 'gt_courses_insert');
    await scraper.exportData('csv', 'gt_courses_data');
    
    console.log('\n=== Scraping Results ===');
    console.log(`Total Courses: ${results.statistics.totalCourses}`);
    console.log(`Departments: ${results.statistics.totalDepartments}`);
    console.log(`Lab Courses: ${results.statistics.labCourses}`);
    console.log(`Courses with Prerequisites: ${results.statistics.coursesWithPrereq}`);
    
    // Show top departments by course count
    const topDepts = Object.entries(results.statistics.coursesByDepartment)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    console.log('\nTop 5 Departments by Course Count:');
    topDepts.forEach(([dept, count]) => {
      console.log(`  ${dept}: ${count} courses`);
    });
    
    if (results.errors.length > 0) {
      console.log('\n=== Errors ===');
      results.errors.forEach(error => console.log(`- ${error}`));
    }
    
  } catch (error) {
    console.error('Scraping failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Export for use as module
export { GTCourseScraper };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}