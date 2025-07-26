# Prerequisites/Postrequisites Upload System

This system allows you to upload prerequisite and postrequisite data from JSON files to the GT Course Planner database.

## Files

- `prerequisites.json` - Contains prerequisite data for courses
- `postrequisites.json` - Contains postrequisite data for courses  
- `upload-prereqs-script.js` - Main upload script
- `test-upload-system.js` - Test script with sample data
- `src/app/api/courses/upload-prereqs/route.ts` - API endpoint

## Data Format

### Prerequisites Format
```json
{
  "COURSE_CODE": [],  // No prerequisites
  "COURSE_CODE": ["and", {"id": "PREREQ_CODE", "grade": "C"}],  // Single prerequisite with grade
  "COURSE_CODE": ["or", {"id": "OPTION1", "grade": "C"}, {"id": "OPTION2", "grade": "C"}]  // Multiple options
}
```

### Postrequisites Format
```json
{
  "COURSE_CODE": ["POSTREQ1", "POSTREQ2", "POSTREQ3"]  // Array of course codes
}
```

## Usage

### 1. Validation Mode (Default)
Test your data without making changes:

```bash
node upload-prereqs-script.js
```

This will:
- Load and analyze the JSON files
- Validate data structure
- Check which courses exist in the database
- Show statistics and potential issues
- **NOT** make any database changes

### 2. Upload Mode
Actually upload the data to the database:

```bash
node upload-prereqs-script.js --upload --force
```

**⚠️ WARNING**: This will modify your database!

### 3. Test with Sample Data
Test the system with smaller sample files:

```bash
node test-upload-system.js
```

## API Endpoint

### POST `/api/courses/upload-prereqs`

**Body:**
```json
{
  "prerequisites": { /* prerequisite data */ },
  "postrequisites": { /* postrequisite data */ },
  "validateOnly": true  // Optional: only validate, don't update
}
```

**Response:**
```json
{
  "success": true,
  "message": "Upload complete: 1234 course entries updated",
  "stats": {
    "processed": 1500,
    "updated": 1234,
    "courseNotFound": 200,
    "validationErrors": 66,
    "totalErrors": 266
  },
  "errors": ["Course XYZ not found in database", ...],
  "validateOnly": false
}
```

## Error Handling

The system handles several types of errors:

1. **Course Not Found**: Course exists in JSON but not in database
2. **Validation Errors**: Invalid data structure (wrong format, missing fields)
3. **Database Errors**: Failed to update course in database
4. **Network Errors**: API connection issues

## Data Validation

### Prerequisites
- Must be an array
- First element can be "and" or "or" (optional)
- Subsequent elements must be objects with:
  - `id`: Course code (string, required)
  - `grade`: Minimum grade (string, optional)

### Postrequisites  
- Must be an array of strings
- Each string should be a valid course code

## Before Running

1. **Backup your database**
2. **Start the development server**: `npm run dev`
3. **Test with validation mode first**
4. **Review the error report**
5. **Only then proceed with actual upload**

## Troubleshooting

### Server Not Running
```
❌ Development server not running at http://localhost:3000
💡 Please start the server with: npm run dev
```

### Course Not Found Errors
Many courses in the JSON files might not exist in your database. This is normal for outdated course catalogs. The system will skip these courses and report them.

### High Error Rate
If more than 50% of entries have errors, the upload is considered failed. Review the errors and fix data issues before retrying.

## Examples

### Valid Prerequisite Entries
```json
{
  "CS 1301": [],
  "CS 1331": ["and", {"id": "CS 1301", "grade": "C"}],
  "MATH 2551": ["or", {"id": "MATH 1552", "grade": "C"}, {"id": "MATH 1X52", "grade": "C"}]
}
```

### Valid Postrequisite Entries
```json
{
  "CS 1301": ["CS 1331", "CS 1371"],
  "MATH 1551": ["MATH 1552", "PHYS 2211", "PHYS 2212"]
}
```

## Safety Features

- **Validation-first approach**: Always validate before uploading
- **Detailed error reporting**: Know exactly what will fail
- **Rollback capability**: Can be undone by uploading empty arrays
- **Batch processing**: Handles large datasets efficiently
- **Progress reporting**: Shows real-time upload progress