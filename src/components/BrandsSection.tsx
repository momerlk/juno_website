import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const logoFiles = [
  'acid.jpg',
  'kainaat.jpg', 'masha.jpg',
  'rakh.jpg', 'zeerosh.jpg'
];

const logos = logoFiles.map(file => ({
  src: `/brand_logos/${file}`,
  alt: file.split('.')[0].replace(/[-_]/g, ' '), // Create alt text from filename
}));

const BrandsSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <section ref={ref} className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          Featured Brands on <span className="gradient-text">Juno</span>
        </motion.h2>
        
        <div className="logo-scroller">
          <div className="logo-scroller-inner">
            {logos.concat(logos).map((logo, index) => (
              <div key={index} className="flex-shrink-0 mx-8">
                <img 
                  src={logo.src} 
                  alt={logo.alt} 
                  className="h-28 w-28 rounded-full object-cover p-1 shadow-md"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;
