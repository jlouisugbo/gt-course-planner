# Testing Infrastructure Setup Guide

## Overview

This document provides instructions for setting up and using the testing infrastructure for GT Course Planner.

## Installation

### 1. Install Testing Dependencies

```bash
npm install --save-dev \
  jest@latest \
  @testing-library/react@latest \
  @testing-library/jest-dom@latest \
  @testing-library/user-event@latest \
  jest-environment-jsdom@latest \
  @types/jest@latest
```

### 2. Verify Configuration

The following files have been created:
- `jest.config.ts` - Jest configuration for Next.js 15
- `jest.setup.ts` - Global test setup and mocks
- `__tests__/` - Directory structure for tests

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test path/to/test.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="API route"
```

### Test Scripts (Add to package.json)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

## Writing Tests

### Test File Structure

Tests should be placed in one of these locations:
1. `__tests__/` directory at the root
2. `src/**/__tests__/` directories next to source files
3. `*.test.ts` or `*.spec.ts` files next to source files

### Example: API Route Test

```typescript
// __tests__/api/user-profile.test.ts
import { GET, PUT } from '@/app/api/user-profile/route';
import { NextRequest } from 'next/server';

describe('/api/user-profile', () => {
  it('should return 401 if not authenticated', async () => {
    const request = new NextRequest('http://localhost:3000/api/user-profile');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('should return user profile when authenticated', async () => {
    // Mock authentication
    const request = new NextRequest('http://localhost:3000/api/user-profile');
    // Add auth header
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
```

### Example: Hook Test

```typescript
// __tests__/hooks/usePlannerStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePlannerStore } from '@/hooks/usePlannerStore';

describe('usePlannerStore', () => {
  it('should add course to semester', () => {
    const { result } = renderHook(() => usePlannerStore());

    act(() => {
      result.current.addCourseToSemester({
        id: 1,
        code: 'CS 1301',
        title: 'Intro to Computing',
        credits: 3,
        semesterId: 202400,
        status: 'planned',
      });
    });

    const semesters = result.current.semesters;
    expect(semesters[202400]?.courses).toHaveLength(1);
  });
});
```

### Example: Component Test

```typescript
// __tests__/components/CourseCard.test.tsx
import { render, screen } from '@testing-library/react';
import { CourseCard } from '@/components/courses/CourseCard';

describe('CourseCard', () => {
  const mockCourse = {
    id: 1,
    code: 'CS 1301',
    title: 'Intro to Computing',
    credits: 3,
  };

  it('should render course information', () => {
    render(<CourseCard course={mockCourse} onRemove={() => {}} />);

    expect(screen.getByText('CS 1301')).toBeInTheDocument();
    expect(screen.getByText('Intro to Computing')).toBeInTheDocument();
    expect(screen.getByText('3 credits')).toBeInTheDocument();
  });
});
```

### Example: Type Transformation Test

```typescript
// __tests__/lib/types/transforms.test.ts
import { fromDBCourse, toDBCourse } from '@/lib/types/transforms';
import type { DBCourseResponse } from '@/types/api-responses';

describe('Type Transformations', () => {
  it('should transform DB course to app course', () => {
    const dbCourse: DBCourseResponse = {
      id: 1,
      code: 'CS 1301',
      title: 'Intro to Computing',
      credits: 3,
      college_id: 1,
      is_active: true,
    };

    const appCourse = fromDBCourse(dbCourse);

    expect(appCourse.collegeId).toBe(1); // snake_case → camelCase
    expect(appCourse.isActive).toBe(true);
  });
});
```

## Test Utilities

### Mock Data

Create mock data in `__tests__/fixtures/`:

```typescript
// __tests__/fixtures/courses.ts
export const mockCourse = {
  id: 1,
  code: 'CS 1301',
  title: 'Intro to Computing',
  credits: 3,
  description: 'Introduction to computing...',
};

export const mockCourses = [mockCourse, /* ... */];
```

### Custom Render Function

```typescript
// __tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
    options
  );
}

export * from '@testing-library/react';
```

## Coverage Goals

Based on the P0 fixes summary, aim for these coverage targets:

- **API Routes**: 80%+ (authentication, validation, error handling)
- **Hooks**: 70%+ (state management, side effects)
- **Utilities**: 90%+ (pure functions, transformations)
- **Components**: 60%+ (user interactions, rendering)

## Continuous Integration

### GitHub Actions Workflow (example)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Test what users see and do
   - Avoid testing internal state directly

2. **Use Descriptive Test Names**
   - Use `it('should ...')` format
   - Make test failures self-explanatory

3. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should add course to semester', () => {
     // Arrange: Set up test data
     const course = { /* ... */ };

     // Act: Perform the action
     addCourse(course);

     // Assert: Verify the result
     expect(getSemester(202400).courses).toContain(course);
   });
   ```

4. **Isolate Tests**
   - Each test should be independent
   - Use `beforeEach`/`afterEach` for setup/cleanup

5. **Mock External Dependencies**
   - Mock API calls, Supabase, etc.
   - Use MSW for HTTP mocking

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module '@/...'`
**Solution**: Check `moduleNameMapper` in `jest.config.ts`

**Issue**: `ReferenceError: fetch is not defined`
**Solution**: Add `global.fetch = jest.fn()` in `jest.setup.ts`

**Issue**: Tests timeout
**Solution**: Increase `testTimeout` in `jest.config.ts`

**Issue**: Async state updates warning
**Solution**: Wrap state updates in `act()`

## Next Steps

1. Install dependencies
2. Add test scripts to package.json
3. Write first tests for critical paths
4. Set up CI/CD integration
5. Gradually increase coverage

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
