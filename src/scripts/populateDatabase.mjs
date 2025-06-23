import { readFileSync } from "fs";
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { supabaseAdmin } from "./src/lib/supabase.js"; 
import { collegeData, coursePrefixMapping, degreePrograms } from "./src/lib/constants.ts";

async function populateDatabase() {
  try {
    console.log("Inserting colleges...");

    const { data: colleges, error: collegeError } = await supabaseAdmin
      .from("colleges")
      .insert(collegeData)
      .select();

    if (collegeError) throw collegeError;
    console.log(`✅ Inserted ${colleges.length} colleges`);

    const collegeIdMap = {};
    colleges.forEach((college) => {
      collegeIdMap[college.abbreviation] = college.id;
    });

    console.log("Inserting degree programs...");

    const allDegreePrograms = [];
    Object.entries(degreePrograms).forEach(([collegeAbbrev, programs]) => {
      programs.forEach((program) => {
        allDegreePrograms.push({
          college_id: collegeIdMap[collegeAbbrev],
          name: program.name,
          degree_type: program.degree_type,
          total_credits: program.total_credits,
          catalog_year: 2024,
          requirements: {},
        });
      });
    });

    const batchSize = 50;
    for (let i = 0; i < allDegreePrograms.length; i += batchSize) {
      const batch = allDegreePrograms.slice(i, i + batchSize);
      const { error } = await supabaseAdmin.from("degree_programs").insert(batch);
      if (error) throw error;
    }
    console.log(`✅ Inserted ${allDegreePrograms.length} degree programs`);

    console.log("📚 Processing courses...");

    const coursesData = JSON.parse(
      readFileSync("./transformed-courses.json", "utf8")
    );

    const coursesWithCollegeId = coursesData.map((course) => {
      const prefix = course.code.split(" ")[0];
      const collegeAbbrev = coursePrefixMapping[prefix];
      const collegeId = collegeIdMap[collegeAbbrev];

      if (!collegeId) {
        console.warn(
          `No college mapping found for course: ${course.code}`
        );
      }

        return {
          code: course.code,
          title: course.title,
          description: course.description,
          credits: course.credits,
          college_id: collegeId,
          prerequisite_logic: course.prerequisite_logic,
          prerequisite_courses: course.prerequisite_courses,
          course_type: course.course_type,
          is_active: course.is_active,
        };
      })
      .filter((course) => course.college_id); // Remove courses without college mapping

    console.log(`📝 Inserting ${coursesWithCollegeId.length} courses...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < coursesWithCollegeId.length; i += batchSize) {
      const batch = coursesWithCollegeId.slice(i, i + batchSize);

      const { data, error } = await supabaseAdmin
        .from("courses")
        .insert(batch)
        .select("code");

      if (error) {
        console.error(
          `❌ Error in batch ${Math.floor(i / batchSize) + 1}:`,
          error.message
        );
        errorCount += batch.length;
      } else {
        successCount += data.length;
        console.log(
          `✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            coursesWithCollegeId.length / batchSize
          )} (${data.length} courses)`
        );
      }
    }

    console.log("\n🎉 Database population complete!");
    console.log(`📊 Summary:`);
    console.log(`   Colleges: ${colleges.length}`);
    console.log(`   Degree Programs: ${allDegreePrograms.length}`);
    console.log(`   Courses: ${successCount} successful, ${errorCount} failed`);
  } catch (error) {
    console.error("💥 Error:", error.message);
  }
}

populateDatabase();