import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const logoFiles = [
  'enthenio.jpg',
  'kainaat.jpg', 'mugho.jpg',
  'rakh.jpg', 'zeerosh.jpg',
  "zarukee.jpg", "egnar.jpg", 
  "ukiyo.jpeg", '2000crews.jpg', 'acid.jpg', 'grabbers.jpg', 'masha.jpg', 'street_in_vision.jpg'
];

const logos = logoFiles.map(file => ({
  src: `/brand_logos/${file}`,
  alt: file.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Capitalize first letter of each word
}));

const BrandsSection: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className="section bg-background-dark">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Home to Pakistan's <span className="gradient-text">Coolest Brands</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            We partner with the most innovative and trend-setting indie fashion brands to bring you a curated and exclusive shopping experience.
          </p>
        </motion.div>
        
        <div className="relative">
          <div className="logo-scroller group">
            <div className="logo-scroller-inner">
              {[...logos, ...logos].map((logo, index) => (
                <div key={index} className="flex-shrink-0 mx-6 w-40 h-40 p-1">
                  <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center p-2 border-2 border-neutral-800 group-hover:border-neutral-700 transition-all duration-500">
                    <img 
                      src={logo.src} 
                      alt={logo.alt} 
                      className="h-28 w-28 rounded-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-transparent to-background-dark pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;