const fs = require('fs');
const dir = './data/202508-readable.json';

function transformCourseData(courses) {
  return courses.map(course => ({
    code: course.courseId,
    title: course.title,
    credits: course.credits,
    prerequisite_logic: course.prerequisiteLogic === "No prerequisites" ? null : course.prerequisiteLogic,
    prerequisite_courses: course.prerequisiteCourses,
    description: course.description,
    course_type: course.courseType?.replace('*', '') || null,
    is_active: true,
    created_at: new Date().toISOString()
  }));
}

// Read your JSON file and get the courses array
const fileData = JSON.parse(fs.readFileSync(dir, 'utf8'));
const inputData = fileData.courses; // Get the courses array

console.log(`Found ${inputData.length} courses`);

// Transform the data
const transformedData = transformCourseData(inputData);

// Write to new file
fs.writeFileSync('./data/transformed-courses.json', JSON.stringify(transformedData, null, 2));

console.log(`Transformed ${transformedData.length} courses successfully!`);