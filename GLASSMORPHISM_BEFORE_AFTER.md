# Glassmorphism Design - Before & After Code Comparisons

## Quick Reference Guide for Key Changes

---

## 1. Card Component (Base UI)

### Before
```tsx
<div
  data-slot="card"
  className={cn(
    "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-md bg-white hover:shadow-lg transition-shadow duration-200",
    className
  )}
  {...props}
/>
```

### After
```tsx
<div
  data-slot="card"
  className={cn(
    "glass-card glass-hover text-card-foreground flex flex-col gap-6 rounded-xl py-6 transition-all duration-300 relative z-10",
    className
  )}
  {...props}
/>
```

**Key Changes:**
- `bg-white` → `glass-card` (glassmorphism effect)
- `shadow-md` → Removed (glass-card includes shadow)
- `hover:shadow-lg` → `glass-hover` (includes lift animation)
- `transition-shadow` → `transition-all` (smooth all properties)
- Added `z-10` for proper layering

---

## 2. Header Navigation

### Before
```tsx
<header className="h-16 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
  <div className="flex items-center space-x-3">
    <BookOpen className="h-5 w-5 text-gt-gold hidden sm:block" />
    <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
  </div>
</header>
```

### After
```tsx
<header className="h-16 glass-dark glass-dark-hover border-b border-white/20 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-50 backdrop-blur-xl">
  <div className="flex items-center space-x-3">
    <BookOpen className="h-5 w-5 text-gt-gold hidden sm:block drop-shadow-lg" />
    <h1 className="text-xl font-semibold text-white glass-text-light">{getPageTitle()}</h1>
  </div>
</header>
```

**Key Changes:**
- `bg-white` → `glass-dark` (Navy-tinted glass)
- Added `glass-dark-hover` (interactive hover)
- `border-b` → `border-b border-white/20` (subtle border)
- Added `sticky top-0 z-50` (floating header)
- Added `backdrop-blur-xl` (enhanced blur)
- `text-gray-900` → `text-white glass-text-light` (readable on dark glass)
- Icon: Added `drop-shadow-lg` (depth)

---

## 3. Sidebar Navigation

### Before
```tsx
<aside
  className={cn(
    "fixed top-0 left-0 h-screen bg-gray-900 text-white flex flex-col z-50 transition-all duration-300 border-r border-gray-800",
    "hidden lg:flex",
    isCollapsed ? "lg:w-20" : "lg:w-[180px]"
  )}
>
```

### After
```tsx
<aside
  className={cn(
    "fixed top-0 left-0 h-screen glass-dark text-white flex flex-col z-50 transition-all duration-300 border-r border-white/20 backdrop-blur-xl",
    "hidden lg:flex",
    isCollapsed ? "lg:w-20" : "lg:w-[180px]"
  )}
>
```

**Key Changes:**
- `bg-gray-900` → `glass-dark` (glass effect instead of solid)
- `border-gray-800` → `border-white/20` (light border)
- Added `backdrop-blur-xl` (strong blur)

**Nav Item Active State - Before:**
```tsx
className={cn(
  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 relative group",
  isActive
    ? "bg-gt-gold/20 text-white border-l-4 border-gt-gold"
    : "text-gray-300 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
)}
```

**Nav Item Active State - After:**
```tsx
className={cn(
  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 relative group",
  isActive
    ? "glass-gold text-white border-l-4 border-gt-gold shadow-lg"
    : "text-gray-300 hover:glass-light hover:text-white border-l-4 border-transparent"
)}
```

**Key Changes:**
- Active: `bg-gt-gold/20` → `glass-gold` (glass effect with gold tint)
- Hover: `hover:bg-gray-800` → `hover:glass-light` (glass on hover)
- Active: Added `shadow-lg` (emphasis)

---

## 4. Dashboard Background

### Before
```tsx
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto space-y-6">
    {/* Content */}
  </div>
</div>
```

### After
```tsx
<div className="min-h-screen relative z-10">
  <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
    {/* Content */}
  </div>
</div>
```

