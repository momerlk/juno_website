import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const ScreenshotsSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const screenshots = {
    app: [
      {
        title: 'Smart Wardrobe',
        description: 'Organize and manage your clothing collection effortlessly',
        image: '/src/assets/screenshots/app-wardrobe.svg'
      },
      {
        title: 'Style Recommendations',
        description: 'Get personalized outfit suggestions based on your preferences',
        image: '/src/assets/screenshots/app-recommendations.svg'
      },
      {
        title: 'Virtual Try-On',
        description: 'See how clothes look on you before making a purchase',
        image: '/src/assets/screenshots/app-tryon.svg'
      }
    ],
    studio: [
      {
        title: 'Design Dashboard',
        description: 'Powerful tools for fashion designers and brands',
        image: '/src/assets/screenshots/studio-dashboard.svg'
      },
      {
        title: 'Analytics Platform',
        description: 'Track trends and customer preferences in real-time',
        image: '/src/assets/screenshots/studio-analytics.svg'
      },
      {
        title: 'Collection Manager',
        description: 'Manage and showcase your fashion collections',
        image: '/src/assets/screenshots/studio-collection.svg'
      }
    ]
  };

  const ScreenshotCard = ({ title, description, image }: {
    title: string;
    description: string;
    image: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="card card-hover"
    >
      <div className="aspect-[4/3] overflow-hidden rounded-xl mb-4">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <h4 className="mb-2">{title}</h4>
      <p className="text-neutral-400">{description}</p>
    </motion.div>
  );

  return (
    <section className="section bg-background" id="screenshots">
      <div className="container" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">
            Experience the <span className="gradient-text">Future</span> of Fashion
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Discover how Juno revolutionizes your fashion journey with cutting-edge features
            and intuitive design
          </p>
        </motion.div>

        <div className="space-y-20">
          {/* Juno App Screenshots */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mb-10"
            >
              Juno App Features
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {screenshots.app.map((screenshot, index) => (
                <ScreenshotCard key={index} {...screenshot} />
              ))}
            </div>
          </div>

          {/* Juno Studio Screenshots */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mb-10"
            >
              Juno Studio Features
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {screenshots.studio.map((screenshot, index) => (
                <ScreenshotCard key={index} {...screenshot} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScreenshotsSection;