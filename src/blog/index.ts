export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  tags: string[];
  imageUrl: string;
}

// Note: When you add a new blog post, you must also add its metadata here.
export const posts: PostMeta[] = [
  {
    slug: 'hello-world',
    title: 'Hello World: Our First Blog Post',
    description: 'Welcome to the Juno blog! Here we will be sharing our journey, insights into the fashion industry, and updates about our platform.',
    author: 'Omer Ali Malik',
    date: '2025-09-18',
    tags: ['Juno', 'Welcome', 'Fashion Tech'],
    imageUrl: '/blog/hello-world.png',
  },
  {
    slug: 'the-future-of-fashion-discovery',
    title: 'The Future of Fashion Discovery',
    description: 'How AI and personalization are changing the way we find and shop for fashion. A deep dive into the technology behind Juno.',
    author: 'Asmar Shahid',
    date: '2025-09-20',
    tags: ['AI', 'Technology', 'E-commerce'],
    imageUrl: '/blog/future-fashion.png',
  },
];