**Key Changes:**
- `bg-gray-50` → Removed (shows animated gradient from body)
- Added `relative z-10` (proper layering)
- Added `p-4 sm:p-6` (consistent padding)

**Body Background (globals.css):**
```css
/* NEW */
body {
  background: linear-gradient(135deg, #003057 0%, #001f3f 25%, #002b54 50%, #001f3f 75%, #003057 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}
```

---

## 5. Welcome Header (Dashboard)

### Before
```tsx
<Card className="bg-gt-gradient text-white border-0 shadow-lg">
  <CardContent className="p-8">
    {/* Content */}
  </CardContent>
</Card>
```

### After
```tsx
<Card className="glass-dark bg-gt-gradient text-white border-white/20 shadow-2xl backdrop-blur-2xl">
  <CardContent className="p-8">
    {/* Content */}
  </CardContent>
</Card>
```

**Key Changes:**
- Added `glass-dark` (glass overlay on gradient)
- `border-0` → `border-white/20` (subtle border)
- `shadow-lg` → `shadow-2xl` (enhanced depth)
- Added `backdrop-blur-2xl` (strong blur for glass effect)

---

## 6. Stat Cards (Dashboard)

### Before
```tsx
<Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-[#B3A369]/20 hover:border-l-[#B3A369] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:outline-none">
```

### After
```tsx
<Card className="glass-strong glass-hover border-l-4 border-l-[#B3A369]/30 hover:border-l-[#B3A369] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:outline-none shadow-xl">
```

**Key Changes:**
- Added `glass-strong` (strong glass for interactive card)
- Added `glass-hover` (lift animation on hover)
- `border-l-[#B3A369]/20` → `/30` (more visible border)
- `hover:shadow-lg` → `shadow-xl` (always elevated)

---

## 7. Course Cards (Requirements)

### Before
```tsx
<Card
  className={`${getCardTheme()} py-2 transition-all duration-300 cursor-pointer group relative overflow-hidden border-2 hover:shadow-xl`}
  onClick={handleCardClick}
>
```

### After
```tsx
<Card
  className={`${getCardTheme()} glass-strong glass-hover py-2 cursor-pointer group relative overflow-hidden border-2 shadow-lg`}
  onClick={handleCardClick}
>
```

**Key Changes:**
- Added `glass-strong` (glass effect on course cards)
- Added `glass-hover` (interactive transitions)
- `hover:shadow-xl` → `shadow-lg` (consistent elevation)

---

## 8. Planner Semester Cards

### Before
```tsx
<Card
  className={cn(
    "h-full transition-all duration-200 relative focus-within:ring-2 focus-within:ring-blue-500/20",
    isOver && "ring-2 ring-[#B3A369] ring-opacity-50",
    isCurrent && "border-[#B3A369] shadow-lg",
    isCompleted && "border-green-300 bg-green-50/30"
  )}
>
```

### After
```tsx
<Card
  className={cn(
    "h-full glass-strong transition-all duration-200 relative focus-within:ring-2 focus-within:ring-blue-500/20 shadow-xl",
    isOver && "ring-2 ring-[#B3A369] ring-opacity-50 glass-gold",
    isCurrent && "border-[#B3A369] shadow-2xl glass-gold",
    isCompleted && "border-green-300 glass-success"
  )}
>
```

**Key Changes:**
- Added `glass-strong` (base glass effect)
- Added `shadow-xl` (elevation)
- Drag over: Added `glass-gold` (gold-tinted glass feedback)
- Current: `shadow-lg` → `shadow-2xl` + `glass-gold` (emphasis)
- Completed: `bg-green-50/30` → `glass-success` (green-tinted glass)

---

## 9. Course Cards in Planner

### Before
```tsx
<div
  className={cn(
    "p-1.5 rounded border transition-all duration-200 hover:shadow-sm",
    isCompleted && "bg-green-50 border-green-200",
    isCurrent && "bg-yellow-50 border-yellow-200",
    !isCompleted && !isCurrent && "bg-white border-gray-200 hover:border-[#B3A369]/30"
  )}
>
```

