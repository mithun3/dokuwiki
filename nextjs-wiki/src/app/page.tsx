import { MDXRemote } from 'next-mdx-remote/rsc';
import { getContentBySlug } from '@/lib/content';
import { notFound } from 'next/navigation';
import remarkGfm from 'remark-gfm';
import AudioCard from '@/components/MediaPlayer/AudioCard';
import VideoCard from '@/components/MediaPlayer/VideoCard';
import ABComparisonCard from '@/components/MediaPlayer/ABComparisonCard';

const mdxComponents = {
  AudioCard,
  VideoCard,
  ABComparisonCard,
};

export const metadata = {
  title: 'Field Recording Library',
  description: 'Complete guide to field recording, sound design, and audio production',
};

export default function HomePage() {
  const content = getContentBySlug(['home']);
  
  if (!content) {
    notFound();
  }

  return (
    <div className="wiki-content">
      <MDXRemote 
        source={content.content} 
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </div>
  );
}
