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
        title: 'Swipe to Shop',
        description: 'Discover new styles with a simple swipe. Shop fashion like never before—interactive, fast, and fun.',
        image: '/src/assets/screenshots/juno_screenshots/3.png'
      },
      {
        title: 'Build Outfits',
        description: 'Mix and match pieces to create your own looks. Get AI-powered outfit suggestions tailored to your style.',
        image: '/src/assets/screenshots/juno_screenshots/4.png'
      },
      {
        title: 'Win prizes in Fashion Tournaments',
        description: 'Compete in weekly styling challenges, showcase your fashion sense, and win exclusive rewards.',
        image: '/src/assets/screenshots/juno_screenshots/5.png'
      }
    ],
    studio: [
      {
        title: 'Inventory Management',
        description: 'Track stock levels, update products in real-time, and never miss a sale. Built for growing fashion brands.',
        image: '/src/assets/screenshots/juno_screenshots/2.png'
      },
      {
        title: 'Analytics Platform',
        description: 'Gain deep insights into customer behavior, sales trends, and product performance with real-time analytics.',
        image: '/src/assets/screenshots/juno_screenshots/6.png'
      },
      {
        title: 'Order fulfillment',
        description: 'Streamline order processing, shipping, and delivery to offer a smooth experience from cart to closet.',
        image: '/src/assets/screenshots/juno_screenshots/7.png'
      }
    ]
  };


  const FeatureSection = ({ title, description, image, index }: {
    title: string;
    description: string;
    image: string;
    index: number;
  }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      className="min-h-screen flex items-center"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {index % 2 === 0 ? (
          <>
            <div className="space-y-8 p-8 lg:p-16">
              <h3 className="text-4xl lg:text-6xl font-bold leading-tight">{title}</h3>
              <p className="text-xl lg:text-2xl text-neutral-400">{description}</p>
            </div>
            <div className="relative h-[80vh] w-full">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover rounded-3xl shadow-2xl"
              />
            </div>
          </>
        ) : (
          <>
            <div className="relative h-[80vh] w-full">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover rounded-3xl shadow-2xl"
              />
            </div>
            <div className="space-y-8 p-8 lg:p-16">
              <h3 className="text-4xl lg:text-6xl font-bold leading-tight">{title}</h3>
              <p className="text-xl lg:text-2xl text-neutral-400">{description}</p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <section className="bg-background" id="screenshots">
      <div ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center py-20"
        >
          <h2 className="text-5xl lg:text-7xl font-bold mb-8">
            Experience the <span className="gradient-text">Future</span> of Fashion
          </h2>
          <p className="text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto">
            Discover how Juno revolutionizes your fashion journey with cutting-edge features
            and intuitive design
          </p>
        </motion.div>

        <div className="space-y-32">
          {/* Juno App Screenshots */}
          {screenshots.app.map((screenshot, index) => (
            <FeatureSection key={index} {...screenshot} index={index} />
          ))}

          {/* Juno Studio Screenshots */}
          {screenshots.studio.map((screenshot, index) => (
            <FeatureSection key={index} {...screenshot} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScreenshotsSection;