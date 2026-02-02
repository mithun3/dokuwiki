import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content');

/**
 * Metadata extracted from MDX file frontmatter
 * @interface ContentMeta
 * @property {string} title - Page title
 * @property {string} [description] - Short description for meta tags
 * @property {string} [evolutionPhase] - Article lifecycle phase (foundational/refined/experimental/archived)
 * @property {string} [lastReviewedAt] - ISO date when content was last reviewed
 * @property {string} [status] - Content status (active/deprecated/draft)
 * @property {any} [key: string] - Additional custom frontmatter fields
 */
export interface ContentMeta {
  title: string;
  description?: string;
  evolutionPhase?: 'foundational' | 'refined' | 'experimental' | 'archived';
  lastReviewedAt?: string;
  status?: 'active' | 'deprecated' | 'draft';
  [key: string]: any;
}

/**
 * Complete content data with parsed metadata and rendered content
 * @interface ContentData
 * @property {string} slug - URL path to the content (e.g., "recording/techniques" or "home")
 * @property {ContentMeta} meta - Parsed frontmatter metadata
 * @property {string} content - Markdown/MDX content without frontmatter
 */
export interface ContentData {
  slug: string;
  meta: ContentMeta;
  content: string;
}

/**
 * Retrieves and parses a single content file by slug
 * 
 * @function getContentBySlug
 * @param {string[]} slug - URL slug as array segments (e.g., ["recording", "techniques"])
 * @returns {ContentData | null} Parsed content with metadata, or null if file not found
 * 
 * @example
 * // Get home page
 * const home = getContentBySlug(['home']);
 * // Get nested page
 * const techniques = getContentBySlug(['recording', 'techniques']);
 * // Result: { slug: 'recording/techniques', meta: {...}, content: '# Techniques' }
 * 
 * @throws {Error} Logs error to console but returns null instead of throwing
 */
export function getContentBySlug(slug: string[]): ContentData | null {
  try {
    const slugPath = slug.join('/');
    let filePath = path.join(contentDirectory, `${slugPath}.mdx`);
    
    // Check for direct file first (e.g., equipment.mdx)
    if (!fs.existsSync(filePath)) {
      // Fallback to index.mdx in folder (e.g., equipment/index.mdx)
      filePath = path.join(contentDirectory, slugPath, 'index.mdx');
    }
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug: slugPath,
      meta: data as ContentMeta,
      content,
    };
  } catch (error) {
    console.error(`Error loading content for slug: ${slug.join('/')}`, error);
    return null;
  }
}

/**
 * Recursively discovers all content files in the content directory
 * 
 * @function getAllContentSlugs
 * @returns {string[][]} Array of slug arrays (each slug is a string array representing the path)
 * 
 * @example
 * // Returns something like:
 * // [
 * //   ['home'],
 * //   ['about'],
 * //   ['recording', 'techniques'],
 * //   ['recording', 'best-practices'],
 * //   ['sounds', 'index'],
 * // ]
 * 
 * @description
 * Used by Next.js generateStaticParams() to pre-render all content pages.
 * Automatically discovers nested content in subdirectories.
 */
export function getAllContentSlugs(): string[][] {
  const slugs: string[][] = [];

  function traverseDirectory(dir: string, basePath: string[] = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        traverseDirectory(filePath, [...basePath, file]);
      } else if (file.endsWith('.mdx')) {
        const slug = [...basePath, file.replace(/\.mdx$/, '')];
        slugs.push(slug);
      }
    }
  }

  if (fs.existsSync(contentDirectory)) {
    traverseDirectory(contentDirectory);
  }

  return slugs;
}
