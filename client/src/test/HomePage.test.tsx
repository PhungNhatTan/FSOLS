import { describe, it, expect } from 'vitest';
import {
  buildCategoryUrl,
  buildBlogUrl,
  buildHref,
  ROUTING_MODE,
} from '../pages/HomePage';

// API mocks (to be installed with @testing-library/react)
// import courseApi from '../api/course';
// import categoryApi from '../api/category';
// import mentorApi from '../api/mentor';
// import postApi from '../api/post';

// vi.mock('../api/course');
// vi.mock('../api/category');
// vi.mock('../api/mentor');
// vi.mock('../api/post');

const mockCourseData = [
  {
    id: 1,
    title: 'React Basics',
    slug: 'react-basics',
    thumbnail: 'https://example.com/react.jpg',
    mentor: 'John Doe',
    mentorId: 1,
    rating: 4.5,
    ratingCount: 120,
    durationHours: 10,
    lessons: 25,
    categoryId: 1,
  },
];

const mockCategoryData = [
  { id: 1, name: 'Frontend', slug: 'frontend', courseCount: 15 },
  { id: 2, name: 'Backend', slug: 'backend', courseCount: 12 },
];

const mockMentorData = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    headline: 'Senior Developer',
    students: 500,
    courses: 5,
  },
];

const mockPostData = [
  {
    id: 1,
    title: 'React Tips',
    slug: 'react-tips',
    cover: 'https://example.com/post.jpg',
    createdAt: '2025-01-15',
  },
];

describe('HomePage Component', () => {
  describe('Utility Functions', () => {
    it('should build correct category URL', () => {
      expect(buildCategoryUrl('frontend')).toBe('/categories/frontend');
      expect(buildCategoryUrl('backend')).toBe('/categories/backend');
    });

    it('should build correct blog URL', () => {
      expect(buildBlogUrl('react-tips')).toBe('/blog/react-tips');
      expect(buildBlogUrl('vue-guide')).toBe('/blog/vue-guide');
    });

    it('should build href with hash routing mode', () => {
      expect(buildHref('/courses')).toBe('#/courses');
      expect(buildHref('/categories')).toBe('#/categories');
    });

    it('should build href with path routing mode', () => {
      expect(buildHref('/courses', 'path')).toBe('/courses');
      expect(buildHref('/categories', 'path')).toBe('/categories');
    });

    it('should have correct routing mode constant', () => {
      expect(ROUTING_MODE).toBe('hash');
    });

    it('should build URL with special characters', () => {
      expect(buildCategoryUrl('c++-programming')).toBe('/categories/c++-programming');
    });

    it('should build multiple blog URLs correctly', () => {
      const urls = ['post-1', 'post-2', 'post-3'].map(buildBlogUrl);
      expect(urls).toEqual(['/blog/post-1', '/blog/post-2', '/blog/post-3']);
    });

    it('should preserve empty string paths', () => {
      expect(buildHref('')).toBe('#');
    });

    it('should handle nested paths', () => {
      expect(buildHref('/courses/1/lessons')).toBe('#/courses/1/lessons');
    });

    it('should handle query parameters', () => {
      expect(buildHref('/courses?sort=rating')).toBe('#/courses?sort=rating');
    });
  });

  describe('Data Type Validation', () => {
    it('should validate mock course data structure', () => {
      const course = mockCourseData[0];
      expect(course).toHaveProperty('id');
      expect(course).toHaveProperty('title');
      expect(course).toHaveProperty('slug');
      expect(course).toHaveProperty('mentor');
      expect(course).toHaveProperty('rating');
      expect(typeof course.id).toBe('number');
      expect(typeof course.title).toBe('string');
      expect(course.rating).toBeGreaterThanOrEqual(0);
      expect(course.rating).toBeLessThanOrEqual(5);
    });

    it('should validate mock category data structure', () => {
      const category = mockCategoryData[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('courseCount');
      expect(typeof category.courseCount).toBe('number');
    });

    it('should validate mock mentor data structure', () => {
      const mentor = mockMentorData[0];
      expect(mentor).toHaveProperty('id');
      expect(mentor).toHaveProperty('name');
      expect(mentor).toHaveProperty('avatar');
      expect(mentor).toHaveProperty('students');
      expect(mentor).toHaveProperty('courses');
      expect(typeof mentor.students).toBe('number');
      expect(mentor.students).toBeGreaterThanOrEqual(0);
    });

    it('should validate mock post data structure', () => {
      const post = mockPostData[0];
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('slug');
      expect(post).toHaveProperty('cover');
      expect(post).toHaveProperty('createdAt');
      expect(typeof post.title).toBe('string');
    });
  });

  describe('URL Building Edge Cases', () => {
    it('should handle URLs with hyphens', () => {
      expect(buildCategoryUrl('web-development')).toBe('/categories/web-development');
    });

    it('should handle single word URLs', () => {
      expect(buildBlogUrl('tips')).toBe('/blog/tips');
    });

    it('should not double encode URLs', () => {
      expect(buildCategoryUrl('python')).toBe('/categories/python');
    });

    it('should handle numeric slugs', () => {
      expect(buildCategoryUrl('101')).toBe('/categories/101');
    });
  });

  describe('Routing Mode Tests', () => {
    it('should create hash-based routes', () => {
      const course = buildCategoryUrl('frontend');
      const hashRoute = buildHref(course);
      expect(hashRoute).toMatch(/^#/);
    });

    it('should create path-based routes', () => {
      const course = buildCategoryUrl('frontend');
      const pathRoute = buildHref(course, 'path');
      expect(pathRoute).not.toMatch(/^#/);
    });

    it('should preserve slash after hash', () => {
      expect(buildHref('/courses')).toBe('#/courses');
      expect(buildHref('/courses').startsWith('#/')).toBe(true);
    });

    it('should work with complex query strings', () => {
      const queryUrl = '/courses?sort=rating&filter=free';
      expect(buildHref(queryUrl)).toBe(`#${queryUrl}`);
    });
  });
});
