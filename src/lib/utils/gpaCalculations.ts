export type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'F' | string;

export function gradeToGPA(grade: GradeLetter): number {
  const map: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  return map[grade?.toUpperCase?.() ?? ''] ?? 0;
}

export function calculateSemesterGPA(courses: Array<{ credits?: number; grade?: string }>): number {
  if (!courses || courses.length === 0) return 0;
  let totalPoints = 0;
  let totalCredits = 0;
  for (const c of courses) {
    const credits = c.credits ?? 0;
    if (!credits) continue;
    const points = gradeToGPA((c.grade ?? '').toString()) * credits;
    if (!isNaN(points)) {
      totalPoints += points;
      totalCredits += credits;
    }
  }
  return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
}

export function calculateCumulativeGPA(semesters: Array<{ courses?: Array<{ credits?: number; grade?: string }> }>): number {
  let totalPoints = 0;
  let totalCredits = 0;
  for (const sem of semesters) {
    for (const c of sem.courses ?? []) {
      const credits = c.credits ?? 0;
      if (!credits) continue;
      const points = gradeToGPA((c.grade ?? '').toString()) * credits;
      if (!isNaN(points)) {
        totalPoints += points;
        totalCredits += credits;
      }
    }
  }
  return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
}
