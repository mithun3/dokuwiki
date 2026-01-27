import createMDX from '@next/mdx';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  
  // Redirects for old DokuWiki URL patterns
  async redirects() {
    return [
      // DokuWiki namespace:page format to /namespace/page
      {
        source: '/:namespace\\::page',
        destination: '/:namespace/:page',
        permanent: true,
      },
      // Legacy start page
      {
        source: '/start',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Image optimization for media CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.sysya.com.au',
      },
    ],
  },

  // Output standalone for potential Docker deployment
  output: 'standalone',
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
});

export default withMDX(nextConfig);
