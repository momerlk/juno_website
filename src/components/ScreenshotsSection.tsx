import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Store, Sparkles, HeartHandshake, Zap, Search, ShoppingBag } from 'lucide-react';

const ScreenshotsSection: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      title: 'Curated Feed',
      description: 'A personalized stream of the latest drops from Pakistan’s top indie labels.',
      icon: <Sparkles className="text-white" size={24} />,
      image: '/juno_mockups/feed.png'
    },
    {
      title: 'Swipe Mechanic',
      description: 'Discovery turned into an experience. Swipe to find your next favorite piece.',
      icon: <Zap className="text-white" size={24} />,
      image: '/juno_mockups/swipe_to_shop.png'
    },
    {
      title: 'A.I. Discovery',
      description: 'Intelligent search that understands your style DNA and connects you to creators.',
      icon: <Search className="text-white" size={24} />,
      image: '/juno_mockups/ai_search.png'
    },
    {
      title: 'Brand Ecosystem',
      description: 'Explore 50+ handpicked independent labels in one unified marketplace.',
      icon: <Store className="text-white" size={24} />,
      image: '/juno_mockups/allbrands_page.png'
    },
    {
      title: 'Label Spotlights',
      description: 'Deep dive into the stories, craft, and vision of individual brand founders.',
      icon: <HeartHandshake className="text-white" size={24} />,
      image: '/juno_mockups/beands_page.png'
    },
    {
      title: 'Instant Checkout',
      description: 'Seamless one-tap ordering from multiple indie brands in a single experience.',
      icon: <ShoppingBag className="text-white" size={24} />,
      image: '/juno_mockups/checkout.png'
    },
  ];

  const FeatureCard = ({ title, description, image, icon, index }: {
    title: string;
    description: string;
    image: string;
    icon: React.ReactNode;
    index: number;
  }) => {
    const { ref: cardRef, inView: cardInView } = useInView({ triggerOnce: true, threshold: 0.2 });

    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 50 }}
        animate={cardInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: index * 0.1 }}
        className="group relative h-full"
      >
        <div className="relative h-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 overflow-hidden flex flex-col hover:border-primary/20 transition-all duration-500">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

          <div className="relative z-10 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
              {icon}
            </div>

            <h3 className="text-xl font-black text-white mb-3 tracking-tighter uppercase">{title}</h3>
            <p className="text-neutral-400 leading-relaxed font-light italic text-base">{description}</p>
          </div>

          <div className="relative mt-auto flex justify-center px-4">
            <div className="relative w-full max-w-[280px] transform translate-y-16 group-hover:translate-y-8 transition-transform duration-700 drop-shadow-2xl">
              <img
                src={image}
                alt={title}
                className="w-full h-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="screenshots" className="py-32 bg-black relative overflow-hidden border-b border-white/5">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter">
            Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic px-2">Experience</span>
          </h2>
          <p className="text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto font-light italic">
            A purpose-built ecosystem for discovering and supporting Pakistan&apos;s independent creators.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScreenshotsSection;
