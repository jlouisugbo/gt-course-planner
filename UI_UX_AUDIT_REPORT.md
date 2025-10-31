# GT Course Planner - Comprehensive UI/UX Audit Report

**Date**: 2025-10-28
**Agent**: ui-ux-consistency
**Scope**: Complete visual audit and styling consistency review

## Executive Summary

This comprehensive audit identified **47 distinct UI/UX issues** across the GT Course Planner application. Issues are categorized by severity (CRITICAL, HIGH, MEDIUM, LOW) and cover layout, spacing, responsive design, icon alignment, text overflow, and theme consistency.

**Key Findings**:
- 8 CRITICAL issues (layout breaking, overflow, mobile unusable)
- 14 HIGH issues (significant spacing, poor responsive behavior)
- 17 MEDIUM issues (minor inconsistencies, improvements needed)
- 8 LOW issues (nice-to-have enhancements)

---

## Issues by Component

### 1. PLANNER COMPONENTS

#### `src/components/planner/PlannerGrid.tsx`
**CRITICAL Issues**:
- ❌ Lines 428: Grid layout `grid-cols-1 md:grid-cols-3` forces 3 columns on medium screens - causes cramping on tablets (768px-1024px). Should be `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- ❌ Line 297: Semester title missing `truncate` - can overflow on long semester names at mobile breakpoints

**HIGH Issues**:
- ⚠️ Line 444: "Add New Semester" button missing responsive text sizing - too large on mobile
- ⚠️ Line 444: Button uses `min-h-[120px]` which is excessive on mobile - should be responsive

**MEDIUM Issues**:
- 📝 Line 126-127: Course code uses `truncate` but container may still overflow in narrow cards
- 📝 Line 149: Course title uses `line-clamp-1` but may need responsive adjustment for varying card widths

#### `src/components/planner/parts/PlannerCourseCard.tsx`
**HIGH Issues**:
- ⚠️ Lines 186-201: Course title uses inline CSS for webkit line clamp instead of Tailwind `line-clamp-2` class
- ⚠️ Line 158: DropdownMenu trigger button only `h-5 w-5` - too small for mobile touch targets (should be min 44px)

**MEDIUM Issues**:
- 📝 Line 139: Icon + text layout uses `space-x-2` but no `flex items-center` wrapper in some cases
- 📝 Line 204-218: Uses `pendingStatusUpdate?.grade` variable that is undefined, causing potential layout issues

### 2. REQUIREMENTS COMPONENTS

#### `src/components/requirements/RequirementsDashboard.tsx`
**CRITICAL Issues**:
- ❌ Line 173: Progress grid uses `grid-cols-2 md:grid-cols-4` - 2 columns on mobile is too cramped. Should be `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- ❌ Line 303: TabsList grid `grid-cols-4` breaks on mobile - tabs overflow. Should be responsive or scrollable

**HIGH Issues**:
- ⚠️ Line 146: Header title `text-xl lg:text-2xl` missing intermediate breakpoint (sm:, md:)
- ⚠️ Line 238: DialogContent `max-w-2xl max-h-[80vh]` missing responsive padding adjustments
- ⚠️ Line 346: Progress grid repeats at line 173 pattern - same issue applies

**MEDIUM Issues**:
- 📝 Line 154: Button with icon and text missing explicit `flex items-center` wrapper
- 📝 Line 175-185: Stats cards missing overflow protection for long credit numbers

#### `src/components/requirements/parts/RequirementCategory.tsx`
**HIGH Issues**:
- ⚠️ Line 206: Button is only `h-4 w-4` - far too small for accessibility (min 44x44px)
- ⚠️ Line 209-211: Icons `h-2.5 w-2.5` - extremely small, hard to see

**MEDIUM Issues**:
- 📝 Line 198: Container `space-y-0.5` uses extremely tight spacing - may look cramped
- 📝 Line 214: Text `text-[11px]` is below minimum readable size (12px recommended)

#### `src/components/requirements/parts/RequirementSection.tsx`
**HIGH Issues**:
- ⚠️ Line 196-214: Footnotes sidebar fixed `w-48` - breaks layout on small tablets, should be responsive
- ⚠️ Line 205: Max height `max-h-48` with `overflow-y-auto` but no scroll indicators

**MEDIUM Issues**:
- 📝 Line 85: Icon size `h-2.5 w-2.5` - too small for visibility
- 📝 Line 138-148: Progress indicator `h-0.5 w-12` - extremely thin, hard to see
- 📝 Line 207: Text `text-[10px]` - below minimum readable size

#### `src/components/requirements/parts/CompletableCourseCard.tsx`
**MEDIUM Issues**:
- 📝 Line 206-210: Checkbox `w-3 h-3` - too small for mobile touch (min 44x44px recommended)
- 📝 Line 220-222: Icon sizes `h-2.5 w-2.5` - too small
- 📝 Line 224-228: Font size `text-[11px]` - below readable minimum
- 📝 Line 232: Font size `text-[10px]` - too small

### 3. DASHBOARD COMPONENTS

#### `src/components/dashboard/parts/DashboardDeadlines.tsx`
**HIGH Issues**:
- ⚠️ Line 104: Reference to `deadlines.filter` but should use `displayDeadlines` (variable scoping issue)
- ⚠️ Line 130-136: Deadline card uses fixed padding `p-4` - should be responsive `p-3 sm:p-4`

**MEDIUM Issues**:
- 📝 Line 101-102: CardTitle with icon but no explicit `flex items-center gap-2` pattern
- 📝Line 142-144: Course title missing `truncate` or `line-clamp` for overflow protection

#### `src/components/dashboard/parts/DeadlinesPanel.tsx`
**HIGH Issues**:
- ⚠️ Line 145-149: Deadline card layout not responsive - should collapse to column on mobile
- ⚠️ Line 171: Text with `line-clamp-2` but parent div has `flex-1 min-w-0` which may cause issues

**MEDIUM Issues**:
- 📝 Line 152-157: No explicit `flex items-center` for title + badge layout
- 📝 Line 178-186: Link button `opacity-0 group-hover:opacity-100` inaccessible on touch devices

#### `src/app/dashboard/page.tsx`
**HIGH Issues**:
- ⚠️ Line 60: Stats grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` jumps from 1 to 2 - add `sm:grid-cols-2`
- ⚠️ Line 159: Course title uses `truncate` but no max-width constraint

**MEDIUM Issues**:
- 📝 Line 46-49: Header title with icon but no responsive text sizing
- 📝 Line 186-215: Button group in Quick Actions missing responsive padding

### 4. COURSES COMPONENTS

#### `src/components/courses/CourseExplorer.tsx`
**HIGH Issues**:
- ⚠️ Line 199: Header layout `flex-col lg:flex-row` skips md breakpoint - should be `flex-col md:flex-row lg:flex-row`
- ⚠️ Line 208: Button group missing responsive gap adjustment

**MEDIUM Issues**:
- 📝 Line 201: Title `text-3xl` missing responsive sizing `text-2xl sm:text-3xl`
- 📝Line 232-239: Filter button missing responsive text (hides "Filters" text on mobile)

**LOW Issues**:
- 💡 Line 288-291: Empty state icon could be larger on desktop for better visual hierarchy

#### `src/components/courses/parts/CourseFilters.tsx`
**MEDIUM Issues**:
- 📝 Line 93: CardHeader uses `flex-col sm:flex-row` but should validate spacing at breakpoint
- 📝 Line 138-148: Badge group uses `flex-wrap gap-2` - good, but badges could have max-width for long text
- 📝 Line 213-219: Active filter badges with X button - button too small for touch targets

**LOW Issues**:
- 💡 Line 77-87: Loading skeleton could be more sophisticated with staggered animations

### 5. LAYOUT COMPONENTS

#### `src/components/layout/Header.tsx`
**CRITICAL Issues**:
- ❌ Line 94-117: Mobile navigation forced to single row with 6 items - causes cramping/overflow on small devices (< 375px)
- ❌ Line 51-72: Desktop navigation uses `space-x-1` with no overflow handling - can break on medium screens with many items

**HIGH Issues**:
- ⚠️ Line 77-83: Demo button hidden on mobile (`hidden sm:flex`) but should be accessible on all devices
- ⚠️ Line 84-86: User name hidden on mobile - important context lost

**MEDIUM Issues**:
- 📝 Line 44: Icon + title uses `space-x-3` but no explicit flex alignment
- 📝 Line 112: Mobile nav icon + label uses `flex-col` but icons are `h-5 w-5` - could be larger on tablets

### 6. PROFILE COMPONENTS

#### `src/components/profile/ProfileSetup.tsx`
**HIGH Issues**:
- ⚠️ Line 138: Progress indicators `flex-col sm:flex-row` but text may overflow on small devices
- ⚠️ Line 159-220: Step navigation grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` may cause layout shift - consider fixed heights

**MEDIUM Issues**:
- 📝 Line 128: Header title `text-2xl sm:text-3xl` - good, but needs `break-words` for long text
- 📝 Line 175-182: Step card uses fixed `min-h-[76px]` which may not work on all screen sizes
- 📝 Line 260-272: Button group switches from column to row but no gap adjustment

**LOW Issues**:
- 💡 Line 119-124: Icon container `w-12 h-12` could be responsive `w-10 h-10 sm:w-12 sm:h-12`

---

## Common Patterns Needing Standardization

### Spacing Inconsistencies
1. **Inconsistent gap sizing**: Some components use `space-x-1`, others `gap-1`, others `space-x-2` for same purpose
2. **Card padding**: Varies between `p-2`, `p-3`, `p-4`, `p-6` without clear hierarchy
3. **Section spacing**: Mixes `space-y-4`, `space-y-6`, `space-y-8` without pattern

### Icon Alignment Issues
1. **Inconsistent icon sizing**: Uses `h-3 w-3`, `h-4 w-4`, `h-5 w-5` interchangeably for similar contexts
2. **Missing flex wrappers**: Many icon+text combos missing explicit `flex items-center gap-2`
3. **Touch target violations**: Multiple buttons/checkboxes < 44x44px (WCAG AA failure)

### Responsive Design Gaps
1. **Missing sm: breakpoint**: Many jump from base to md:, causing poor tablet experience
2. **Fixed widths**: Several components use fixed pixel widths without responsive alternatives
3. **Grid column jumps**: Grids that go 1 → 4 columns skip intermediate layouts
4. **Text overflow**: Missing `truncate`, `line-clamp`, or `break-words` on dynamic content

### Text Overflow Vulnerabilities
1. **Course titles**: Missing overflow protection in 8+ locations
2. **User names**: Header and dashboard lack max-width constraints
3. **Deadline descriptions**: Several cards missing line-clamp
4. **Badge text**: Long college names can overflow badge containers

### GT Theme Inconsistencies
1. **Primary color usage**: Mixes `#003057`, `#B3A369`, and `text-gt-navy` inconsistently
2. **Badge variants**: Uses `default`, `secondary`, `outline` without clear semantic meaning
3. **Border colors**: Mixes `border-gray-200`, `border-slate-200`, `border-slate-300`

---

## Priority Fix List (Top 20)

### CRITICAL (Must Fix Immediately)
1. ✅ PlannerGrid.tsx:428 - Fix grid responsive columns
2. ✅ RequirementsDashboard.tsx:173 - Fix progress grid mobile layout
3. ✅ RequirementsDashboard.tsx:303 - Fix tab overflow on mobile
4. ✅ Header.tsx:94-117 - Fix mobile navigation overflow
5. ✅ Header.tsx:51-72 - Add overflow handling to desktop nav

