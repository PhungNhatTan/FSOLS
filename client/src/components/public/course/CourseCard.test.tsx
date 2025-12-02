import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CourseCard, { buildCourseUrl } from './CourseCard';
import type { CourseCard as CourseCardType } from '../../../pages/HomePage';

const mockCourse: CourseCardType = {
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
};

const mockCourseHighRating: CourseCardType = {
  ...mockCourse,
  id: 2,
  title: 'Advanced React',
  rating: 5,
  ratingCount: 250,
};

const mockCourseNoRating: CourseCardType = {
  ...mockCourse,
  id: 4,
  title: 'New Course',
  rating: 0,
  ratingCount: 0,
};

describe('CourseCard Component', () => {
  describe('Rendering', () => {
    it('should render course card with all elements', () => {
      render(<CourseCard course={mockCourse} />);
      
      expect(screen.getByAltText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('4.5 (120)')).toBeInTheDocument();
      expect(screen.getByText('10h • 25 lessons')).toBeInTheDocument();
      expect(screen.getByText('View details')).toBeInTheDocument();
      expect(screen.getByText('Wishlist')).toBeInTheDocument();
      expect(screen.getByText('Manage')).toBeInTheDocument();
    });

    it('should have test ID on article element', () => {
      const { container } = render(<CourseCard course={mockCourse} />);
      const article = container.querySelector('[data-testid="course-card"]');
      expect(article).toBeInTheDocument();
    });

    it('should render course thumbnail image', () => {
      render(<CourseCard course={mockCourse} />);
      const image = screen.getByAltText('React Basics');
      expect(image).toHaveAttribute('src', 'https://example.com/react.jpg');
    });

    it('should display correct mentor name', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display duration and lessons info', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText('10h • 25 lessons')).toBeInTheDocument();
    });
  });

  describe('Rating Display', () => {
    it('should display correct stars for full rating', () => {
      const { container } = render(<CourseCard course={mockCourseHighRating} />);
      const stars = container.querySelectorAll('.text-yellow-500 span');
      expect(stars.length).toBe(5);
    });

    it('should display correct stars for half rating', () => {
      const { container } = render(<CourseCard course={mockCourse} />);
      const stars = container.querySelectorAll('.text-yellow-500 span');
      expect(stars.length).toBe(5);
    });

    it('should display rating with count', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText('4.5 (120)')).toBeInTheDocument();
    });

    it('should handle zero rating', () => {
      render(<CourseCard course={mockCourseNoRating} />);
      expect(screen.getByText('0 (0)')).toBeInTheDocument();
    });

    it('should handle perfect rating', () => {
      render(<CourseCard course={mockCourseHighRating} />);
      expect(screen.getByText('5 (250)')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have correct course detail link', () => {
      render(<CourseCard course={mockCourse} />);
      const detailLinks = screen.getAllByText('View details');
      expect(detailLinks[0]).toHaveAttribute('href', '/courses/1');
    });

    it('should have correct manage link', () => {
      render(<CourseCard course={mockCourse} />);
      const manageLink = screen.getByText('Manage');
      expect(manageLink).toHaveAttribute('href', '/courses/1/manage');
    });

    it('should have title as clickable link', () => {
      render(<CourseCard course={mockCourse} />);
      const titleLink = screen.getAllByText('React Basics')[0].closest('a');
      expect(titleLink).toHaveAttribute('href', '/courses/1');
    });

    it('should have image as clickable link', () => {
      render(<CourseCard course={mockCourse} />);
      const image = screen.getByAltText('React Basics');
      const imageLink = image.closest('a');
      expect(imageLink).toHaveAttribute('href', '/courses/1');
    });

    it('should have different URLs for different course IDs', () => {
      const { rerender } = render(<CourseCard course={mockCourse} />);
      let links = screen.getAllByText('View details');
      expect(links[0]).toHaveAttribute('href', '/courses/1');

      rerender(<CourseCard course={mockCourseHighRating} />);
      links = screen.getAllByText('View details');
      expect(links[0]).toHaveAttribute('href', '/courses/2');
    });
  });

  describe('Wishlist Button', () => {
    it('should render wishlist button', () => {
      render(<CourseCard course={mockCourse} />);
      const wishlistBtn = screen.getByText('Wishlist');
      expect(wishlistBtn).toBeInTheDocument();
    });

    it('should call onWishlistClick when button is clicked', () => {
      const mockWishlistClick = vi.fn();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<CourseCard course={mockCourse} onWishlistClick={mockWishlistClick} />);
      
      const wishlistBtn = screen.getByText('Wishlist');
      fireEvent.click(wishlistBtn);
      
      expect(mockWishlistClick).toHaveBeenCalledWith(mockCourse);
      expect(mockWishlistClick).toHaveBeenCalledTimes(1);
      alertSpy.mockRestore();
    });

    it('should show alert with course title', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<CourseCard course={mockCourse} />);
      
      const wishlistBtn = screen.getByText('Wishlist');
      fireEvent.click(wishlistBtn);
      
      expect(alertSpy).toHaveBeenCalledWith('(demo) Added to wishlist: React Basics');
      alertSpy.mockRestore();
    });

    it('should handle wishlist click without callback', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<CourseCard course={mockCourse} />);
      
      const wishlistBtn = screen.getByText('Wishlist');
      fireEvent.click(wishlistBtn);
      
      expect(alertSpy).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should pass correct course data to callback', () => {
      const mockWishlistClick = vi.fn();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<CourseCard course={mockCourseHighRating} onWishlistClick={mockWishlistClick} />);
      
      const wishlistBtn = screen.getByText('Wishlist');
      fireEvent.click(wishlistBtn);
      
      expect(mockWishlistClick).toHaveBeenCalledWith(mockCourseHighRating);
      alertSpy.mockRestore();
    });
  });

  describe('Styling', () => {
    it('should have rounded and border styles', () => {
      const { container } = render(<CourseCard course={mockCourse} />);
      const article = container.querySelector('[data-testid="course-card"]');
      
      expect(article).toHaveClass('rounded-2xl');
      expect(article).toHaveClass('border');
      expect(article).toHaveClass('border-slate-200');
    });

    it('should have hover effect', () => {
      const { container } = render(<CourseCard course={mockCourse} />);
      const article = container.querySelector('[data-testid="course-card"]');
      
      expect(article).toHaveClass('hover:shadow-md');
      expect(article).toHaveClass('transition');
    });

    it('should have correct background color', () => {
      const { container } = render(<CourseCard course={mockCourse} />);
      const article = container.querySelector('[data-testid="course-card"]');
      
      expect(article).toHaveClass('bg-white');
    });
  });

  describe('Text Overflow', () => {
    it('should clamp title to 2 lines', () => {
      const { container } = render(<CourseCard course={mockCourse} />);
      const title = container.querySelector('.line-clamp-2');
      expect(title).toBeInTheDocument();
    });

    it('should handle long course titles', () => {
      const longTitleCourse: CourseCardType = {
        ...mockCourse,
        title: 'This is a very long course title that might wrap to multiple lines and should be clamped',
      };
      render(<CourseCard course={longTitleCourse} />);
      expect(screen.getByText(longTitleCourse.title)).toBeInTheDocument();
    });
  });
});

describe('buildCourseUrl Function', () => {
  it('should build correct course URL', () => {
    expect(buildCourseUrl({ id: 1, slug: 'react-basics' })).toBe('/courses/1');
    expect(buildCourseUrl({ id: 2, slug: 'vue-guide' })).toBe('/courses/2');
  });

  it('should use course ID not slug', () => {
    expect(buildCourseUrl({ id: 123, slug: 'some-course' })).toBe('/courses/123');
  });

  it('should handle different course IDs', () => {
    for (let i = 1; i <= 5; i++) {
      expect(buildCourseUrl({ id: i, slug: `course-${i}` })).toBe(`/courses/${i}`);
    }
  });

  it('should return string starting with /courses/', () => {
    const url = buildCourseUrl({ id: 10, slug: 'test' });
    expect(url).toMatch(/^\/courses\/\d+$/);
  });
});
