import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOGOS = [
  '2000crews.jpg', 'acid.jpg', 'Amnawajiha Closet.png', 'Anarchy.png', 
  'Aphrodite.png', 'Core Store.png', 'Ecowearspk.png', 'egnar.jpg', 
  'enthenio.jpg', 'FRNZE.png', 'grabbers.jpg', 'Grabbers.png', 
  'Gumaan.png', 'kainaat.jpg', 'Kainaat.png', 'Kara.png', 
  'Lilly by Rabail.png', 'masha.jpg', 'Mashrib.png', 'mugho.jpg', 
  'Nakashi.png', 'NOIRE.png', 'NoRgrt.png', 'Qariney.png', 
  'rakh.jpg', 'Rakh.png', 'ROPE.png', 'Seek Attire.png', 
  'street_in_vision.jpg', 'Tabaadil.png', 'ukiyo.jpeg', 'Ukiyo.png', 
  'UrbantOfficial.png', 'zarukee.jpg', 'zeerosh.jpg'
];

interface LogoState {
  id: number;
  src: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  driftX: number;
  driftY: number;
  size: number;
  zIndex: number;
  opacity: number;
  delay: number;
}

const BrandReelGraphic: React.FC = () => {
  const WIDTH = 1080;
  const HEIGHT = 1920;
  const [logos, setLogos] = useState<LogoState[]>([]);
  const [phase, setPhase] = useState<'reveal' | 'swarm' | 'blur'>('reveal');
  const requestRef = useRef<number>();
  const timeRef = useRef<number>(0);

  // Initialize logos with orbital and depth properties
  useEffect(() => {
    const initialLogos: LogoState[] = LOGOS.map((src, index) => {
      const zIndex = Math.floor(Math.random() * 100);
      const size = 180 + (zIndex / 100) * 120; // 180 to 300 based on depth
      const orbitRadius = 150 + Math.random() * 400;
      const angle = Math.random() * Math.PI * 2;
      
      return {
        id: index,
        src: `/brand_logos/${src}`,
        x: WIDTH / 2,
        y: HEIGHT / 2,
        baseX: WIDTH / 2 + Math.cos(angle) * orbitRadius,
        baseY: HEIGHT / 2 + Math.sin(angle) * orbitRadius,
        angle,
        orbitRadius,
        orbitSpeed: (0.002 + Math.random() * 0.005) * (Math.random() > 0.5 ? 1 : -1),
        driftX: Math.random() * 200,
        driftY: Math.random() * 200,
        size,
        zIndex,
        opacity: 0.6 + (zIndex / 100) * 0.4,
        delay: Math.random() * 0.8,
      };
    });
    setLogos(initialLogos);

    const timer = setTimeout(() => {
      setPhase('swarm');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const update = (time: number) => {
    timeRef.current = time / 1000;
    const t = timeRef.current;

    if (phase === 'swarm') {
      setLogos(prev => prev.map(logo => {
        // Orbital movement
        const currentAngle = logo.angle + (t * logo.orbitSpeed);
        
        // Organic drift using sine waves
        const dx = Math.sin(t * 0.5 + logo.driftX) * 50;
        const dy = Math.cos(t * 0.4 + logo.driftY) * 80;

        const tx = WIDTH / 2 + Math.cos(currentAngle) * logo.orbitRadius + dx - logo.size / 2;
        const ty = HEIGHT / 2 + Math.sin(currentAngle) * logo.orbitRadius + dy - logo.size / 2;

        return {
          ...logo,
          x: tx,
          y: ty,
        };
      }));
    }
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [phase]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-black overflow-auto py-12">
      {/* Scaled Wrapper to fix layout space */}
      <div style={{ width: WIDTH * 0.35, height: HEIGHT * 0.35 }} className="relative mb-8">
        <div 
            style={{ width: WIDTH, height: HEIGHT }}
            className="absolute top-0 left-0 bg-[#050505] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(255,0,0,0.1)] scale-[0.35] origin-top-left"
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            
            {/* Swarming Logos */}
            <AnimatePresence>
            {logos.map((logo) => (
                <motion.div
                key={logo.id}
                initial={{ scale: 0, opacity: 0, x: WIDTH/2 - logo.size/2, y: HEIGHT/2 - logo.size/2 }}
                animate={{ 
                    scale: phase === 'blur' ? 1.5 : 1, 
                    opacity: phase === 'blur' ? 0.1 : logo.opacity,
                    filter: phase === 'blur' ? 'blur(40px)' : 'blur(0px)',
                    x: phase === 'reveal' ? WIDTH/2 - logo.size/2 : logo.x,
                    y: phase === 'reveal' ? HEIGHT/2 - logo.size/2 : logo.y,
                }}
                transition={{ 
                    type: "spring", 
                    stiffness: 40, 
                    damping: 15,
                    delay: phase === 'reveal' ? logo.delay : 0,
                    filter: { duration: 1.5 },
                    opacity: { duration: 1 }
                }}
                style={{
                    position: 'absolute',
                    width: logo.size,
                    height: logo.size,
                    zIndex: logo.zIndex,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                >
                <div className="group relative w-full h-full">
                    {/* Outer Glow Ring */}
                    <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-secondary rounded-full opacity-20 blur-md group-hover:opacity-50 transition-opacity" />
                    
                    <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden">
                        <img 
                        src={logo.src} 
                        alt="" 
                        className="w-full h-full object-cover filter grayscale-[0.1]"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    </div>
                </div>
                </motion.div>
            ))}
            </AnimatePresence>

            {/* Cinematic Text Overlay */}
            {phase === 'blur' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-[200] px-16 text-center">
                <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h2 className="text-white/60 text-3xl font-bold tracking-[0.5em] uppercase mb-8">Discover</h2>
                    <h1 className="text-white text-[140px] font-black italic tracking-tighter leading-[0.85] uppercase mb-4">
                    A Space<br/>
                    <span className="text-transparent stroke-white stroke-2" style={{ WebkitTextStroke: '3px white' }}>For Indie</span><br/>
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Brands</span>
                    </h1>
                    
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 0.5, duration: 1.5 }}
                        className="h-1 bg-gradient-to-r from-primary via-secondary to-primary mt-12"
                    />
                </motion.div>
            </div>
            )}

            {/* Vignette Overlay */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_300px_rgba(0,0,0,0.9)]" />
        </div>
      </div>

      {/* Phase Controller (Now right below the canvas) */}
      <div className="flex justify-center z-[300]">
          <button 
              onClick={() => setPhase(phase === 'blur' ? 'swarm' : 'blur')}
              className="group relative px-10 py-5 bg-white overflow-hidden rounded-full font-black text-black tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl"
          >
              <span className="relative z-10">{phase === 'blur' ? 'REPLAY SWARM' : 'REVEAL TEXT'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 translate-y-full group-hover:translate-y-0 transition-transform" />
          </button>
      </div>

      <div className="mt-8 text-gray-600 font-mono text-xs">
        TIP: Use Chrome 'Capture Node Screenshot' or OBS at 1080x1920 for best quality.
      </div>
    </div>
  );
};

export default BrandReelGraphic;
