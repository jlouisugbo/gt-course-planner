export interface RequirementCategory {
  id: string;
  name: string;
  requiredCredits: number;
  completedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
  isComplete: boolean;
  progress: number;
  courses: string[];
  requirements?: SpecificRequirement[];
}

export interface SpecificRequirement {
  description: string;
  options: string[][];
  completed: boolean;
}

export interface ThreadRequirement {
  name: string;
  requiredCredits: number;
  coreCourses: string[];
  electiveOptions: string[];
  completedCredits: number;
  isComplete: boolean;
}

export interface DegreeRequirements {
  totalCredits: number;
  categories: RequirementCategory[];
  threads: ThreadRequirement[];
  gpaRequirement: number;
  residencyHours: number;
}

export const csDegreeRequirements: DegreeRequirements = {
  totalCredits: 126,
  gpaRequirement: 2.0,
  residencyHours: 36,
  categories: [
    {
      id: "cs-core",
      name: "CS Core",
      requiredCredits: 39,
      completedCredits: 0,
      inProgressCredits: 0,
      plannedCredits: 0,
      isComplete: false,
      progress: 0,
      courses: [
        "CS 1301", "CS 1331", "CS 1332", "CS 2110", 
        "CS 2340", "CS 3510", "CS 3511", "CS 4400",
        "CS 4641", "CS 4698", "CS 4699"
      ]
    },
    {
      id: "mathematics",
      name: "Mathematics",
      requiredCredits: 21,
      completedCredits: 0,
      inProgressCredits: 0,
      plannedCredits: 0,
      isComplete: false,
      progress: 0,
      courses: [
        "MATH 1551", "MATH 1552", "MATH 1554",
        "MATH 2550", "MATH 3012", "CS 3511", "CS 3801"
      ]
    },
    {
      id: "science",
      name: "Science",
      requiredCredits: 12,
      completedCredits: 0,
      inProgressCredits: 0,
      plannedCredits: 0,
      isComplete: false,
      progress: 0,
      courses: [],
      requirements: [
        {
          description: "Two introductory science sequences",
          options: [
            ["PHYS 2211", "PHYS 2212"],
            ["CHEM 1310", "CHEM 1311"], 
            ["BIOL 1510", "BIOL 1520"]
          ],
          completed: false
        }
      ]
    },
    {
      id: "breadth",
      name: "Breadth Requirements",
      requiredCredits: 36,
      completedCredits: 0,
      inProgressCredits: 0,
      plannedCredits: 0,
      isComplete: false,
      progress: 0,
      courses: []
    },
    {
      id: "free-electives",
      name: "Free Electives",
      requiredCredits: 18,
      completedCredits: 0,
      inProgressCredits: 0,
      plannedCredits: 0,
      isComplete: false,
      progress: 0,
      courses: []
    }
  ],
  threads: [
    {
      name: "Intelligence",
      requiredCredits: 15,
      coreCourses: ["CS 3600"],
      electiveOptions: [
        "CS 4635", "CS 4641", "CS 4646", "CS 4650",
        "CS 4660", "CS 4670", "CS 6601", "CS 7637"
      ],
      completedCredits: 0,
      isComplete: false
    },
    {
      name: "Theory",
      requiredCredits: 15,
      coreCourses: ["CS 3510"],
      electiveOptions: [
        "CS 4540", "CS 4510", "CS 4520", "CS 4530",
        "CS 6505", "CS 6520", "CS 7520"
      ],
      completedCredits: 0,
      isComplete: false
    },
    {
      name: "Systems & Architecture",
      requiredCredits: 15,
      coreCourses: ["CS 2110"],
      electiveOptions: [
        "CS 3220", "CS 3210", "CS 4290", "CS 4210",
        "CS 4220", "CS 6210", "CS 6290"
      ],
      completedCredits: 0,
      isComplete: false
    },
    {
      name: "Information/Internetworks",
      requiredCredits: 15,
      coreCourses: ["CS 4400"],
      electiveOptions: [
        "CS 4235", "CS 4251", "CS 4260", "CS 4270",
        "CS 4365", "CS 6250", "CS 6262"
      ],
      completedCredits: 0,
      isComplete: false
    },
    {
      name: "Media",
      requiredCredits: 15,
      coreCourses: [],
      electiveOptions: [
        "CS 3451", "CS 3630", "CS 4455", "CS 4460",
        "CS 4464", "CS 4470", "CS 6456"
      ],
      completedCredits: 0,
      isComplete: false
    },
    {
      name: "People",
      requiredCredits: 15,
      coreCourses: ["CS 2340"],
      electiveOptions: [
        "CS 3750", "CS 4315", "CS 4460", "CS 4470",
        "CS 4605", "CS 6455", "CS 6750"
      ],
      completedCredits: 0,
      isComplete: false
    }
  ]
};