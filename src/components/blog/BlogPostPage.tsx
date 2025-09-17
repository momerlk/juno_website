import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { posts, PostMeta } from '../../blog';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { Calendar, User, Tag } from 'lucide-react';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [postMeta, setPostMeta] = useState<PostMeta | null>(null);
  const [postContent, setPostContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      const meta = posts.find(p => p.slug === slug);
      if (meta) {
        setPostMeta(meta);
        try {
          const response = await fetch(`/blog/posts/${slug}.mdx`);
          if (response.ok) {
            const text = await response.text();
            const contentWithoutMeta = text.split('---').slice(2).join('---');
            setPostContent(contentWithoutMeta);
          } else {
            throw new Error('Post file not found');
          }
        } catch (e) {
          console.error('Error loading post content:', e);
          setPostMeta(null);
        }
      } 
      setIsLoading(false);
    };
    loadPost();
  }, [slug]);

  const markdownComponents = {
    h1: ({...props}) => <h1 className="text-4xl font-bold mb-8 mt-10 text-white" {...props} />,
    h2: ({...props}) => <h2 className="text-3xl font-bold mb-6 mt-8 text-white" {...props} />,
    h3: ({...props}) => <h3 className="text-2xl font-bold mb-4 mt-6 text-white" {...props} />,
    p: ({...props}) => <p className="text-lg text-neutral-300 mb-6 leading-relaxed" {...props} />,
    ul: ({...props}) => <ul className="list-disc list-inside mb-6 pl-4 space-y-2" {...props} />,
    ol: ({...props}) => <ol className="list-decimal list-inside mb-6 pl-4 space-y-2" {...props} />,
    li: ({...props}) => <li className="text-lg text-neutral-300 leading-relaxed" {...props} />,
    a: ({...props}) => <a className="text-primary hover:underline break-words" {...props} />,
    strong: ({...props}) => <strong className="font-bold text-white" {...props} />,
    code: ({...props}) => <code className="bg-neutral-800 text-primary rounded-md px-2 py-1 font-mono text-sm" {...props} />,
    blockquote: ({...props}) => <blockquote className="border-l-4 border-primary pl-4 italic text-neutral-400" {...props} />,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!postMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white text-center p-4">
        <h2 className="text-3xl font-bold text-error mb-4">404 - Post Not Found</h2>
        <Link to="/blog" className="text-primary hover:underline">Back to Blog</Link>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <div className="bg-background-dark min-h-screen pt-24 pb-16">
        <Helmet>
          <title>{`${postMeta.title} - Juno Blog`}</title>
          <meta name="description" content={postMeta.description} />
          <meta property="og:title" content={`${postMeta.title} - Juno Blog`} />
          <meta property="og:description" content={postMeta.description} />
          <meta property="og:image" content={`https://juno.com.pk${postMeta.imageUrl}`} />
          <meta property="og:url" content={`https://juno.com.pk/blog/${postMeta.slug}`} />
          <meta property="og:type" content="article" />
          <meta property="article:published_time" content={postMeta.date} />
          <meta property="article:author" content={postMeta.author} />
          {postMeta.tags.map(tag => (
            <meta property="article:tag" content={tag} key={tag} />
          ))}
        </Helmet>

        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <img src={postMeta.imageUrl} alt={postMeta.title} className="w-full h-96 object-cover rounded-lg mb-8"/>
            
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-extrabold gradient-text mb-4">{postMeta.title}</h1>
              <div className="flex items-center justify-center text-sm text-neutral-400">
                <div className="flex items-center mr-6"><Calendar size={14} className="mr-2"/> {new Date(postMeta.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div className="flex items-center"><User size={14} className="mr-2"/> By {postMeta.author}</div>
              </div>
            </div>

            <article className="max-w-none mx-auto">
              <ReactMarkdown components={markdownComponents}>{postContent}</ReactMarkdown>
            </article>

            <div className="mt-12 pt-8 border-t border-neutral-800">
                <div className="flex items-center gap-3">
                    <Tag size={20} className="text-neutral-500"/>
                    {postMeta.tags.map(tag => (
                      <span key={tag} className="text-sm bg-neutral-800 text-neutral-300 font-semibold px-3 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
            </div>

          </motion.div>
        </div>
      </div>
    </HelmetProvider>
  );
};

export default BlogPostPage;
