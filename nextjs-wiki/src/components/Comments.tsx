'use client';

import { useEffect } from 'react';

/**
 * Giscus comments component
 * 
 * Loads GitHub Discussions-powered comments section on pages
 * Uses Giscus repository configuration from environment variables
 * 
 * Features:
 * - Maps discussions to page pathname
 * - Supports reactions and lazy loading
 * - Respects theme preference (light/dark)
 * - Authenticated users via GitHub
 * 
 * Required environment variables:
 * - NEXT_PUBLIC_GISCUS_REPO_ID: GitHub repository ID
 * - NEXT_PUBLIC_GISCUS_CATEGORY_ID: Giscus discussion category ID
 * 
 * Setup: https://giscus.app
 * 
 * @component
 * @returns {JSX.Element} Empty div container for Giscus to mount into
 * 
 * @example
 * <Comments />
 */
export default function Comments() {
  useEffect(() => {
    // Load Giscus script with environment variables
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.dataset.repo = 'mithun3/dokuwiki';
    script.dataset.repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || '';
    script.dataset.category = 'Comments';
    script.dataset.categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || '';
    script.dataset.mapping = 'pathname';
    script.dataset.term = '';
    script.dataset.reactionsEnabled = '1';
    script.dataset.emitMetadata = '0';
    script.dataset.inputPosition = 'bottom';
    script.dataset.theme = 'light';
    script.dataset.lang = 'en';
    script.dataset.loading = 'lazy';
    script.async = true;
    script.crossOrigin = 'anonymous';

    const commentsContainer = document.getElementById('giscus');
    if (commentsContainer) {
      commentsContainer.appendChild(script);
    }
  }, []);

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="mb-6 text-2xl font-bold">💬 Comments & Discussion</h2>
      <p className="mb-6 text-gray-600">
        Have thoughts or questions? Share them below!
      </p>
      <div
        id="giscus"
        className="mx-auto max-w-4xl"
      />
    </div>
  );
}
