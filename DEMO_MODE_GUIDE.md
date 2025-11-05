# GT Course Planner - Demo Mode Guide

## Overview

The GT Course Planner now includes a comprehensive demo mode that showcases all features with realistic sample data. Demo mode allows visitors to explore the application without creating an account, making it perfect for presentations, demos, and first-time user experience.

## Quick Start

### Accessing Demo Mode

**From Landing Page:**
1. Visit the application homepage
2. Click the "Try Demo" button
3. You'll be instantly redirected to a fully populated dashboard

**Via URL Parameter:**
- Access directly with: `?demo=true` parameter
- Example: `https://your-domain.com/dashboard?demo=true`

## Demo Data Overview

### Student Profile: Alex Johnson

The demo showcases a realistic Computer Science senior at Georgia Tech:

- **Name:** Alex Johnson
- **Major:** Computer Science
- **Threads:** Intelligence, Devices
- **Minor:** Mathematics
- **Graduation Year:** 2026
- **Current GPA:** 3.75
- **Total Credits Earned:** 52
- **Current Status:** Junior (Fall 2024)

### Course Planning

The demo includes **8 semesters** of course data spanning Fall 2022 through Spring 2026:

**Completed Courses (13 courses, 45 credits):**
- Fall 2022 (4 courses): CS 1301, MATH 1551, ENGL 1101, HIST 2111
- Spring 2023 (4 courses): CS 1331, MATH 1552, ENGL 1102, PSYC 1101
- Fall 2023 (4 courses): CS 1332, MATH 2551, PHYS 2211, ECON 2105
- Spring 2024 (3 courses): CS 2110, MATH 1553, PHYS 2212

**In-Progress Courses (4 courses, 12 credits - Fall 2024):**
- CS 2340 (Objects and Design)
- CS 3510 (Design & Analysis of Algorithms)
- MATH 3012 (Applied Combinatorics)
- CS 3511 (Algorithms, Machines, & Languages)

**Planned Courses (6 courses, 18 credits):**
- Spring 2025: CS 3600, CS 3750, MATH 2050
- Fall 2025: CS 4641, CS 3651, CS 4400
- Spring 2026: CS 4476, CS 4460

### Academic Progress

**GPA History:**
- Fall 2022: 3.69
- Spring 2023: 3.77
- Fall 2023: 3.71
- Spring 2024: 3.83
- Fall 2024: 3.75 (projected)

**Completion Stats:**
- Total Courses: 23
- Completed: 13 (56.5%)
- In Progress: 4 (17.4%)
- Planned: 6 (26.1%)
- Completion Rate: 56.5%

### Deadlines (6 active)

Realistic GT academic deadlines:
1. Fall 2024 Drop/Swap Deadline (Sep 15, 2024)
2. Fall 2024 Withdrawal Deadline (Oct 25, 2024)
3. Spring 2025 Registration Begins (Nov 1, 2024)
4. Fall 2024 Final Exams (Dec 9, 2024)
5. Spring 2025 Classes Begin (Jan 6, 2025)
6. FASET Registration Deadline (Apr 1, 2025)

### Recent Activity (5 items)

- Added CS 4476 to Spring 2026 (2 hours ago)
- Marked CS 2110 as complete with grade A (1 day ago)
- Satisfied Calculus requirement (3 days ago)
- Moved CS 3600 to Spring 2025 (5 days ago)
- Updated academic profile - added Mathematics minor (7 days ago)

### Opportunities (9 total)

**Internships (3):**
- Google - Software Engineering Intern (Machine Learning)
- Microsoft - Cloud Infrastructure Intern
- TechStart Financial - Full Stack Development Intern

**Co-ops (2):**
- SpaceX - Robotics Engineering Co-op
- NASA - Software Co-op (Mission Control Systems)

**Research (2):**
- GT Machine Learning Lab - Undergraduate Research Assistant
- GT Robotics Lab - Research Assistant (Autonomous Systems)

**Full-Time Jobs (2):**
- Amazon - New Grad Software Engineer
- Meta - Software Engineer, Early Career

### Opportunity Applications (4)

1. **Draft:** Google ML Internship (cover letter in progress)
2. **Submitted:** GT ML Lab Research (application under review)
3. **Accepted:** TechStart Financial Internship (past)
4. **Rejected:** Microsoft Cloud Infrastructure (past)

### Advisors (6 available)

**Connected Advisors (2):**
1. Dr. Sarah Mitchell (Primary Academic Advisor) - Active
2. Dr. James Chen (Intelligence Thread Faculty) - Active

**Pending Connection (1):**
3. Dr. David Park (Systems Thread Faculty) - Requested

**Other Available:**
- Dr. Rebecca Taylor (Mathematics Minor Advisor)
- Michael Rodriguez (Career Development)
- Dr. Emily Zhang (Research Mentor - Not accepting new students)

### Advisor Appointments (4)

