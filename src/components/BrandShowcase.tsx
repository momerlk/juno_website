import React from 'react';
import { motion } from 'framer-motion';

const banners = [
  { src: '/brand_banners/rakh2.jpg', alt: 'Rakh Collection' },
  { src: '/brand_banners/ukiyo2.webp', alt: 'Ukiyo Lifestyle' },
  { src: '/brand_banners/kara2.webp', alt: 'Kara Studio' },
  { src: '/brand_banners/rakh4.jpg', alt: 'Rakh Campaign' },
  { src: '/brand_banners/ukiyo3.webp', alt: 'Ukiyo Collection' },
  { src: '/brand_banners/qariney2.webp', alt: 'Qariney Series' },
  { src: '/brand_banners/rakh5.jpg', alt: 'Rakh Collection' },
  { src: '/brand_banners/ukiyo4.webp', alt: 'Ukiyo Lifestyle' },
];

const BrandShowcase: React.FC = () => {
  return (
    <section className="py-32 bg-black overflow-hidden border-y border-white/5">
      <div className="container mx-auto px-4 mb-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
              Visualizing the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic px-2">Indie Spirit</span>
            </h2>
            <p className="text-neutral-400 text-xl md:text-2xl font-light max-w-2xl mx-auto italic">
              Experience the visual narratives of Pakistan&apos;s most creative labels.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="relative flex overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-4">
          {[...banners, ...banners].map((banner, index) => (
            <div key={index} className="inline-block px-4 group">
              <div className="relative w-[400px] md:w-[700px] aspect-[16/9] overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl transition-all duration-700">
                <img
                  src={banner.src}
                  alt={banner.alt}
                  className="w-full h-full object-cover transition-all duration-700 scale-110 group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
                <div className="absolute bottom-8 left-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <p className="text-white font-black text-2xl tracking-tight bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                    {banner.alt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default BrandShowcase;
