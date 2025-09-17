import React from 'react';
import { motion } from 'framer-motion';
import { FilePlus, Edit, Terminal } from 'lucide-react';

const WritePage: React.FC = () => {
  const codeBlockStyle = "bg-neutral-900 p-4 rounded-lg text-sm text-neutral-300 font-mono border border-neutral-700";

  return (
    <div className="bg-background-dark min-h-screen pt-24 pb-16">
      <div className="container mx-auto max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 pt-12"
        >
          <h1 className="text-5xl font-extrabold gradient-text">How to Write a New Post</h1>
          <p className="text-lg text-neutral-300 mt-4">A guide for creating and publishing articles on the Juno blog.</p>
        </motion.div>

        <div className="space-y-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card p-8">
            <div className="flex items-start gap-6">
              <div className="p-3 bg-primary/10 rounded-xl"><FilePlus size={28} className="text-primary"/></div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Step 1: Create a New File</h2>
                <p className="text-neutral-400 mb-4">Create a new `.mdx` file inside the <code className={codeBlockStyle}>public/blog/posts/</code> directory. The name of the file will be the URL slug.</p>
                <p className="text-neutral-400">For example, to create a post with the URL <code className="text-primary">/blog/my-new-post</code>, you would create the file:</p>
                <pre className={`${codeBlockStyle} mt-2`}>public/blog/posts/my-new-post.mdx</pre>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="card p-8">
            <div className="flex items-start gap-6">
              <div className="p-3 bg-primary/10 rounded-xl"><Edit size={28} className="text-primary"/></div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Step 2: Add Content</h2>
                <p className="text-neutral-400 mb-4">Write your blog post using Markdown syntax. At the very top of the file, you must include a metadata block.</p>
                <p className="text-neutral-400">Copy and paste the template below and fill in your post's details:</p>
                <pre className={`${codeBlockStyle} mt-2 whitespace-pre-wrap`}>
                  {
`---
slug: 'your-url-slug'
title: 'Your Amazing Blog Post Title'
description: 'A short, compelling summary of your article.'
author: 'Your Name'
date: 'YYYY-MM-DD'
tags: ['tag1', 'tag2', 'tag3']
imageUrl: '/blog/your-image-name.png'
---

# Your Post Title

Start writing your amazing blog post content here...
`
                  }
                </pre>
                <p className="text-neutral-400 mt-4">Place any images you use in the <code className={codeBlockStyle}>public/blog/</code> directory.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="card p-8">
            <div className="flex items-start gap-6">
              <div className="p-3 bg-primary/10 rounded-xl"><Terminal size={28} className="text-primary"/></div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Step 3: Update the Blog Index</h2>
                <p className="text-neutral-400 mb-4">The final step is to add your new post's metadata to the central list. Open the file <code className={codeBlockStyle}>src/blog/index.ts</code> and add a new object for your post to the `posts` array.</p>
                <p className="text-neutral-400">This step is crucial for your post to appear on the main blog page.</p>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default WritePage;