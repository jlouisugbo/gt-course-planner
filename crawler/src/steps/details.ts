import axios from "axios";
import { backOff } from "exponential-backoff";
import { concatParams } from "../utils";
import { warn, error } from "../log";

/**
 * Downloads the course detail information for a single course
 * @param term - The term string
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export async function downloadCourseDetails(
  term: string,
  courseId: string
): Promise<string> {
  // Attempt to split the course ID into its subject/number
  const splitResult = splitCourseId(courseId);
  if (splitResult === null) {
    warn("could not split course ID; skipping detail scraping", { courseId });
    return "";
  }

  const [subject, number] = splitResult;
  const parameters = {
    term,
    subjectCode: subject,
    courseNumber: number,
  };

  const query = `?${concatParams(parameters)}`;
  const url = `https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/courseSearchResults/getCourseDescription${query}`;

  // Perform the request in a retry loop
  // (sometimes, we get rate limits/transport errors so this tries to mitigates them)
  const maxAttemptCount = 10;
  try {
    const response = await backOff(
      () =>
        axios.get<string>(url, {
          headers: {
            // Only change: Update user agent to identify your planner
            "User-Agent": "gt-4year-planner/crawler",
          },
        }),
      {
        // See https://github.com/coveooss/exponential-backoff for options API
        jitter: "full",
        numOfAttempts: maxAttemptCount,
        retry: (err, attemptNumber) => {
          error(`an error occurred while fetching details`, err, {
            courseId,
            url,
            attemptNumber,
            tryingAgain: attemptNumber < maxAttemptCount,
          });
          return true;
        },
      }
    );
    return response.data;
  } catch (err) {
    error(`exhausted retries for fetching details`, err, { courseId });
    throw err;
  }
}

/**
 * Downloads the prerequisites for a single course
 * @param term - The term string
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export async function downloadCoursePrereqDetails(
  term: string,
  courseId: string
): Promise<string> {
  const splitResult = splitCourseId(courseId);
  if (splitResult === null) {
    warn("could not split course ID; skipping detail scraping", { courseId });
    return "";
  }

  const [subject, number] = splitResult;
  const parameters = {
    term,
    subjectCode: subject,
    courseNumber: number,
  };
  const query = `?${concatParams(parameters)}`;
  const url = `https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/courseSearchResults/getPrerequisites${query}`;

  // Perform the request in a retry loop
  // (sometimes, we get rate limits/transport errors so this tries to mitigates them)
  const maxAttemptCount = 10;
  try {
    const response = await backOff(
      () =>
        axios.get<string>(url, {
          headers: {
            // Only change: Update user agent to identify your planner
            "User-Agent": "gt-4year-planner/crawler",
          },
        }),
      {
        // See https://github.com/coveooss/exponential-backoff for options API
        jitter: "full",
        numOfAttempts: maxAttemptCount,
        retry: (err, attemptNumber) => {
          error(`an error occurred while fetching details`, err, {
            courseId,
            url,
            attemptNumber,
            tryingAgain: attemptNumber < maxAttemptCount,
          });
          return true;
        },
      }
    );
    return response.data;
  } catch (err) {
    error(`exhausted retries for fetching prereqs`, err, { courseId });
    throw err;
  }
}

/**
 * Attempts to split a course ID into its subject/number components
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
function splitCourseId(
  courseId: string
): [subject: string, number: string] | null {
  const splitResult = courseId.split(" ");
  if (splitResult.length !== 2) return null;
  return [splitResult[0], splitResult[1]];
}

// OPTIONAL: Add batch processing for efficiency
/**
 * Downloads course details for multiple courses with rate limiting
 * Useful for processing large batches without overwhelming GT's servers
 */
