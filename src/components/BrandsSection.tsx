import React, { useRef, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Gem, Shirt, HandHeart } from 'lucide-react';

const logoFiles = [
  'enthenio.jpg', 'kainaat.jpg', 'mugho.jpg', 'rakh.jpg',
  'zarukee.jpg', 'egnar.jpg', 'ukiyo.jpeg', 'grabbers.jpg'
];

const logos = logoFiles.map(file => ({
  src: `/brand_logos/${file}`,
  alt: file.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
}));

const curationPrinciples = [
  {
    icon: <Gem size={20} className="text-primary" />,
    title: 'Original Design Language',
    text: 'Brands with clear aesthetic identity, not trend copies.',
  },
  {
    icon: <Shirt size={20} className="text-secondary" />,
    title: 'Quality You Can Feel',
    text: 'Thoughtful production, materials, and fit standards.',
  },
  {
    icon: <HandHeart size={20} className="text-accent" />,
    title: 'Founder-Led Stories',
    text: 'Indie labels building culture with every collection.',
  },
];

const BrandCard: React.FC<{ logo: typeof logos[0] }> = ({ logo }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;

    const rotateX = -(y / height) * 10;
    const rotateY = (x / width) * 10;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
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
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 }
      }}
      className="group relative bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center aspect-square backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20"
      style={{ transition: 'transform 0.1s ease-out' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />

      <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 group-hover:border-primary/50 transition-colors">
        <img
          src={logo.src}
          alt={logo.alt}
          className="w-full h-full rounded-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
          loading="lazy"
        />
      </div>

      <p className="mt-6 font-bold text-lg text-white opacity-60 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
        {logo.alt}
      </p>
    </motion.div>
  );
};

const BrandsSection: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-primary font-semibold tracking-wide uppercase text-sm mb-4 block">Indie Brand Spotlight</span>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
            Curated Labels With
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary">Distinctive DNA</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            Juno is built around independent Pakistani brands that care about design, detail, and community.
            Every label here is selected to help shoppers discover something original.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-14"
        >
          {curationPrinciples.map((principle) => (
            <div key={principle.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                {principle.icon}
              </div>
              <p className="text-white font-semibold mb-1">{principle.title}</p>
              <p className="text-sm text-neutral-400">{principle.text}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
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
