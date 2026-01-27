import { describe, it, expect } from 'vitest';
import { getContentBySlug, getAllContentSlugs } from '@/lib/content';

describe('Content Loader', () => {
  describe('getContentBySlug', () => {
    it('should load home page content', () => {
      const content = getContentBySlug(['home']);
      expect(content).not.toBeNull();
      expect(content?.slug).toBe('home');
      expect(content?.meta.title).toBe('home');
      expect(content?.content).toBeTruthy();
    });

    it('should load nested content', () => {
      const content = getContentBySlug(['recording', 'index']);
      expect(content).not.toBeNull();
      expect(content?.slug).toBe('recording/index');
      expect(content?.meta.title).toBe('Recording');
    });

    it('should return null for non-existent content', () => {
      const content = getContentBySlug(['non', 'existent', 'page']);
      expect(content).toBeNull();
    });

    it('should parse frontmatter metadata', () => {
      const content = getContentBySlug(['home']);
      expect(content?.meta.title).toBeDefined();
      expect(content?.meta.evolutionPhase).toBeDefined();
      expect(content?.meta.status).toBeDefined();
    });

    it('should extract evolution phase metadata', () => {
      const content = getContentBySlug(['recording', 'index']);
      expect(content?.meta.evolutionPhase).toBeDefined();
      expect(['foundational', 'refined', 'experimental', 'archived']).toContain(
        content?.meta.evolutionPhase
      );
    });

    it('should extract last reviewed date', () => {
      const content = getContentBySlug(['recording', 'index']);
      if (content?.meta.lastReviewedAt) {
        // Verify it's a valid date format
        expect(new Date(content.meta.lastReviewedAt).getTime()).not.toBeNaN();
      }
    });

    it('should separate content from frontmatter', () => {
      const content = getContentBySlug(['home']);
      expect(content?.content).toBeTruthy();
      // Content should start with heading, not frontmatter
      expect(content?.content).toMatch(/^\s*#/);
    });
  });

  describe('getAllContentSlugs', () => {
    it('should discover all content pages', () => {
      const slugs = getAllContentSlugs();
      expect(slugs.length).toBeGreaterThan(0);
    });

    it('should include home page', () => {
      const slugs = getAllContentSlugs();
      const homeSlug = slugs.find(s => s.join('/') === 'home');
      expect(homeSlug).toBeDefined();
    });

    it('should include nested pages', () => {
      const slugs = getAllContentSlugs();
      const recordingSlug = slugs.find(s => s.join('/').startsWith('recording/'));
      expect(recordingSlug).toBeDefined();
    });

    it('should return arrays for each slug', () => {
      const slugs = getAllContentSlugs();
      slugs.forEach(slug => {
        expect(Array.isArray(slug)).toBe(true);
        slug.forEach(segment => {
          expect(typeof segment).toBe('string');
        });
      });
    });

    it('should not include .mdx extension in slugs', () => {
      const slugs = getAllContentSlugs();
      slugs.forEach(slug => {
        const joined = slug.join('/');
        expect(joined).not.toContain('.mdx');
      });
    });

    it('should have namespace pages', () => {
      const slugs = getAllContentSlugs();
      const hasRecording = slugs.some(s => s[0] === 'recording');
      const hasSounds = slugs.some(s => s[0] === 'sounds');
      const hasEquipment = slugs.some(s => s[0] === 'equipment');
      expect(hasRecording).toBe(true);
      expect(hasSounds).toBe(true);
      expect(hasEquipment).toBe(true);
    });
  });

  describe('Content Metadata', () => {
    it('should have consistent metadata structure for files with metadata', () => {
      const slugs = getAllContentSlugs();
      const testSlugs = slugs.slice(0, 5); // Test first 5

      testSlugs.forEach(slug => {
        const content = getContentBySlug(slug);
        if (content && content.meta && Object.keys(content.meta).length > 0) {
          expect(content.meta).toHaveProperty('title');
          expect(typeof content.meta.title).toBe('string');
        }
      });
    });
  });
});