**Upcoming (1):**
- Nov 5, 2024 with Dr. Mitchell - Spring 2025 Course Registration Planning

**Past (3):**
- Aug 15, 2024 with Dr. Mitchell - Fall 2024 Course Selection (Completed)
- Sep 10, 2024 with Dr. Chen - ML Research Opportunities (Completed)
- Oct 18, 2024 with Michael Rodriguez - Resume Review (Cancelled)

## Features Showcased

### 1. Dashboard
- Welcome banner with student info
- Academic progress overview
- GPA trend chart
- Recent activity timeline
- Upcoming deadlines widget
- Thread/Minor progress visualization
- Quick stats cards

### 2. Course Planner
- Semester-based layout (Fall 2022 - Spring 2026)
- Drag-and-drop course management
- Color-coded course statuses:
  - Green: Completed
  - Blue: In Progress
  - Gray: Planned
- Credit hour tracking per semester
- GPA calculation per semester
- Course details modals with prerequisites

### 3. Requirements Tracking
- Degree requirements breakdown
- Thread requirements (Intelligence & Devices)
- Minor requirements (Mathematics)
- Progress bars for each category
- Completed vs. remaining courses
- Flexible requirement options

### 4. Course Explorer
- Searchable course catalog
- Filters by department, credits, type
- Course details with prerequisites
- Semester offerings display
- "Add to Plan" functionality

### 5. Opportunities
- Filterable opportunity list (type, company, deadline)
- Detailed opportunity cards
- Application management interface
- Cover letter drafting
- Application status tracking
- Opportunity recommendations based on profile

### 6. Advisors
- Advisor directory with search
- Filter by specialization, department, availability
- View advisor profiles and office hours
- Request connections
- Schedule appointments
- View appointment history

