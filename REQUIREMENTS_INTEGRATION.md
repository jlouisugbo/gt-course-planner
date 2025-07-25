# Requirements Panel Integration Guide

## Overview
The new requirements panel system has been implemented with the following components:

### Components Created:
1. **RequirementsPanel.tsx** - Main component with tabbed interface
2. **RequirementSection.tsx** - Displays individual program requirements  
3. **RequirementCategory.tsx** - Handles requirement categories
4. **CourseCard.tsx** - Individual course cards with database integration
5. **CourseModal.tsx** - Detailed course information modal
6. **CourseGroup.tsx** - Handles OR groups and selection groups

### Types Added:
New types have been added to `src/types/requirements.ts` for the visual requirements system.

## Required Store Methods

You need to add these two methods to `usePlannerStore.ts`:

### 1. fetchDegreeProgram()
**Returns:** `Promise<VisualDegreeProgram | null>`

This method should:
- Query the user's degree program from the database
- Return the degree program data in the format below
- Return null if no degree program found

### 2. fetchMinorPrograms() 
**Returns:** `Promise<VisualMinorProgram[]>`

This method should:
- Query the user's minor programs from the database  
- Return an array of minor program data
- Return empty array if no minors

## Expected Data Structure

The methods should return data that matches the JSON structure you provided:

```typescript
// Example return from fetchDegreeProgram()
{
  id: 1,
  name: "Computer Science",
  degreeType: "Bachelor of Science",
  college: "College of Computing",
  totalCredits: 120,
  requirements: [
    {
      name: "Wellness Requirement",
      courses: [
        {
          code: "OR_GROUP",
          title: "OR Group", 
          groupId: "or_1753228366685",
          courseType: "or_group",
          footnoteRefs: [],
          groupCourses: [
            {
              code: "APPH 1040",
              title: "Scientific Foundations of Health",
              isOption: false,
              courseType: "regular",
              footnoteRefs: [2]
            }
            // ... more courses
          ]
        }
      ]
    }
    // ... more requirement categories
  ],
  footnotes: [
    { number: 1, text: "Some footnote text" }
  ]
}
```

## Database Integration

### Course Querying
The system automatically queries the `courses` table for each course code to get:
- credits
- description  
- prerequisites
- course_type
- college
- department

### Expected Course Table Schema
```sql
courses (
  code VARCHAR, -- e.g., "CS 1301"
  title VARCHAR,
  credits INTEGER,
  description TEXT,
  prerequisites TEXT,
  course_type VARCHAR,
  college VARCHAR,
  department VARCHAR
)
```

## Implementation Steps

1. **Add the two required methods to usePlannerStore.ts**
2. **Query your degree_programs table to get the JSON structure**
3. **Parse the requirements JSON and return in the expected format**
4. **Test with the requirements page at `/requirements`**

## Features Available

### ✅ Tabbed Interface
- Main degree program tab
- Additional tabs for each minor (only shown if user has minors)

### ✅ Course Cards  
- Display course code, title, credits, department
- Click to open detailed modal
- Automatic database querying for course details

### ✅ Course Groups
- OR Groups (choose one from several options)
- Selection Groups (choose N from several options)  
- Expandable/collapsible interface

### ✅ Course Modal
- Full course details including description and prerequisites
- Links to external course catalog
- Responsive design

### ✅ Progress Tracking
- Placeholder progress calculation (you can implement actual progress)
- Visual progress bars and completion indicators

## Styling & Theme
- Consistent with GT Planner theme colors
- Responsive design for mobile/desktop
- Smooth animations and transitions
- Loading states and error handling

## Testing
Once you implement the store methods, test by:
1. Navigate to `/requirements`  
2. Verify degree program data loads
3. Check minor tabs appear if user has minors
4. Click course cards to test modal functionality
5. Test OR groups and selection groups expand/collapse

The system is ready to use once you add the two store methods!