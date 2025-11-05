/**
 * Type Transformation Tests
 * Tests for src/lib/types/transforms.ts
 */

import {
  fromDBCourse,
  toDBCourse,
  fromDBUserProfile,
  toDBUserProfile,
  snakeToCamel,
  camelToSnake,
  deepSnakeToCamel,
  deepCamelToSnake,
} from '@/lib/types/transforms';
import { mockDBCourse, mockCourse } from '@/__tests__/fixtures/courses';
import { mockDBUser, mockUser } from '@/__tests__/fixtures/users';

describe('Type Transformations', () => {
  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(snakeToCamel('snake_case')).toBe('snakeCase');
      expect(snakeToCamel('some_long_name')).toBe('someLongName');
      expect(snakeToCamel('already_camel')).toBe('alreadyCamel');
    });

    it('should handle strings without underscores', () => {
      expect(snakeToCamel('nounderscore')).toBe('nounderscore');
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(camelToSnake('camelCase')).toBe('camel_case');
      expect(camelToSnake('someLongName')).toBe('some_long_name');
      expect(camelToSnake('alreadySnake')).toBe('already_snake');
    });

    it('should handle strings without capitals', () => {
      expect(camelToSnake('nocapitals')).toBe('nocapitals');
    });
  });

  describe('deepSnakeToCamel', () => {
    it('should recursively convert object keys', () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        nested_object: {
          inner_key: 'value',
        },
      };

      const expected = {
        firstName: 'John',
        lastName: 'Doe',
        nestedObject: {
          innerKey: 'value',
        },
      };

      expect(deepSnakeToCamel(input)).toEqual(expected);
    });

    it('should handle arrays', () => {
      const input = [
        { snake_case: 'value1' },
        { snake_case: 'value2' },
      ];

      const expected = [
        { snakeCase: 'value1' },
        { snakeCase: 'value2' },
      ];

      expect(deepSnakeToCamel(input)).toEqual(expected);
    });
  });

  describe('deepCamelToSnake', () => {
    it('should recursively convert object keys', () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        nestedObject: {
          innerKey: 'value',
        },
      };

      const expected = {
        first_name: 'John',
        last_name: 'Doe',
        nested_object: {
          inner_key: 'value',
        },
      };

      expect(deepCamelToSnake(input)).toEqual(expected);
    });
  });

  describe('fromDBCourse', () => {
    it('should transform DB course to app course', () => {
      const result = fromDBCourse(mockDBCourse);

      expect(result.id).toBe(mockDBCourse.id);
      expect(result.code).toBe(mockDBCourse.code);
      expect(result.collegeId).toBe(mockDBCourse.college_id); // snake → camel
      expect(result.isActive).toBe(mockDBCourse.is_active); // snake → camel
      expect(result.courseType).toBe(mockDBCourse.course_type); // snake → camel
    });

    it('should handle null/undefined fields', () => {
      const dbCourse = {
        ...mockDBCourse,
        description: null,
        college_id: null,
      };

      const result = fromDBCourse(dbCourse as any);

      expect(result.description).toBeUndefined();
      expect(result.collegeId).toBeUndefined();
    });
  });

  describe('toDBCourse', () => {
    it('should transform app course to DB course', () => {
      const result = toDBCourse(mockCourse);

      expect(result.code).toBe(mockCourse.code);
      expect(result.college_id).toBe(mockCourse.collegeId); // camel → snake
      expect(result.is_active).toBe(mockCourse.isActive); // camel → snake
      expect(result.course_type).toBe(mockCourse.courseType); // camel → snake
    });
  });

  describe('fromDBUserProfile', () => {
    it('should transform DB user to app user', () => {
      const result = fromDBUserProfile(mockDBUser);

      expect(result.id).toBe(mockDBUser.id);
      expect(result.authId).toBe(mockDBUser.auth_id); // snake → camel
      expect(result.fullName).toBe(mockDBUser.full_name); // snake → camel
      expect(result.gtUsername).toBe(mockDBUser.gt_username); // snake → camel
      expect(result.selectedThreads).toEqual(mockDBUser.selected_threads); // snake → camel
      expect(result.graduationYear).toBe(mockDBUser.graduation_year); // snake → camel
      expect(result.currentGPA).toBe(mockDBUser.current_gpa); // snake → camel
      expect(result.totalCreditsEarned).toBe(mockDBUser.total_credits_earned); // snake → camel
      expect(result.isTransferStudent).toBe(mockDBUser.is_transfer_student); // snake → camel
    });

    it('should handle missing optional fields', () => {
      const minimalUser = {
        id: 1,
        auth_id: 'test-123',
        email: 'test@test.com',
      };

      const result = fromDBUserProfile(minimalUser as any);

      expect(result.id).toBe(1);
      expect(result.authId).toBe('test-123');
      expect(result.fullName).toBeUndefined();
    });
  });

  describe('toDBUserProfile', () => {
    it('should transform app user to DB user', () => {
      const result = toDBUserProfile(mockUser);

      expect(result.auth_id).toBe(mockUser.authId); // camel → snake
      expect(result.full_name).toBe(mockUser.fullName); // camel → snake
      expect(result.gt_username).toBe(mockUser.gtUsername); // camel → snake
      expect(result.selected_threads).toEqual(mockUser.selectedThreads); // camel → snake
      expect(result.graduation_year).toBe(mockUser.graduationYear); // camel → snake
      expect(result.current_gpa).toBe(mockUser.currentGPA); // camel → snake
      expect(result.total_credits_earned).toBe(mockUser.totalCreditsEarned); // camel → snake
      expect(result.is_transfer_student).toBe(mockUser.isTransferStudent); // camel → snake
    });
  });

  describe('Bidirectional Transformation', () => {
    it('should maintain data integrity for courses', () => {
      const dbCourse = mockDBCourse;
      const appCourse = fromDBCourse(dbCourse);
      const backToDb = toDBCourse(appCourse);

      // Key fields should match
      expect(backToDb.code).toBe(dbCourse.code);
      expect(backToDb.credits).toBe(dbCourse.credits);
      expect(backToDb.college_id).toBe(dbCourse.college_id);
      expect(backToDb.is_active).toBe(dbCourse.is_active);
    });

    it('should maintain data integrity for users', () => {
      const dbUser = mockDBUser;
      const appUser = fromDBUserProfile(dbUser);
      const backToDb = toDBUserProfile(appUser);

      // Key fields should match
      expect(backToDb.auth_id).toBe(dbUser.auth_id);
      expect(backToDb.email).toBe(dbUser.email);
      expect(backToDb.full_name).toBe(dbUser.full_name);
      expect(backToDb.graduation_year).toBe(dbUser.graduation_year);
    });
  });
});
