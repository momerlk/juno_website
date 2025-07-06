import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const ScreenshotsSection: React.FC = () => {
  // useInView hook to trigger animations when the section comes into view
  const [ref, inView] = useInView({
    triggerOnce: true, // Animation will only occur once
    threshold: 0.1,    // Element is 10% visible to trigger
  });

  // Data structure for app and studio screenshots, now using corrected public paths
  const screenshots = {
    app: [
      {
        title: 'Swipe to Shop',
        description: 'Discover new styles with a simple swipe. Shop fashion like never before—interactive, fast, and fun.',
        // Corrected path: Assumes juno_screenshots folder is directly in the public directory
        image: '/juno_screenshots/1.png'
      },
      {
        title: 'Build Outfits',
        description: 'Mix and match pieces to create your own looks. Get AI-powered outfit suggestions tailored to your style.',
        image: '/juno_screenshots/2.png'
      },
      {
        title: 'Exclusive Brands',
        description: 'Discover exclusive indie fahsion brands that you won\'t find anywhere else but juno. Built by designers from the leading art universities in Pakistan you won\'t be disappointed.',
        image: '/juno_screenshots/3.png'
      },
      // {
      //   title: 'Win prizes in Fashion Tournaments',
      //   description: 'Compete in weekly styling challenges, showcase your fashion sense, and win exclusive rewards.',
      //   image: '/juno_screenshots/3.png'
      // }
    ],
    studio: [
      // {
      //   title: 'Inventory Management',
      //   description: 'Track stock levels, update products in real-time, and never miss a sale. Built for growing fashion brands.',
      //   image: '/juno_screenshots/2.png'
      // },
      // {
      //   title: 'Analytics Platform',
      //   description: 'Gain deep insights into customer behavior, sales trends, and product performance with real-time analytics.',
      //   image: '/juno_screenshots/6.png'
      // },
      // {
      //   title: 'Order fulfillment',
      //   description: 'Streamline order processing, shipping, and delivery to offer a smooth experience from cart to closet.',
      //   image: '/juno_screenshots/7.png'
      // }
    ]
  };

  // FeatureSection component to render individual screenshot blocks
  const FeatureSection = ({ title, description, image, index }: {
    title: string;
    description: string;
    image: string;
    index: number;
  }) => (
    <motion.div
      // Animate opacity based on inView status
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }} // Smooth transition for appearance
      className="min-h-screen flex items-center" // Ensure section takes full viewport height and centers content
    >
      <div className="grid grid-cols-1 lg:grid-cols-2  items-center">
        {/* Alternate image and text layout based on index for visual variety */}
        {index % 2 === 0 ? (
          <>
            {/* Text content on the left */}
            <div className="space-y-8 p-8 lg:p-16 text-white">
              <h3 className="text-4xl lg:text-6xl font-bold leading-tight">{title}</h3>
              <p className="text-xl lg:text-2xl text-neutral-400">{description}</p>
            </div>
            {/* Image content on the right */}
            {/* Added flex utilities to ensure image is centered within its container */}
            <div className="relative h-[80vh] w-full  flex justify-center items-center">
              <img
                src={image}
                alt={title}
                // Fallback for image loading errors
                onError={(e) => { e.currentTarget.src = `https://placehold.co/600x800/282c34/a0a0a0?text=Image+Not+Found`; }}
                // Changed object-contain to object-cover to fill the container
                className="w-full h-full object-cover"
              />
            </div>
          </>
        ) : (
          <>
            {/* Image content on the left */}
            {/* Added flex utilities to ensure image is centered within its container */}
            <div className="relative h-[80vh] w-full flex justify-center items-center">
              <img
                src={image}
                alt={title}
                // Fallback for image loading errors
                onError={(e) => { e.currentTarget.src = `https://placehold.co/600x800/282c34/a0a0a0?text=Image+Not+Found`; }}
                // Changed object-contain to object-cover to fill the container
                className="w-full h-full object-cover"
              />
            </div>
            {/* Text content on the right */}
            <div className="space-y-8 p-8 lg:p-16 text-white">
              <h3 className="text-4xl lg:text-6xl font-bold leading-tight">{title}</h3>
              <p className="text-xl lg:text-2xl text-neutral-400">{description}</p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <section className="bg-background text-white min-h-screen py-16" id="screenshots">
      <div className=" mx-auto ">
        {/* Ref for the whole section to trigger animation */}
        <div ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center py-10 md:py-20"
          >
            <h2 className="text-5xl lg:text-7xl font-bold mb-4 md:mb-8 leading-tight">
              Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Future</span> of Fashion
            </h2>
            <p className="text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto">
              Discover how Juno revolutionizes your fashion journey with cutting-edge features
              and intuitive design
            </p>
          </motion.div>

          <div className="space-y-24 md:space-y-32 py-10">
            {/* Juno App Screenshots */}
            {screenshots.app.map((screenshot, index) => (
              <FeatureSection key={`app-${index}`} {...screenshot} index={index} />
            ))}

            {/* Juno Studio Screenshots */}
            {/* {screenshots.studio.map((screenshot, index) => (
              <FeatureSection key={`studio-${index}`} {...screenshot} index={screenshots.app.length + index} />
            ))} */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScreenshotsSection;
