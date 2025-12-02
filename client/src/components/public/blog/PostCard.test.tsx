import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostCard, { buildBlogUrl } from './PostCard';
import type { Post } from '../../../api/post';

const mockPost: Post = {
  id: 1,
  title: 'React Tips',
  slug: 'react-tips',
  cover: 'https://example.com/post.jpg',
  createdAt: '2025-01-15',
};

const mockPostOldDate: Post = {
  ...mockPost,
  id: 2,
  title: 'Vue Guide',
  slug: 'vue-guide',
  createdAt: '2024-06-20',
};

const mockPostLongTitle: Post = {
  ...mockPost,
  id: 3,
  title: 'This is a very long post title that might span multiple lines and should be properly displayed in the card',
  slug: 'long-title',
};

const mockPostRecentDate: Post = {
  ...mockPost,
  id: 4,
  title: 'Latest Post',
  slug: 'latest-post',
  createdAt: '2025-12-02',
};

describe('PostCard Component', () => {
  describe('Rendering', () => {
    it('should render post card with all elements', () => {
      render(<PostCard post={mockPost} />);

      expect(screen.getByAltText('React Tips')).toBeInTheDocument();
      expect(screen.getByText('React Tips')).toBeInTheDocument();
      expect(screen.getByText('15/01/2025')).toBeInTheDocument();
    });

    it('should render post cover image', () => {
      render(<PostCard post={mockPost} />);
      const image = screen.getByAltText('React Tips');
      expect(image).toHaveAttribute('src', 'https://example.com/post.jpg');
    });

    it('should display post title', () => {
      render(<PostCard post={mockPost} />);
      expect(screen.getByText('React Tips')).toBeInTheDocument();
    });

    it('should display formatted date', () => {
      render(<PostCard post={mockPost} />);
      const dateElement = screen.getByText('15/01/2025');
      expect(dateElement).toBeInTheDocument();
    });

    it('should handle long post titles', () => {
      render(<PostCard post={mockPostLongTitle} />);
      expect(screen.getByText(mockPostLongTitle.title)).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format date in en-GB locale', () => {
      render(<PostCard post={mockPost} />);
      expect(screen.getByText('15/01/2025')).toBeInTheDocument();
    });

    it('should format different dates correctly', () => {
      render(<PostCard post={mockPostOldDate} />);
      expect(screen.getByText('20/06/2024')).toBeInTheDocument();
    });

    it('should format recent dates correctly', () => {
      render(<PostCard post={mockPostRecentDate} />);
      expect(screen.getByText('02/12/2025')).toBeInTheDocument();
    });

    it('should parse ISO date string correctly', () => {
      const postWithISODate: Post = {
        ...mockPost,
        createdAt: '2025-03-10',
      };
      render(<PostCard post={postWithISODate} />);
      expect(screen.getByText('10/03/2025')).toBeInTheDocument();
    });

    it('should handle date string conversion properly', () => {
      render(<PostCard post={mockPost} />);
      const dateText = screen.getByText('15/01/2025');
      expect(dateText).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have correct blog post link', () => {
      render(<PostCard post={mockPost} />);
      const postLinks = screen.getAllByText('React Tips');
      const linkElement = postLinks[0].closest('a');
      expect(linkElement).toHaveAttribute('href', '/blog/react-tips');
    });

    it('should have image as clickable link', () => {
      render(<PostCard post={mockPost} />);
      const image = screen.getByAltText('React Tips');
      const imageLink = image.closest('a');
      expect(imageLink).toHaveAttribute('href', '/blog/react-tips');
    });

    it('should have title as clickable link', () => {
      render(<PostCard post={mockPost} />);
      const titleLinks = screen.getAllByText('React Tips');
      const titleLink = titleLinks[0].closest('a');
      expect(titleLink).toHaveAttribute('href', '/blog/react-tips');
    });

    it('should have different URLs for different posts', () => {
      const { rerender } = render(<PostCard post={mockPost} />);
      let titleLinks = screen.getAllByText('React Tips');
      expect(titleLinks[0].closest('a')).toHaveAttribute('href', '/blog/react-tips');

      rerender(<PostCard post={mockPostOldDate} />);
      titleLinks = screen.getAllByText('Vue Guide');
      expect(titleLinks[0].closest('a')).toHaveAttribute('href', '/blog/vue-guide');
    });

    it('should have image and title linking to same URL', () => {
      render(<PostCard post={mockPost} />);
      const image = screen.getByAltText('React Tips');
      const imageLink = image.closest('a');
      const titleLinks = screen.getAllByText('React Tips');
      const titleLink = titleLinks[0].closest('a');

      expect(imageLink?.getAttribute('href')).toBe(titleLink?.getAttribute('href'));
    });
  });

  describe('Styling', () => {
    it('should have rounded and border styles', () => {
      const { container } = render(<PostCard post={mockPost} />);
      const article = container.querySelector('article');

      expect(article).toHaveClass('rounded-2xl');
      expect(article).toHaveClass('border');
      expect(article).toHaveClass('border-slate-200');
    });

    it('should have hover effect', () => {
      const { container } = render(<PostCard post={mockPost} />);
      const article = container.querySelector('article');

      expect(article).toHaveClass('hover:shadow-md');
      expect(article).toHaveClass('transition');
    });

    it('should have correct background color', () => {
      const { container } = render(<PostCard post={mockPost} />);
      const article = container.querySelector('article');

      expect(article).toHaveClass('bg-white');
    });

    it('should have overflow hidden', () => {
      const { container } = render(<PostCard post={mockPost} />);
      const article = container.querySelector('article');

      expect(article).toHaveClass('overflow-hidden');
    });
  });

  describe('Text Overflow', () => {
    it('should clamp title to 2 lines', () => {
      const { container } = render(<PostCard post={mockPost} />);
      const title = container.querySelector('.line-clamp-2');
      expect(title).toBeInTheDocument();
    });

    it('should handle very long post titles', () => {
      const veryLongTitlePost: Post = {
        ...mockPost,
        title: 'A Very Long Post Title That Definitely Spans Multiple Lines And Should Be Properly Clamped To Prevent Layout Issues In The Card Component',
      };
      render(<PostCard post={veryLongTitlePost} />);
      expect(screen.getByText(veryLongTitlePost.title)).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('should render cover image with correct alt text', () => {
      render(<PostCard post={mockPost} />);
      const image = screen.getByAltText('React Tips');
      expect(image).toBeInTheDocument();
    });

    it('should have correct image source', () => {
      render(<PostCard post={mockPost} />);
      const image = screen.getByAltText('React Tips');
      expect(image).toHaveAttribute('src', 'https://example.com/post.jpg');
    });

    it('should use post title as image alt text', () => {
      render(<PostCard post={mockPostOldDate} />);
      expect(screen.getByAltText('Vue Guide')).toBeInTheDocument();
    });

    it('should have image with proper dimensions', () => {
      const { container } = render(<PostCard post={mockPost} />);
      const image = container.querySelector('img');
      expect(image).toHaveClass('h-40');
      expect(image).toHaveClass('w-full');
      expect(image).toHaveClass('object-cover');
    });
  });
});

describe('buildBlogUrl Function', () => {
  it('should build correct blog post URL', () => {
    expect(buildBlogUrl('react-tips')).toBe('/blog/react-tips');
    expect(buildBlogUrl('vue-guide')).toBe('/blog/vue-guide');
  });

  it('should handle different slugs', () => {
    expect(buildBlogUrl('post-1')).toBe('/blog/post-1');
    expect(buildBlogUrl('python-tutorial')).toBe('/blog/python-tutorial');
    expect(buildBlogUrl('typescript-advanced')).toBe('/blog/typescript-advanced');
  });

  it('should preserve hyphens in slug', () => {
    expect(buildBlogUrl('web-development-tips')).toBe('/blog/web-development-tips');
  });

  it('should handle single word slugs', () => {
    expect(buildBlogUrl('tips')).toBe('/blog/tips');
    expect(buildBlogUrl('tutorial')).toBe('/blog/tutorial');
  });

  it('should handle numeric slugs', () => {
    expect(buildBlogUrl('2025-review')).toBe('/blog/2025-review');
  });

  it('should return string starting with /blog/', () => {
    const urls = ['react-tips', 'vue-guide', 'angular-basics'].map(buildBlogUrl);
    urls.forEach(url => {
      expect(url).toMatch(/^\/blog\//);
    });
  });

  it('should not double encode URL', () => {
    expect(buildBlogUrl('post-title')).toBe('/blog/post-title');
  });

  it('should handle special characters in slug', () => {
    expect(buildBlogUrl('c++-guide')).toBe('/blog/c++-guide');
  });
});
