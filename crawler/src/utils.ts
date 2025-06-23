import fs from "fs";
import { error } from "./log";


export function match(text: string, regexp: RegExp): string | null {
  const results = regexp.exec(text);
  return results && results[1];
}


export function cache(array: (string | null)[], value: string | null): number {
  let index = array.indexOf(value);
  if (index === -1) {
    array.push(value);
    index = array.length - 1;
  }
  return index;
}

export function writeFile(path: string, json: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const content = JSON.stringify(json);
    fs.writeFile(path, content, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function concatParams(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}


export function regexExec(regex: RegExp, str: string): RegExpExecArray {
  const result = regex.exec(str);
  if (result == null)
    throw new Error(
      `Regular expression '${regex}' failed to execute on string '${str}'`
    );
  return result;
}


export function getIntConfig(key: string): number | null {
  const value = process.env[key];
  if (value == null) return null;
  try {
    return parseInt(value, 10);
  } catch (err) {
    error(`invalid integer config value provided`, err, { key, value });
    process.exit(1);
    return null;
  }
}

export function cleanCourseTitle(title: string): string {
  return title
    .replace(/\s+/g, " ") 
    .replace(/[^\w\s-&]/g, "") // Remove special chars except dashes and ampersands
    .trim();
}


export function parseCredits(creditString: string | number): number {
  if (typeof creditString === "number") return creditString;
  
  const rangeMatch = creditString.match(/(\d+)-(\d+)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[2], 10);
  }
  
  const singleMatch = creditString.match(/(\d+)/);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10);
  }
  
  return 0;
}


export function isValidCourseId(courseId: string): boolean {
  // GT course format: "SUBJ ####" where SUBJ is 2-4 letters, #### is 4 digits
  return /^[A-Z]{2,4}\s\d{4}$/.test(courseId);
}


export function parseTermCode(termCode: string): { year: number; semester: string } | null {
  // GT term format: YYYYMM where MM is 02=Spring, 05=Summer, 08=Fall
  const match = termCode.match(/^(\d{4})(02|05|08)$/);
  if (!match) return null;
  
  const year = parseInt(match[1], 10);
  const semesterMap: Record<string, string> = {
    "02": "Spring",
    "05": "Summer", 
    "08": "Fall"
  };
  
  return {
    year,
    semester: semesterMap[match[2]]
  };
}


export function generateTermCode(year: number, semester: string): string {
  const semesterMap: Record<string, string> = {
    "Spring": "02",
    "Summer": "05",
    "Fall": "08"
  };
  
  const monthCode = semesterMap[semester];
  if (!monthCode) throw new Error(`Invalid semester: ${semester}`);
  
  return `${year}${monthCode}`;
}