### After
```tsx
<div
  className={cn(
    "glass-light p-1.5 rounded border transition-all duration-200 hover:shadow-sm hover:glass",
    isCompleted && "glass-success border-green-200",
    isCurrent && "glass-warning border-yellow-200",
    !isCompleted && !isCurrent && "border-white/30 hover:border-[#B3A369]/50"
  )}
>
```

**Key Changes:**
- `bg-white` → `glass-light` (subtle glass)
- Added `hover:glass` (enhanced on hover)
- Completed: `bg-green-50` → `glass-success` (status-specific glass)
- Current: `bg-yellow-50` → `glass-warning` (status-specific glass)
- Default border: `border-gray-200` → `border-white/30` (light translucent)

---

## 10. Drop Zones (Planner)

### Before
```tsx
<div
  className={cn(
    "flex flex-col items-center justify-center py-3 border-2 border-dashed rounded-lg transition-colors min-h-[80px]",
    isOver ? "border-[#B3A369] bg-[#B3A369]/5" : "border-gray-300"
  )}
>
```

### After
```tsx
<div
  className={cn(
    "flex flex-col items-center justify-center py-3 border-2 border-dashed rounded-lg transition-colors min-h-[80px] glass-light",
    isOver ? "border-[#B3A369] glass-gold" : "border-white/30"
  )}
>
```

**Key Changes:**
- Added `glass-light` (base glass effect)
- Hover: `bg-[#B3A369]/5` → `glass-gold` (gold-tinted glass)
- Default: `border-gray-300` → `border-white/30` (translucent)

---

## 11. Add Semester Button

### Before
```tsx
<Button
  variant="outline"
  className="border-dashed border-2 border-[#B3A369] text-[#B3A369] hover:bg-[#B3A369]/5 min-h-[80px]"
>
  <Plus className="h-6 w-6" />
  <span className="text-sm font-medium">Add New Semester</span>
</Button>
```

### After
```tsx
<Button
  variant="outline"
  className="glass-gold glass-gold-hover border-dashed border-2 border-[#B3A369] text-white min-h-[80px] shadow-lg"
>
  <Plus className="h-6 w-6 drop-shadow-lg" />
  <span className="text-sm font-medium glass-text-light">Add New Semester</span>
</Button>
```

**Key Changes:**
- Added `glass-gold` (gold-tinted glass effect)
- Added `glass-gold-hover` (interactive hover)
- `text-[#B3A369]` → `text-white` (white on glass)
- Added `shadow-lg` (elevation)
- `hover:bg-[#B3A369]/5` → Removed (handled by glass-gold-hover)
- Icon: Added `drop-shadow-lg` (depth)
- Text: Added `glass-text-light` (readable shadow)

---

## 12. Global CSS Changes

### Custom Classes - Before
```css
.course-card {
  @apply bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-move hover:shadow-lg transition-all duration-200;
}

.semester-column {
  @apply bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 min-h-[500px] transition-colors;
}

.gt-card {
  @apply bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow;
}
```

### Custom Classes - After
```css
.course-card {
  @apply glass-strong glass-hover rounded-lg p-4 cursor-move transition-all duration-200;
  border-left: 4px solid transparent;
}

.semester-column {
  @apply glass-light border-2 border-dashed rounded-xl p-6 min-h-[500px] transition-all duration-200;
  border-color: rgba(255, 255, 255, 0.2);
}

.gt-card {
  @apply glass-card glass-hover rounded-xl transition-all duration-200;
}
```

**Key Changes:**
- All solid backgrounds (`bg-white`, `bg-gray-50`) replaced with glass utilities
- Solid borders replaced with translucent borders
- Added glass hover effects for interactivity
- Simplified shadow management (handled by glass utilities)

---

## Glass Utility Class Reference

### Primary Glass Effects
```css
.glass           /* 10px blur, 10% white opacity */
.glass-strong    /* 16px blur, 15% white opacity - for cards */
.glass-light     /* 8px blur, 5% white opacity - for backgrounds */
.glass-dark      /* 12px blur, Navy-tinted - for navigation */
.glass-gold      /* 10px blur, Gold-tinted - for accents */
```

