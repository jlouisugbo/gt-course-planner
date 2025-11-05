# GT Course Planner - Demo Presentation Quick Guide

## Pre-Demo Checklist

- [ ] Clear browser cache and localStorage
- [ ] Test demo mode activation from landing page
- [ ] Verify demo banner appears
- [ ] Confirm all data is loaded (dashboard, planner, requirements, etc.)
- [ ] Test on target browser (Chrome, Firefox, Safari)
- [ ] Prepare backup device in case of technical issues
- [ ] Have demo URL ready: `https://your-domain.com/?demo=true`

## Demo Script (10 Minutes)

### 1. Opening (30 seconds)

**Action:** Show landing page
**Say:**
> "Welcome to the GT Course Planner - a comprehensive academic planning tool for Georgia Tech students. Today I'll show you a fully functional demo featuring Alex Johnson, a Computer Science senior. Let's dive right in."

**Do:** Click "Try Demo" button

---

### 2. Dashboard (2 minutes)

**Action:** Point out key dashboard elements
**Say:**
> "Here's Alex's dashboard. You'll notice:"
> - "GPA of 3.75 with 52 credits completed"
> - "Currently enrolled in 4 courses this Fall 2024"
> - "GPA trend chart showing consistent performance"
> - "Recent activity - just added CS 4476 Computer Vision"
> - "Upcoming deadlines - registration starts November 1st"

**Highlight:**
- Student profile banner
- GPA history chart (interactive)
- Stats cards (courses, GPA, credits)
- Activity timeline
- Deadlines widget

**Optional Deep Dive:** Hover over GPA chart to show semester details

---

### 3. Course Planner (3 minutes)

**Action:** Navigate to Course Planner
**Say:**
> "The course planner is where the magic happens. Alex has planned 8 semesters from Fall 2022 through Spring 2026."

**Point Out:**
- Green courses = Completed (13 courses)
- Blue courses = In Progress (4 courses - current semester)
- Gray courses = Planned (6 future courses)

**Demo Interaction (choose one):**
Option A - Show course details:
> "Let's look at CS 3510 - Design & Analysis of Algorithms."
**Click** on CS 3510 card
> "Here we see the course description, prerequisites (CS 1332 and MATH 1553), and semester offerings."

