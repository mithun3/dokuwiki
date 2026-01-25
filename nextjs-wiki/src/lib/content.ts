import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content');

export interface ContentMeta {
  title: string;
  description?: string;
  [key: string]: any;
}

export interface ContentData {
  slug: string;
  meta: ContentMeta;
  content: string;
}

export function getContentBySlug(slug: string[]): ContentData | null {
  try {
    const slugPath = slug.join('/');
    const filePath = path.join(contentDirectory, `${slugPath}.mdx`);
    
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
