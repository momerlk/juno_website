import React from 'react';
import { motion } from 'framer-motion';

const logoFiles = [
  'enthenio.jpg', 'kainaat.jpg', 'mugho.jpg', 'rakh.jpg',
  'zarukee.jpg', 'egnar.jpg', 'ukiyo.jpeg', 'grabbers.jpg',
  'Aphrodite.png', 'Gumaan.png', 'Kara.png', 'NOIRE.png',
  'Tabaadil.png', 'Seek Attire.png', 'Ukiyo.png', 'NoRgrt.png',
  'Nakashi.png', 'Qariney.png', 'ROPE.png', 'Core Store.png'
];

const logos = logoFiles.map(file => ({
  src: `/brand_logos/${file}`,
  alt: file.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
}));

const BrandsSection: React.FC = () => {
  // Split logos into two rows
  const firstRow = logos.slice(0, Math.ceil(logos.length / 2));
  const secondRow = logos.slice(Math.ceil(logos.length / 2));

  return (
    <section className="py-20 bg-black relative overflow-hidden border-b border-white/5">
      <div className="container mx-auto px-4 relative z-10 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-left max-w-xl">
            <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
              Discover the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary py-2 px-3">Ecosystem</span>
            </h3>
          </div>
          <div className="text-right">
            <p className="text-neutral-500 font-bold text-lg uppercase tracking-[0.2em]">
              50+ Curated Labels
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col gap-4 overflow-hidden">
        {/* Row 1 */}
        <div className="flex animate-logo-marquee whitespace-nowrap py-4">
          {[...firstRow, ...firstRow, ...firstRow, ...firstRow].map((logo, index) => (
            <div key={index} className="inline-flex items-center justify-center px-6 group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-white/10 to-transparent border border-white/10 transition-all duration-500 group-hover:scale-110 group-hover:border-primary/50 overflow-hidden backdrop-blur-sm grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex animate-logo-marquee-reverse whitespace-nowrap py-4">
          {[...secondRow, ...secondRow, ...secondRow, ...secondRow].map((logo, index) => (
            <div key={index} className="inline-flex items-center justify-center px-6 group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-white/10 to-transparent border border-white/10 transition-all duration-500 group-hover:scale-110 group-hover:border-primary/50 overflow-hidden backdrop-blur-sm grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Faders for marquee */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
      </div>

      <style>{`
        @keyframes logo-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes logo-marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-logo-marquee {
          animation: logo-marquee 60s linear infinite;
        }
        .animate-logo-marquee-reverse {
          animation: logo-marquee-reverse 60s linear infinite;
        }
        .animate-logo-marquee:hover, .animate-logo-marquee-reverse:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default BrandsSection;
