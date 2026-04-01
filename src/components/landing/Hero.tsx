import React from 'react';
import { Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const brandAvatars = [
  { src: '/brand_logos/Kara.png',       alt: 'Kara'       },
  { src: '/brand_logos/NOIRE.png',      alt: 'NOIRE'      },
  { src: '/brand_logos/Ukiyo.png',      alt: 'Ukiyo'      },
  { src: '/brand_logos/Aphrodite.png',  alt: 'Aphrodite'  },
  { src: '/brand_logos/Rakh.png',       alt: 'Rakh'       },
];

const mosaic = [
  {
    src: '/brand_banners/noire6.jpg',
    alt: 'NOIRE',
    label: 'NOIRE',
    style: { aspectRatio: '2/3' } as React.CSSProperties,
    delay: 0.18,
    col: 'left',
  },
  {
    src: '/brand_banners/kara2.webp',
    alt: 'Kara',
    label: 'KARA',
    style: { aspectRatio: '16/9' } as React.CSSProperties,
    delay: 0.28,
    col: 'left',
  },
  {
    src: '/brand_banners/ukiyo5.jpg',
    alt: 'Ukiyo',
    label: 'UKIYO',
    style: { aspectRatio: '3/4' } as React.CSSProperties,
    delay: 0.38,
    col: 'right',
  },
  {
    src: '/brand_banners/rakh4.jpg',
    alt: 'Rakh',
    label: 'RAKH',
    style: { aspectRatio: '3/2' } as React.CSSProperties,
    delay: 0.48,
    col: 'right',
  },
];

const Hero: React.FC = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden bg-black selection:bg-primary/30"
    >
      {/* Atmosphere glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[55vw] h-[65vh] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[50vw] h-[55vh] rounded-full bg-secondary/8 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-20 lg:pt-36 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 xl:gap-20 items-center">

          {/* ── Left: text ── */}
          <div className="order-2 lg:order-1">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2.5 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="text-[10px] font-mono tracking-[0.32em] uppercase text-white/35">
                Pakistan · Indie · Now Live
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="font-black tracking-tighter leading-[0.87] mb-7 uppercase"
              style={{ fontSize: 'clamp(3.4rem, 6.5vw, 6.2rem)' }}
            >
              <span className="block text-white">Home of</span>
              <span className="block text-white">Pakistan&apos;s</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic py-1">
                Indie Brands.
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="text-neutral-400 font-light italic leading-relaxed mb-10 max-w-xs"
              style={{ fontSize: 'clamp(0.92rem, 1.4vw, 1.05rem)' }}
            >
              A curated marketplace for the most distinctive independent labels in Pakistan.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.26 }}
              className="flex flex-col sm:flex-row gap-3 mb-14"
            >
              <a
                href="/download"
                className="px-9 py-4 bg-white text-black rounded-full font-black text-base tracking-tight transition-all hover:scale-[1.04] active:scale-[0.97] hover:bg-neutral-100 flex items-center justify-center gap-2.5 shadow-lg shadow-white/10"
              >
                <Smartphone size={18} />
                Download App
              </a>
              <a
                href="/seller"
                className="px-9 py-4 rounded-full border text-white font-black text-base tracking-tight transition-all hover:scale-[1.04] active:scale-[0.97] flex items-center justify-center gap-2.5"
                style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
              >
                Launch Your Label
                <ArrowRight size={18} />
              </a>
            </motion.div>

            {/* Brand avatar strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.42 }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2.5">
                {brandAvatars.map((b, i) => (
                  <div
                    key={b.alt}
                    className="w-9 h-9 rounded-full border-2 border-black overflow-hidden bg-white/10 shrink-0"
                    style={{ zIndex: brandAvatars.length - i }}
                  >
                    <img
                      src={b.src}
                      alt={b.alt}
                      className="w-full h-full object-cover grayscale"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
              <div className="h-5 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.38)' }}>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>50+</span> indie labels
              </p>
            </motion.div>
          </div>

          {/* ── Right: brand image mosaic ── */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto lg:max-w-none lg:ml-auto">

              {/* Left column: multiple images */}
              <div className="flex flex-col gap-2.5">
                {mosaic.filter(item => item.col === 'left').map((item) => (
                  <motion.div
                    key={item.alt}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: item.delay }}
                    className="relative rounded-2xl overflow-hidden group cursor-pointer"
                    style={item.style}
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: 'linear-gradient(135deg, rgba(255,24,24,0.12) 0%, transparent 60%)' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-[9px] font-mono tracking-[0.28em] uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {item.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right column: multiple images, offset for asymmetry */}
              <div className="flex flex-col gap-2.5 mt-10">
                {mosaic.filter(item => item.col === 'right').map((item) => (
                  <motion.div
                    key={item.alt}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: item.delay }}
                    className="relative rounded-2xl overflow-hidden group cursor-pointer"
                    style={item.style}
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: 'linear-gradient(135deg, rgba(255,69,133,0.1) 0%, transparent 60%)' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="text-[9px] font-mono tracking-[0.28em] uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {item.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
