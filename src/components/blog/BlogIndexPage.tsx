import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { posts, PostMeta } from '../../blog';
import { ArrowRight, Calendar, User } from 'lucide-react';

const BlogIndexPage: React.FC = () => {
  const sortedPosts = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-background-dark min-h-screen pt-24 pb-16">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 pt-12"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold gradient-text">The Juno Blog</h1>
          <p className="text-lg text-neutral-300 mt-4 max-w-2xl mx-auto">Insights on fashion, technology, and our journey.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/blog/${post.slug}`} className="card card-hover block overflow-hidden h-full">
                <img src={post.imageUrl} alt={post.title} className="w-full h-56 object-cover"/>
                <div className="p-6">
                  <div className="flex items-center text-sm text-neutral-400 mb-2">
                    <div className="flex items-center mr-4"><Calendar size={14} className="mr-2"/> {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div className="flex items-center"><User size={14} className="mr-2"/> {post.author}</div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3 hover:text-primary transition-colors">{post.title}</h2>
                  <p className="text-neutral-400 mb-4">{post.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="text-primary font-semibold flex items-center group">
                    Read More <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1"/>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogIndexPage;
