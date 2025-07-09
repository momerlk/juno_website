import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Sparkles, Heart, Zap } from 'lucide-react';

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
        icon: <Zap className="text-primary" size={32} />,
        // Corrected path: Assumes juno_screenshots folder is directly in the public directory
        image: '/juno_screenshots/1.png'
      },
      {
        title: 'Build Outfits',
        description: 'Mix and match pieces to create your own looks. Get AI-powered outfit suggestions tailored to your style.',
        icon: <Sparkles className="text-secondary" size={32} />,
        image: '/juno_screenshots/2.png'
      },
      {
        title: 'Exclusive Brands',
        description: 'Discover exclusive indie fahsion brands that you won\'t find anywhere else but juno. Built by designers from the leading art universities in Pakistan you won\'t be disappointed.',
        icon: <Heart className="text-accent" size={32} />,
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
  const FeatureSection = ({ title, description, image, icon, index }: {
    title: string;
    description: string;
    image: string;
    icon?: React.ReactNode;
    index: number;
  }) => (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-3xl"></div>
      
      <motion.div
      // Animate opacity based on inView status
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }} // Smooth transition for appearance
      className="min-h-screen flex items-center relative z-10" // Ensure section takes full viewport height and centers content
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-20">
        {/* Alternate image and text layout based on index for visual variety */}
        {index % 2 === 0 ? (
          <>
            {/* Text content on the left */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8 p-8 lg:p-16 text-white"
            >
              {icon && (
                <div className="inline-flex p-4 bg-gradient-to-br from-background-light/50 to-background/50 backdrop-blur-sm rounded-2xl border border-neutral-800/50">
                  {icon}
                </div>
              )}
              <h3 className="text-4xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-300 bg-clip-text text-transparent">{title}</h3>
              <p className="text-xl lg:text-2xl text-neutral-400 leading-relaxed">{description}</p>
              <div className="flex items-center space-x-4 pt-4">
                <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                <span className="text-sm text-neutral-500 uppercase tracking-wider">Feature Highlight</span>
              </div>
            {/* Image content on the right */}
            {/* Added flex utilities to ensure image is centered within its container */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative h-[80vh] w-full flex justify-center items-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 blur-3xl rounded-full"></div>
              <img
                src={image}
                alt={title}
                // Fallback for image loading errors
                onError={(e) => { e.currentTarget.src = `https://placehold.co/600x800/282c34/a0a0a0?text=Image+Not+Found`; }}
                // Changed object-contain to object-cover to fill the container
                className="relative z-10 w-full h-full object-cover rounded-2xl shadow-2xl shadow-primary/20 border border-neutral-800/50"
              />
            </motion.div>
          </>
        ) : (
          <>
            {/* Image content on the left */}
            {/* Added flex utilities to ensure image is centered within its container */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative h-[80vh] w-full flex justify-center items-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 to-accent/10 blur-3xl rounded-full"></div>
              <img
                src={image}
                alt={title}
                // Fallback for image loading errors
                onError={(e) => { e.currentTarget.src = `https://placehold.co/600x800/282c34/a0a0a0?text=Image+Not+Found`; }}
                // Changed object-contain to object-cover to fill the container
                className="relative z-10 w-full h-full object-cover rounded-2xl shadow-2xl shadow-secondary/20 border border-neutral-800/50"
              />
            </motion.div>
            {/* Text content on the right */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8 p-8 lg:p-16 text-white"
            >
              {icon && (
                <div className="inline-flex p-4 bg-gradient-to-br from-background-light/50 to-background/50 backdrop-blur-sm rounded-2xl border border-neutral-800/50">
                  {icon}
                </div>
              )}
              <h3 className="text-4xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-300 bg-clip-text text-transparent">{title}</h3>
              <p className="text-xl lg:text-2xl text-neutral-400 leading-relaxed">{description}</p>
              <div className="flex items-center space-x-4 pt-4">
                <div className="w-12 h-1 bg-gradient-to-r from-secondary to-accent rounded-full"></div>
                <span className="text-sm text-neutral-500 uppercase tracking-wider">Feature Highlight</span>
              </div>
            </div>
          </>
        )}
      </div>
      </motion.div>
    </div>
  );

  return (
    <section className="bg-gradient-to-b from-background-light to-background text-white min-h-screen py-16 relative overflow-hidden" id="screenshots">
      <div className="mx-auto relative z-10">
        {/* Background decorations */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
        
        {/* Ref for the whole section to trigger animation */}
        <div ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center py-10 md:py-20 relative z-10"
          >
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-8">
              ✨ Revolutionary Experience
            </div>
            <h2 className="text-5xl lg:text-7xl font-bold mb-4 md:mb-8 leading-tight">
              Experience the <span className="gradient-text">Future</span> of Fashion
            </h2>
            <p className="text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto">
              Discover how Juno revolutionizes your fashion journey with cutting-edge features
              and intuitive design
            </p>
          </motion.div>

          <div className="space-y-32 md:space-y-40 py-10">
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
