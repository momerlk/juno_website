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
      icon: <Zap className="text-white" size={24} />,
      image: '/juno_screenshots/1.png',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      title: 'Build Your Outfits',
      description: 'Mix and match pieces to create your own looks. Get AI-powered outfit suggestions tailored to your style.',
      icon: <Sparkles className="text-white" size={24} />,
      image: '/juno_screenshots/2.png',
      color: 'from-purple-400 to-pink-500'
    },
    {
      title: 'Exclusive Indie Brands',
      description: 'Discover exclusive indie fashion brands you won\'t find anywhere else. Curated from the best designers.',
      icon: <Heart className="text-white" size={24} />,
      image: '/juno_screenshots/3.png',
      color: 'from-cyan-400 to-blue-500'
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
        className="group relative h-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 rounded-3xl transform group-hover:scale-[1.02] transition-transform duration-500" />
        
        <div className="relative h-full bg-black/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 overflow-hidden flex flex-col">
          {/* Glowing background blob */}
          <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${color} rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />

          <div className="relative z-10">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg`}>
              {icon}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
            <p className="text-neutral-400 mb-8 leading-relaxed">{description}</p>
          </div>

          <div className="relative mt-auto flex justify-center">
            <div className="relative w-full max-w-[240px] aspect-[9/19] rounded-[2.5rem] border-4 border-white/10 bg-black overflow-hidden shadow-2xl transform translate-y-12 group-hover:translate-y-8 transition-transform duration-500">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/10 rounded-[2.5rem]" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="screenshots" className="py-32 bg-black relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm font-medium text-white mb-6">
            ✨ Experience the New Standard
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Discovery</span>
          </h2>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Juno is more than just an app—it's a new way to interact with fashion. Explore our core features designed for a seamless journey.
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