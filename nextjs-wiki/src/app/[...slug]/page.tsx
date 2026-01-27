import { MDXRemote } from 'next-mdx-remote/rsc';
import { getContentBySlug, getAllContentSlugs } from '@/lib/content';
import { notFound } from 'next/navigation';
import remarkGfm from 'remark-gfm';
import { MediaGallery } from '@/components/MediaPlayer/MediaGallery';
import Comments from '@/components/Comments';
import ArticleFooter from '@/components/ArticleFooter';
import { ContentErrorBoundary } from '@/components/ContentErrorBoundary';

const mdxComponents = {
  MediaGallery,
};

export async function generateStaticParams() {
  const slugs = getAllContentSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string[] } }) {
  const content = getContentBySlug(params.slug);
  
  if (!content) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: content.meta.title,
    description: content.meta.description,
  };
}

export default function ContentPage({ params }: { params: { slug: string[] } }) {
  const content = getContentBySlug(params.slug);

  if (!content) {
    notFound();
  }

  return (
    <ContentErrorBoundary pagePath={params.slug.join('/')}>
      <article className="wiki-content">
        <MDXRemote
          source={content.content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],

            },
          }}
        />
        <ArticleFooter metadata={content.meta} />
        <Comments />
      </article>
    </ContentErrorBoundary>
  );
}