export async function downloadCourseDetailsBatch(
  term: string,
  courseIds: string[],
  concurrency: number = 5,
  delayMs: number = 100
): Promise<Map<string, { details: string; prerequisites: string }>> {
  const results = new Map<string, { details: string; prerequisites: string }>();
  
  // Process in chunks to avoid overwhelming the server
  for (let i = 0; i < courseIds.length; i += concurrency) {
    const chunk = courseIds.slice(i, i + concurrency);
    
    const promises = chunk.map(async (courseId) => {
      try {
        const [details, prerequisites] = await Promise.all([
          downloadCourseDetails(term, courseId),
          downloadCoursePrereqDetails(term, courseId)
        ]);
        
        results.set(courseId, { details, prerequisites });
        console.log(`✅ Processed ${courseId} (${i + chunk.indexOf(courseId) + 1}/${courseIds.length})`);
        
        // Small delay to be respectful to GT's servers
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
      } catch (error) {
        console.error(`❌ Failed to process ${courseId}:`, error);
        results.set(courseId, { details: "", prerequisites: "" });
      }
    });
    
    await Promise.all(promises);
  }
  
  return results;
}


/**
export async function downloadCourseDetails(
  term: string,
  courseId: string
): Promise<string> {
  // Attempt to split the course ID into its subject/number
  const splitResult = splitCourseId(courseId);
  if (splitResult === null) {
    warn("could not split course ID; skipping detail scraping", { courseId });
    return "";
  }

  const [subject, number] = splitResult;
  const parameters = {
    term,
    subjectCode: subject,
    courseNumber: number,
  };

  const query = `?${concatParams(parameters)}`;
  const url = `https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/courseSearchResults/getCourseDescription${query}`;

  // Perform the request in a retry loop
  // (sometimes, we get rate limits/transport errors so this tries to mitigates them)
  const maxAttemptCount = 10;
  try {
    const response = await backOff(
      () =>
        axios.get<string>(url, {
          headers: {
            "User-Agent": "gt-scheduler/crawler",
          },
        }),
      {
        // See https://github.com/coveooss/exponential-backoff for options API
        jitter: "full",
        numOfAttempts: maxAttemptCount,
        retry: (err, attemptNumber) => {
          error(`an error occurred while fetching details`, err, {
            courseId,
            url,
            attemptNumber,
            tryingAgain: attemptNumber < maxAttemptCount,
          });
          return true;
        },
      }
    );
    return response.data;
  } catch (err) {
    error(`exhausted retries for fetching details`, err, { courseId });
    throw err;
  }
}

export async function downloadCoursePrereqDetails(
  term: string,
  courseId: string
): Promise<string> {
  const splitResult = splitCourseId(courseId);
  if (splitResult === null) {
    warn("could not split course ID; skipping detail scraping", { courseId });
    return "";
  }

  const [subject, number] = splitResult;
  const parameters = {
    term,
    subjectCode: subject,
    courseNumber: number,
  };
  const query = `?${concatParams(parameters)}`;
  const url = `https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/courseSearchResults/getPrerequisites${query}`;

  // Perform the request in a retry loop
  // (sometimes, we get rate limits/transport errors so this tries to mitigates them)
  const maxAttemptCount = 10;
  try {
    const response = await backOff(
      () =>
        axios.get<string>(url, {
          headers: {
            "User-Agent": "gt-scheduler/crawler",
          },
        }),
      {
        // See https://github.com/coveooss/exponential-backoff for options API
        jitter: "full",
        numOfAttempts: maxAttemptCount,
        retry: (err, attemptNumber) => {
          error(`an error occurred while fetching details`, err, {
            courseId,
            url,
            attemptNumber,
            tryingAgain: attemptNumber < maxAttemptCount,
          });
          return true;
        },
      }
    );
    return response.data;
  } catch (err) {
    error(`exhausted retries for fetching prereqs`, err, { courseId });
    throw err;
  }
}

function splitCourseId(
  courseId: string
): [subject: string, number: string] | null {
  const splitResult = courseId.split(" ");
  if (splitResult.length !== 2) return null;
  return [splitResult[0], splitResult[1]];
}
*/