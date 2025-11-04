# Notification System SQL Fixes

## Problem

The original migration file had a type mismatch error:

```
ERROR:  42804: foreign key constraint "notifications_user_id_fkey" cannot be implemented
DETAIL:  Key columns "user_id" and "id" are of incompatible types: uuid and bigint.
```

This occurred because the `users` table in Supabase uses `BIGINT` for the `id` column, but the migration was using `UUID` for the `user_id` foreign key.

## Solution

### 1. Database Schema Changes

**File:** `migrations/create_notifications_system.sql`

Changed `user_id` from `UUID` to `BIGINT` in both tables:

```sql
-- notifications table
user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE

-- notification_preferences table
user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE
```

### 2. RLS Policy Updates

Updated Row Level Security policies to properly join with the `users` table since we need to compare:
- `auth.uid()` (returns UUID from auth.users)
- `users.auth_id` (UUID column in users table)
- `user_id` (BIGINT reference to users.id)

**Before:**
```sql
USING (auth.uid() = user_id)
```

**After:**
```sql
USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id))
```

This pattern was applied to all RLS policies in both tables:
- `notifications` table: SELECT, UPDATE, DELETE policies
- `notification_preferences` table: ALL policy

### 3. TypeScript Type Updates

**File:** `src/types/notifications.ts`

Changed `user_id` from `string` to `number` to match the database `BIGINT` type:

```typescript
export interface Notification {
  id: string;
  user_id: number;  // Changed from string
  // ... rest of fields
}

export interface NotificationPreferences {
  id: string;
  user_id: number;  // Changed from string
  // ... rest of fields
}

export interface CreateNotificationRequest {
  user_id: number;  // Changed from string
  // ... rest of fields
}
```

### 4. Service Function Updates

**File:** `src/lib/notifications/notificationService.ts`

Updated all notification service functions to use `userId: number` instead of `userId: string`:

- `createDeadlineNotification(userId: number, ...)`
- `createRequirementNotification(userId: number, ...)`
- `createCourseNotification(userId: number, ...)`
- `createGpaNotification(userId: number, ...)`
- `createAdvisorNotification(userId: number, ...)`
- `createSystemNotification(userId: number, ...)`

## Verification

All TypeScript files compile successfully with these changes. The migration file is now ready to be executed on Supabase.

## Next Steps

1. **Run the migration:**
   - Open Supabase Dashboard → SQL Editor
   - Copy and paste the entire contents of `migrations/create_notifications_system.sql`
   - Execute the migration

2. **Test the system:**
   - Start dev server: `npm run dev`
   - Check the bell icon in the header
   - Create a test notification to verify the system works

3. **API Integration:**
   - When calling notification APIs from server-side code, use the numeric user ID from the `users` table
   - The RLS policies will automatically handle authentication via the `auth_id` join

## Files Modified

- ✅ `migrations/create_notifications_system.sql` - Fixed user_id type and RLS policies
- ✅ `src/types/notifications.ts` - Updated user_id to number
- ✅ `src/lib/notifications/notificationService.ts` - Updated function signatures

## Database Schema Alignment

The notification system now correctly aligns with the existing GT Course Planner database schema:

| Table | Column | Type | Reference |
|-------|--------|------|-----------|
| users | id | BIGINT | Primary key |
| users | auth_id | UUID | References auth.users |
| notifications | user_id | BIGINT | References users(id) |
| notification_preferences | user_id | BIGINT | References users(id) |

RLS policies use `auth.uid()` to compare with `users.auth_id`, ensuring proper user isolation.
