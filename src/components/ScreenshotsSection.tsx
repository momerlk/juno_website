import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Sparkles, Heart, Zap } from 'lucide-react';

const ScreenshotsSection: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      title: 'Swipe to Shop',
      description: 'Discover new styles with a simple swipe. An interactive, fast, and fun way to find fashion you love.',
      icon: <Zap className="text-primary" size={28} />,
      image: '/juno_screenshots/1.png',
      color: 'primary'
    },
    {
      title: 'Build Your Outfits',
      description: 'Mix and match pieces to create your own looks. Get AI-powered outfit suggestions tailored to your style.',
      icon: <Sparkles className="text-secondary" size={28} />,
      image: '/juno_screenshots/2.png',
      color: 'secondary'
    },
    {
      title: 'Exclusive Indie Brands',
      description: 'Discover exclusive indie fashion brands you won\'t find anywhere else. Curated from the best designers.',
      icon: <Heart className="text-accent" size={28} />,
      image: '/juno_screenshots/3.png',
      color: 'accent'
    },
  ];

  const FeatureCard = ({ title, description, image, icon, index, color }: {
    title: string;
    description: string;
    image: string;
    icon: React.ReactNode;
    index: number;
    color: string;
  }) => {
    const { ref: cardRef, inView: cardInView } = useInView({ triggerOnce: true, threshold: 0.3 });

    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 50 }}
        animate={cardInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: index * 0.2 }}
        className={`card group relative overflow-hidden p-8 h-full flex flex-col shadow-lg hover:shadow-2xl hover:shadow-${color}/20`}
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className={`p-3 bg-${color}/10 rounded-xl`}>{icon}</div>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-neutral-400 mb-6 flex-grow">{description}</p>
        <div className="relative h-96 rounded-lg overflow-hidden border-2 border-neutral-800 group-hover:border-primary/50 transition-all duration-300">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      </motion.div>
    );
  };

  return (
    <section id="screenshots" className="section bg-background">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-5 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-bold mb-6">
            A Revolutionary Experience
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            The Future of <span className="gradient-text">Fashion Discovery</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-3xl mx-auto">
            Juno is more than just an app—it's a new way to interact with fashion. Explore our core features designed for a seamless and engaging journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScreenshotsSection;