### Hover Effects
```css
.glass-hover       /* Standard hover: lift + brightness */
.glass-gold-hover  /* Gold-tinted hover */
.glass-dark-hover  /* Dark navigation hover */
```

### Status Variants
```css
.glass-success  /* Green-tinted (completed) */
.glass-warning  /* Yellow-tinted (in progress) */
.glass-error    /* Red-tinted (failed) */
.glass-info     /* Blue-tinted (informational) */
```

### Composite Classes
```css
.glass-card      /* Full card with glass + gradient line */
.glass-badge     /* Glassmorphism badge */
.glass-button    /* Interactive button styling */
.glass-overlay   /* Modal/dropdown backdrop */
```

### Text Helpers
```css
.glass-text-light  /* White text with dark shadow (for dark glass) */
.glass-text-dark   /* Dark text with light shadow (for light glass) */
```

---

## Color Values Reference

### Glass Backgrounds
```css
/* Standard glass */
rgba(255, 255, 255, 0.1)  /* glass */
rgba(255, 255, 255, 0.15) /* glass-strong */
rgba(255, 255, 255, 0.05) /* glass-light */

/* Tinted glass */
rgba(0, 48, 87, 0.3)      /* glass-dark (GT Navy) */
rgba(179, 163, 105, 0.1)  /* glass-gold (GT Gold) */
rgba(16, 185, 129, 0.1)   /* glass-success (Green) */
rgba(251, 191, 36, 0.1)   /* glass-warning (Yellow) */
rgba(239, 68, 68, 0.1)    /* glass-error (Red) */
```

### Borders
```css
rgba(255, 255, 255, 0.1)  /* border-white/10 */
rgba(255, 255, 255, 0.2)  /* border-white/20 */
rgba(255, 255, 255, 0.3)  /* border-white/30 */
rgba(179, 163, 105, 0.2)  /* GT Gold border */
```

### Text Shadows
```css
0 1px 3px rgba(0, 0, 0, 0.3)      /* glass-text-light */
0 1px 2px rgba(255, 255, 255, 0.3) /* glass-text-dark */
```

---

## Migration Pattern for New Components

### Pattern 1: Replace Solid Backgrounds
```tsx
// OLD
<div className="bg-white border border-gray-200">

// NEW
<div className="glass-strong border border-white/20">
```

### Pattern 2: Add Hover Effects
```tsx
// OLD
<Card className="hover:shadow-lg transition-shadow">

// NEW
<Card className="glass-card glass-hover">
```

### Pattern 3: Status Indicators
```tsx
// OLD
<Badge className="bg-green-50 text-green-800 border-green-200">

// NEW
<Badge className="glass-success text-green-800 border-green-200">
```

### Pattern 4: Navigation Elements
```tsx
// OLD
<nav className="bg-gray-900 border-r border-gray-800">

// NEW
<nav className="glass-dark border-r border-white/20 backdrop-blur-xl">
```

---

## Summary of Changes

### Files Created
- `/home/user/gt-course-planner/src/styles/glass.css` (350 lines)

### Files Modified
1. `src/app/globals.css` - Animated background + glass class imports
2. `src/components/ui/card.tsx` - Base Card with glass defaults
3. `src/components/layout/Header.tsx` - Glass navigation header
4. `src/components/layout/Sidebar.tsx` - Glass sidebar + nav items
5. `src/components/dashboard/Dashboard.tsx` - Remove solid background
6. `src/components/dashboard/parts/WelcomeHeader.tsx` - Glass welcome card
7. `src/components/dashboard/parts/StatCard.tsx` - Glass stat cards
8. `src/components/requirements/parts/CourseCard.tsx` - Glass course cards
9. `src/components/requirements/parts/CompletableCourseCard.tsx` - Glass mini cards
10. `src/components/planner/PlannerGrid.tsx` - Glass semester cards + course cards

### Total Changes
- **New CSS Lines:** 350+
- **Modified Lines:** ~450
- **Glass Classes Added:** 15+ utility classes
- **Components Updated:** 10 core components

---

**Result:** A cohesive, modern glassmorphism design system that feels premium and professional while maintaining GT branding and accessibility standards.