Option B - Explain drag-and-drop (don't actually demo):
> "Students can drag courses between semesters to adjust their plan. The system automatically recalculates credits and GPA."

**Key Message:**
> "This visual layout makes it easy to see your entire academic journey at a glance."

---

### 4. Requirements Tracking (2 minutes)

**Action:** Navigate to Requirements
**Say:**
> "Here's where students track progress toward graduation. Alex is pursuing:"
> - "Computer Science BS degree - 126 credits required"
> - "Two threads: Intelligence and Devices"
> - "Mathematics minor"

**Show:**
- Degree requirements with progress bars
- Core CS requirements section (expand if available)
- Thread progress (~60-70% complete)
- Minor requirements status

**Key Message:**
> "The system automatically matches completed courses to requirements. Students always know exactly what they still need."

---

### 5. Course Explorer (1 minute)

**Action:** Navigate to Course Explorer
**Say:**
> "Need to find courses? The explorer has the entire GT catalog."

**Demo:**
1. Search for "Machine Learning" or filter by CS department
2. Show course cards with key info
3. Click one course to show details modal

**Key Message:**
> "Students can search, filter, and add courses directly to their plan."

---

### 6. Opportunities (1 minute)

**Action:** Navigate to Opportunities
**Say:**
> "The opportunities feature helps students find internships, co-ops, research positions, and full-time jobs."

**Show:**
- 9 opportunities (Google, Microsoft, NASA, SpaceX, etc.)
- Filter by type
- Application tracking (1 draft, 1 submitted, 1 accepted, 1 rejected)

**Optional:** Open one opportunity to show detailed requirements

**Key Message:**
> "Everything students need for career planning is built right in."

---

### 7. Advisors (30 seconds - optional if time permits)

**Action:** Navigate to Advisors
**Say:**
> "Students can connect with advisors and schedule appointments."

**Show:**
- Connected advisors (Dr. Mitchell, Dr. Chen)
- Upcoming appointment (Nov 5 with Dr. Mitchell)

**Key Message:**
> "Centralized advisor management streamlines the advising process."

---

### 8. Closing (30 seconds)

**Action:** Return to Dashboard
**Say:**
> "In summary, the GT Course Planner provides:"
> - "Visual 4-year course planning"
> - "Automatic requirement tracking"
> - "GPA monitoring and projections"
> - "Opportunity discovery and application tracking"
> - "Integrated advisor connections"

> "And everything you just saw is fully functional demo data - no signup required to explore."

**Point to demo banner:**
> "Notice the demo mode banner. Users can reset the demo or exit at any time."

**Final statement:**
> "Questions?"

---

## FAQ Responses

### "Is this real data?"
> "This is realistic demo data representing a typical GT Computer Science student. It showcases all the features without requiring authentication. Real users would see their own personalized data."

### "How does the drag-and-drop work?"
> "Students can drag course cards between semesters. The system validates prerequisites and credit limits, then automatically recalculates their GPA and progress toward graduation."

### "What about mobile devices?"
> "The application is fully responsive. While the demo works best on desktop for presentations, students can access their plans on phones and tablets."

### "How is GPA calculated?"
> "GPA is calculated using standard 4.0 scale (A=4.0, B=3.0, etc.) weighted by credit hours. The system tracks both semester GPA and cumulative GPA, with historical trending."

### "Can students change their major or threads?"
> "Yes, through the profile settings. The system automatically recalculates requirements based on the new selections."

### "What about transfer credits?"
> "Students can mark courses as completed during profile setup or add them later. The system counts them toward requirements and GPA accordingly."

### "How accurate is the requirement tracking?"
> "Requirements are pulled directly from Georgia Tech's course catalog and degree program specifications. The data is kept current with official GT requirements."

### "Is there an export feature?"
> "Students can export their course plan (feature may vary by deployment). The data is also automatically saved to their account."

---

## Quick Recovery

### If Demo Mode Breaks

**Symptoms:** Blank pages, no data showing, errors
**Fix:**
1. Click "Reset Demo" in banner
2. If that fails, hard refresh (Ctrl+Shift+R)
3. If still broken, add `?demo=true` to URL
4. Nuclear option: Clear browser data and restart

**Backup Plan:**
- Have screenshots/video of key features ready
- Switch to explaining architecture instead of live demo
- Use backup device with pre-loaded demo

### If Question Stumps You

**Response Template:**
> "That's a great question. While I can speak to [related feature you know], the specifics of [unknown topic] would be better addressed by [appropriate team/person]. What I can tell you is [pivot to known information]."

**Graceful Deflection:**
> "I want to give you an accurate answer. Let me note that question and follow up with you after the presentation with detailed information."

---

## Post-Demo Actions

- [ ] Thank the audience
- [ ] Offer to send demo link
- [ ] Collect questions for follow-up
- [ ] Note any technical issues for future improvements
- [ ] Clear demo mode if using shared device
- [ ] Send DEMO_MODE_GUIDE.md to interested parties

---

## Demo URLs

**Landing Page:** `https://your-domain.com/`
**Direct Demo Access:** `https://your-domain.com/dashboard?demo=true`
**Demo with Auto-Redirect:** `https://your-domain.com/?demo=true`

---

## Timing Cheat Sheet

If you need to adjust timing:

**5-Minute Version:**
- Dashboard (1 min)
- Planner (2 min)
- Requirements (1 min)
- Closing (1 min)

**15-Minute Version:**
- Add more interaction
- Show mobile responsive design
- Demonstrate drag-and-drop
- Walk through opportunity application
- Schedule an advisor appointment
- Q&A throughout

---

**Presenter Tips:**
- Speak slowly and clearly
- Pause for reactions
- Ask "any questions?" periodically
- Smile and make eye contact
- Have water nearby
- Practice at least once before real presentation

---

**Good luck with your demo!**
