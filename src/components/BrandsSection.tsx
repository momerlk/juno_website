import React, { useRef, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const logoFiles = [
  'enthenio.jpg', 'kainaat.jpg', 'mugho.jpg', 'rakh.jpg',
  "zarukee.jpg", "egnar.jpg", "ukiyo.jpeg",
  'grabbers.jpg'
];

const logos = logoFiles.map(file => ({
  src: `/brand_logos/${file}`,
  alt: file.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
}));

const BrandCard: React.FC<{ logo: typeof logos[0] }> = ({ logo }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const { left, top, width, height } = cardRef.current.getBoundingClientRect();
        const x = e.clientX - left - width / 2;
        const y = e.clientY - top - height / 2;

        const rotateX = -(y / height) * 15; // Max rotation
        const rotateY = (x / width) * 15; // Max rotation

        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            variants={{
                hidden: { opacity: 0, y: 50 },
                show: { opacity: 1, y: 0 }
            }}
            className="brand-card group relative bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center aspect-square"
            style={{ transition: 'transform 0.1s ease-out' }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
                src={logo.src} 
                alt={logo.alt} 
                className="h-24 w-24 rounded-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                loading="lazy"
            />
            <p className="text-white font-bold mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-6">{logo.alt}</p>
        </motion.div>
    );
};


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
        
        <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.05
                    }
                }
            }}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
        >
          {logos.map((logo, index) => (
            <BrandCard key={index} logo={logo} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BrandsSection;