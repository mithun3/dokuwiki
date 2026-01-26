'use client';

import { useEffect } from 'react';

export default function Comments() {
  useEffect(() => {
    // Load Giscus script
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.dataset.repo = 'mithun3/dokuwiki';
    script.dataset.repoId = 'R_kgDOH1F4rQ'; // You'll need to update this with actual repo ID
    script.dataset.category = 'Comments';
    script.dataset.categoryId = 'DIC_kwDOH1F4rc4CfQ1l'; // You'll need to update this with actual category ID
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
        Have thoughts or questions about this page? Share them below! Comments are powered by GitHub Discussions.
      </p>
      <div
        id="giscus"
        className="mx-auto max-w-4xl"
      />
    </div>
  );
}
