# Notification System Quick Start Guide

## What Was Built

A complete, production-ready smart notification system for the GT Course Planner with:
- Database tables with Row Level Security (RLS)
- REST API endpoints for CRUD operations
- React components with real-time polling
- Notification service for programmatic creation
- Trigger system for automatic notifications
- Full TypeScript type safety

## Quick Verification Steps

### 1. Database Setup (5 minutes)

1. Open your Supabase Dashboard
2. Navigate to SQL Editor
3. Open `migrations/create_notifications_system.sql`
4. Copy and execute the entire file
5. Verify tables created:
   - `notifications` (stores notification records)
   - `notification_preferences` (stores user settings)

### 2. View the UI (Immediate)

1. Start the dev server: `npm run dev`
2. Log in to the application
3. Look at the top-right corner of the Header
4. You should see a bell icon
5. Click it - dropdown will show "No notifications yet" (expected for new system)

### 3. Create Test Notification (2 minutes)

Run this SQL in Supabase SQL Editor (replace `YOUR_USER_ID` with your actual user ID from the `users` table):

```sql
INSERT INTO notifications (user_id, type, title, message, action_url, priority, read)
VALUES
  ('YOUR_USER_ID', 'deadline', 'Test Notification', 'This is a test deadline notification', '/dashboard', 'high', false);
```

Refresh the app - you should now see:
- Red badge with "1" on the bell icon
- The test notification in the dropdown
- Click notification to mark as read
- Badge should disappear

### 4. Test All Features

**Mark as Read:**
- Click on a notification - it should turn gray and lose the "New" badge
- Badge count should decrease

**Mark All as Read:**
- Create multiple notifications (repeat step 3 with different titles)
- Click "Mark all read" button in dropdown
- All notifications should become read, badge should clear

**Delete Notification:**
- Hover over a notification
- Click the X button on the right
- Notification should disappear instantly

## File Locations

### Database
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\migrations\create_notifications_system.sql`

### Types
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\types\notifications.ts`
- Exported from: `src\types\index.ts`

### API Routes
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\app\api\notifications\route.ts`
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\app\api\notifications\create\route.ts`
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\app\api\notifications\mark-all-read\route.ts`

### React Hook
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\hooks\useNotifications.ts`

### UI Components
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\components\notifications\NotificationCenter.tsx`
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\components\notifications\NotificationItem.tsx`

### Notification Service
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\lib\notifications\notificationService.ts`
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\lib\notifications\notificationTriggers.ts`

### Modified Files
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\components\layout\Header.tsx` (integrated NotificationCenter)
- `C:\Users\jloui\OneDrive\Documents\gt-planner-notifications\src\types\index.ts` (added notification exports)

## Next Steps

### Activate Automatic Notifications

To make the system create notifications automatically, add trigger calls to your components:

**1. Dashboard - Check deadlines on load:**

Edit `src/app/dashboard/page.tsx`:

```typescript
import { checkDeadlinesAndNotify } from '@/lib/notifications';
import { useAuth } from '@/providers/AuthProvider'; // or your auth hook

// Inside component:
const { user } = useAuth();
const deadlines = useDeadlines(); // your existing deadline hook

useEffect(() => {
  if (user?.id && deadlines) {
    checkDeadlinesAndNotify(user.id, deadlines);
  }
}, [user, deadlines]);
```

**2. Course Completion - Notify when marking course complete:**

Find your course completion handler (likely in `usePlannerStore.ts` or a completion component):

```typescript
import { notifyOnCourseCompletion } from '@/lib/notifications';

// In your completion handler:
const handleMarkComplete = async (courseId, semesterId, status, grade) => {
  // Your existing logic...
  updateCourseStatus(courseId, semesterId, status, grade);

  // Add notification:
  if (status === 'completed' && user?.id) {
    const course = getCourseById(courseId);
    await notifyOnCourseCompletion(user.id, {
      id: course.id,
      code: course.code,
      title: course.title
    });
  }
};
```

**3. Requirements - Check progress periodically:**

Edit your requirements dashboard component:

```typescript
import { checkRequirementsAndNotify } from '@/lib/notifications';

// Inside component:
useEffect(() => {
  if (user?.id && requirements) {
    // Extract requirements into format expected by trigger
    const requirementProgress = requirements.map(req => ({
      category: req.category,
      name: req.name,
      progress: req.progress_percentage || 0
    }));

    checkRequirementsAndNotify(user.id, requirementProgress);
  }
}, [user, requirements]);
```

## API Testing

Test API endpoints directly:

**Get Notifications:**
```bash
curl http://localhost:3000/api/notifications \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

**Mark as Read:**
```bash
curl -X PATCH http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{"id":"NOTIFICATION_ID","read":true}'
```

**Create Notification:**
```bash
curl -X POST http://localhost:3000/api/notifications/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "user_id":"USER_ID",
    "type":"system",
    "title":"Test",
    "message":"Test notification",
    "priority":"low"
  }'
```

## Troubleshooting

**Bell icon not showing:**
- Check Header component imported NotificationCenter correctly
- Verify no console errors related to hooks or components

**Notifications not appearing in dropdown:**
- Verify database migration ran successfully
- Check user_id matches between users table and notifications
- Open browser DevTools → Network tab → Look for /api/notifications calls
- Check for 401 (auth) or 500 (server) errors

**Badge count wrong:**
- Notifications are polled every 30 seconds
- Click bell icon to force immediate refresh
- Check for duplicate notifications in database

**TypeScript errors:**
- All types are defined in `src/types/notifications.ts`
- Imported centrally from `src/types/index.ts`
- Run `npm run build` to verify no type errors

## Features

- Real-time polling (30 second interval)
- Optimistic UI updates
- Unread badge counter
- Color-coded priorities (low/medium/high)
- Type-specific icons (deadline, course, GPA, advisor, requirement, system)
- Time ago formatting ("2 hours ago")
- Click to navigate to relevant page
- Mark individual as read
- Mark all as read
- Delete notifications
- Empty state when no notifications
- Loading state with spinner
- Error state with retry
- FERPA-compliant (RLS enforced)
- Automatic expiration after 90 days

## System Architecture

**Polling Approach:**
The system uses React Query's `refetchInterval` (30 seconds) instead of WebSockets for simplicity and reliability. This is suitable for most use cases and reduces complexity.

**State Management:**
Uses React Query for server state (notifications from API) with optimistic updates for instant UI feedback.

**Security:**
All API routes authenticate via Supabase server-side auth. RLS policies ensure users can only access their own notifications.

**Performance:**
- Indexed database queries
- React Query caching
- Optimistic updates
- Pagination support (50 notifications per request)

## Support

For detailed implementation guide, see:
- `NOTIFICATION_SYSTEM_IMPLEMENTATION.md` - Full technical documentation

For project patterns, see:
- `CLAUDE.md` - Overall project structure and conventions

The notification system follows all existing project patterns for consistency.