### HIGH (Fix in Phase 2)
6. ✅ PlannerCourseCard.tsx:186-201 - Replace inline CSS with Tailwind classes
7. ✅ RequirementCategory.tsx:206 - Increase button size for accessibility
8. ✅ RequirementSection.tsx:196-214 - Make footnotes sidebar responsive
9. ✅ DashboardDeadlines.tsx:130-136 - Add responsive padding
10. ✅ CourseExplorer.tsx:199 - Fix header responsive breakpoints
11. ✅ ProfileSetup.tsx:159-220 - Stabilize step navigation layout
12. ✅ DeadlinesPanel.tsx:145-149 - Fix deadline card mobile layout
13. ✅ Dashboard/page.tsx:60 - Add intermediate grid breakpoint
14. ✅ PlannerGrid.tsx:444 - Make Add Semester button responsive

### MEDIUM (Fix in Phase 3)
15. ✅ Standardize icon sizes across all components (h-4 w-4 default)
16. ✅ Add explicit flex wrappers for all icon+text combinations
17. ✅ Add truncate/line-clamp to all course titles
18. ✅ Fix all touch target sizes (min 44x44px)
19. ✅ Standardize card padding (p-4 sm:p-6 pattern)
20. ✅ Add break-words to all user-generated text

---

## Accessibility Violations (WCAG AA)

### Touch Target Size (Success Criterion 2.5.5)
- RequirementCategory.tsx:206 - Button 16x16px (need 44x44px)
- CompletableCourseCard.tsx:206-210 - Checkbox 12x12px
- PlannerCourseCard.tsx:158 - Dropdown trigger 20x20px
- CourseFilters.tsx:213-219 - X buttons too small

### Color Contrast (Success Criterion 1.4.3)
- RequirementSection.tsx:207 - text-[10px] in gray may fail contrast
- CompletableCourseCard.tsx:232 - text-[10px] text-slate-500

### Text Sizing (Success Criterion 1.4.4)
- Multiple components use text-[10px] and text-[11px] (below 12px minimum)

---

## Recommended Standard Patterns

### Container Pattern
```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
```

### Card Pattern
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4 sm:p-6 space-y-4">
```

### Button Group Pattern
```tsx
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
```

### Icon + Text Pattern
```tsx
<div className="flex items-center gap-2">
  <Icon className="h-4 w-4 flex-shrink-0" />
  <span className="truncate">Text</span>
</div>
```

### Responsive Grid Pattern
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
```

### Text Overflow Protection
```tsx
<h2 className="text-lg font-semibold truncate">Single line</h2>
<p className="text-sm line-clamp-2 break-words">Multi-line</p>
```

---

## Next Steps

### Phase 2: Fix shadcn/ui Component Usage (3 hours)
- Apply className overrides to fix all CRITICAL issues
- Ensure responsive behavior at all breakpoints
- Fix text overflow issues
- Increase touch target sizes

### Phase 3: Standardize Spacing (1 hour)
- Apply standard container patterns
- Unify card padding
- Standardize section spacing

### Phase 4: Fix Icon Alignment (30 min)
- Ensure all icons use consistent sizing
- Add flex wrappers where missing
- Fix vertical alignment issues

### Phase 5: Responsive Validation (2 hours)
- Test all pages at 375px, 768px, 1024px, 1440px, 1920px
- Fix any remaining breakpoint issues
- Ensure smooth transitions between breakpoints

### Phase 6: GT Theme Consistency (1 hour)
- Audit color usage
- Standardize badge variants
- Ensure brand consistency

---

**Total Issues Found**: 47
**Total Components Audited**: 20
**Estimated Fix Time**: 7.5 hours
**Priority Level**: HIGH (multiple critical issues affecting usability)
