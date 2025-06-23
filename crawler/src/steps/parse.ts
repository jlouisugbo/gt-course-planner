import { TermData, Course, Caches, Section, SectionResponse } from "../types";
import { cache } from "../utils";

export function parse(sections: SectionResponse[], version: number): TermData {
  const courses: Record<string, Course> = {};
  const caches: Caches = {
    scheduleTypes: [],
    campuses: [],
    attributes: [],
    gradeBases: [],
    // Remove: periods, dateRanges, locations, finalDates, finalTimes
  };

  const updatedAt = new Date();

  sections.forEach((section) => {
    const {
      courseTitle,
      courseReferenceNumber,
      sequenceNumber,
      campusDescription: campus,
      subjectCourse,
    } = section;

    let credits = section.creditHours ?? 0;

    const courseName = `${section.subject} ${subjectCourse.replace(
      section.subject,
      ""
    )}`;

    const campusIndex = cache(caches.campuses, campus);
    const scheduleTypeIndex = cache(
      caches.scheduleTypes,
      section.scheduleTypeDescription
    );

    // Keep attributes - useful for ETH requirements, lab designations, etc.
    const attributes = section.sectionAttributes.map(
      (attr) => attr.description
    );
    const attributeIndices = attributes.map((attr) =>
      cache(caches.attributes, attr)
    );

    // Simplified meetings - remove location data, times, instructors
    // Keep only essential scheduling info
    const hasInPersonMeetings = section.meetingsFaculty.some(
      (meetingPart) => 
        meetingPart.meetingTime.buildingDescription && 
        meetingPart.meetingTime.buildingDescription !== "TBA"
    );

    // Determine if course is offered (has actual meeting times)
    const isOffered = section.meetingsFaculty.length > 0;

    if (!(courseName in courses)) {
      const title = courseTitle;
      const sectionsMap: Record<string, Section> = {};
      courses[courseName] = [
        title,
        sectionsMap,
        // Keep prerequisites array - essential for planning
        [],
        // Keep description - essential for course selection
        null,
      ];
    }

    // Simplified section data - remove meeting details, keep essentials
    courses[courseName][1][sequenceNumber] = [
      courseReferenceNumber,
      // Simplified meeting info - just whether it's offered and format
      isOffered,
      credits,
      scheduleTypeIndex,
      campusIndex,
      attributeIndices,
      -1, // Grade basis index (keep for GPA calculations)
    ];
  });

  return { courses, caches, updatedAt, version };
}