### 7. Profile
- Student information display
- Major, threads, and minors
- GPA and credit summary
- Graduation timeline
- Profile editing (in demo mode, changes don't persist)

## Demo Mode Features

### Demo Banner

A prominent amber banner appears at the top of the application when in demo mode:

**Features:**
- Clear "Demo Mode" indicator
- Student profile information (Alex Johnson, CS Major, Senior)
- Explanatory text about demo data
- Action buttons:
  - **Reset Demo:** Reloads page with fresh demo data
  - **Exit Demo:** Clears demo mode and returns to login
- Collapsible/expandable design
- Mobile-responsive with adapted layout

### Auto-Initialization

Demo mode automatically:
1. Generates all 8 semesters with proper date ranges
2. Populates student profile information
3. Loads all course data with correct statuses
4. Initializes GPA history
5. Sets up deadlines and activity feed
6. Creates opportunities and applications
7. Establishes advisor connections
8. Calculates academic progress

### Data Persistence

**Important Notes:**
- Demo data is stored in `localStorage` for session continuity
- Changes made in demo mode are temporary
- Refreshing the page resets to initial demo state
- Exiting demo mode clears all demo data

## Technical Implementation

### Core Files

1. **Demo Mode Utilities:** `/src/lib/demo-mode.ts`
   - `isDemoMode()` - Check if demo mode is active
   - `enableDemoMode()` - Activate demo mode
   - `disableDemoMode()` - Deactivate and clear data
   - `resetDemoMode()` - Reset to fresh demo data
   - `getDemoUser()` - Get demo user profile
   - `getDemoAuthUser()` - Get demo auth object

2. **Demo Data:** `/src/lib/demo-data.ts`
   - `DEMO_COMPLETED_COURSES` - 13 completed courses
   - `DEMO_IN_PROGRESS_COURSES` - 4 current courses
   - `DEMO_PLANNED_COURSES` - 6 future courses
   - `DEMO_DEADLINES` - 6 academic deadlines
   - `DEMO_ACTIVITY` - 5 activity items
   - `DEMO_GPA_HISTORY` - 5 semesters
   - `DEMO_OPPORTUNITIES` - 9 opportunities
   - `DEMO_APPLICATIONS` - 4 applications
   - `DEMO_ADVISORS` - 6 advisors
   - `DEMO_ADVISOR_CONNECTIONS` - 3 connections
   - `DEMO_APPOINTMENTS` - 4 appointments
   - `generateDemoSemesters()` - Creates semester structure
   - `getAllDemoCourses()` - Returns all courses
   - `getDemoStats()` - Calculates statistics

3. **Demo Banner Component:** `/src/components/demo/DemoBanner.tsx`
   - Auto-detection of demo mode
   - Collapsible banner UI
   - Reset and exit actions
   - Mobile-responsive design

4. **Store Integration:** `/src/hooks/usePlannerStore.ts`
   - `initializeStore()` - Detects demo mode and loads data
   - Automatic demo data population
   - Profile initialization

### Landing Page Integration

The landing page (`/src/components/landing/LandingPage.tsx`) includes:
- "Try Demo" button alongside "Begin Your Journey"
- Instant demo activation
- Smooth navigation to dashboard
- Loading states for better UX

## Presenting the Demo

### Recommended Demo Flow (10-15 minutes)

1. **Introduction (1 minute)**
   - Show landing page
   - Click "Try Demo" button
   - Point out demo banner

2. **Dashboard Overview (2 minutes)**
   - Highlight student profile (Alex Johnson)
   - Review GPA history chart
   - Show academic progress stats
   - Point out recent activity
   - Check upcoming deadlines

3. **Course Planning (3 minutes)**
   - Navigate to Course Planner
   - Show semester-by-semester layout
   - Demonstrate completed courses (green)
   - Highlight in-progress courses (blue)
   - Show planned future courses
   - Explain drag-and-drop functionality
   - Display course details modal

4. **Requirements Tracking (2 minutes)**
   - Navigate to Requirements
   - Show degree requirements breakdown
   - Highlight thread progress (Intelligence & Devices)
   - Display minor progress (Mathematics)
   - Explain flexible requirements

5. **Course Explorer (2 minutes)**
   - Navigate to Course Explorer
   - Demonstrate search functionality
   - Use filters (department, credits)
   - Show course details
   - Explain "Add to Plan" feature

6. **Opportunities (2 minutes)**
   - Navigate to Opportunities
   - Show different types (internships, co-ops, research, jobs)
   - Filter by type
   - Open opportunity details
   - Show application management

7. **Advisors (2 minutes)**
   - Navigate to Advisors
   - Browse advisor directory
   - Show connected advisors
   - Display upcoming appointments
   - Explain connection workflow

8. **Closing (1 minute)**
   - Return to dashboard
   - Summarize key features
   - Offer to answer questions
   - Explain how to exit demo mode

### Key Talking Points

**For Prospective Users:**
- "This is a realistic CS student in their junior year"
- "See how easy it is to track 4 years of coursework"
- "Requirements are automatically calculated"
- "Everything is drag-and-drop, no complex forms"

**For Stakeholders:**
- "Comprehensive feature set covering the full student lifecycle"
- "Real-time progress tracking and GPA calculation"
- "Integration with opportunities and advisor systems"
- "Fully functional demo without requiring authentication"

**For Developers:**
- "Built with Next.js 15, React 19, TypeScript"
- "State management with Zustand"
- "Supabase backend (demo mode bypasses database)"
- "Responsive design with Tailwind CSS"

## Troubleshooting

### Common Issues

**Demo mode not activating:**
- Clear browser localStorage and cookies
- Try incognito/private browsing mode
- Ensure JavaScript is enabled
- Check browser console for errors

**Data not displaying correctly:**
- Click "Reset Demo" button in demo banner
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear site data and try again

**Banner not showing:**
- Verify demo mode is enabled (check localStorage for 'gt-planner-demo-mode')
- Ensure you're on an authenticated page (not landing page)
- Try navigating to /dashboard directly with ?demo=true

**Demo mode persisting after exit:**
- Click "Exit Demo" button
- Manually clear localStorage
- Close all browser tabs and reopen

### Debug Mode

Check demo mode status in browser console:
```javascript
localStorage.getItem('gt-planner-demo-mode') // Should return 'true' in demo mode
```

Force enable demo mode:
```javascript
localStorage.setItem('gt-planner-demo-mode', 'true')
sessionStorage.setItem('gt-planner-demo-session', 'demo-' + Date.now())
window.location.reload()
```

Force disable demo mode:
```javascript
localStorage.removeItem('gt-planner-demo-mode')
sessionStorage.removeItem('gt-planner-demo-session')
window.location.href = '/'
```

## Extending Demo Mode

### Adding More Demo Data

Edit `/src/lib/demo-data.ts` to add:
- More courses to any semester
- Additional opportunities
- More advisor profiles
- Extra deadlines

Follow the existing patterns for data structure.

### Customizing Demo Profile

Modify `/src/lib/demo-mode.ts`:
- Change `DEMO_USER` object
- Update major, threads, minors
- Adjust GPA and credits
- Change graduation year

### Creating Multiple Demo Profiles

Future enhancement possibilities:
- Multiple demo profiles (freshman, sophomore, etc.)
- Different majors (CS, ME, EE, etc.)
- Profile selection on landing page
- Query param: `?demo=cs-senior` or `?demo=me-freshman`

## Security Notes

**Demo Mode Safeguards:**
- No real user data is exposed
- Demo mode bypasses authentication but doesn't compromise security
- All demo data is clearly marked
- Changes are not persisted to database
- Demo sessions are isolated

**Production Deployment:**
- Demo mode is safe for production
- Does not affect real user accounts
- No database writes in demo mode
- Clear visual indicators prevent confusion

## Contact & Support

For questions or issues with demo mode:
- Check console for error messages
- Review CLAUDE.md for technical details
- Consult PROJECT_SUMMARY.md for architecture overview

---

**Last Updated:** November 5, 2025
**Version:** 1.0
**Demo Mode Status:** Production Ready
