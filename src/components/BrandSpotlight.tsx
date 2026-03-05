import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Mic, Play, Star } from 'lucide-react';

const BrandSpotlight: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="brand-spotlight" className="py-16 bg-black relative overflow-hidden border-b border-white/5">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Star className="w-4 h-4 text-primary mr-2 fill-primary" />
            <span className="text-sm font-bold text-neutral-300 tracking-wider uppercase">Brand Spotlight</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Aqs <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic py-2 px-3">Attire</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Video Container - Vertical 9:16 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative group aspect-[9/16] w-full max-w-[450px] mx-auto lg:mx-0 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shadow-primary/10"
          >
            <video
              src="/aqs_attire.mp4"
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              controls
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
                  <img src="/aqs_attire_logo.jpg" alt="Aqs Attire Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-white font-black text-lg tracking-tight uppercase">Harib Ahsan</p>
                  <p className="text-primary font-bold text-xs uppercase tracking-widest">Founder, Aqs Attire</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Container */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight flex items-center gap-4">
                <Mic className="text-primary" size={32} />
                The Juno Podcast
              </h3>
              <p className="text-xl md:text-2xl text-neutral-400 font-light italic leading-relaxed mb-8">
                "We sat down with Harib Ahsan, the visionary behind Aqs Attire, for a candid conversation about building a streetwear empire in Pakistan."
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-8 h-[2px] bg-primary" />
                Inside the Episode
              </h4>
              <ul className="space-y-4">
                {[
                  "The origins of Aqs Attire and the streetwear shift.",
                  "Fabric quality and the pursuit of the perfect hoodie.",
                  "Personal journey from Aitchison to entrepreneurship."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 group">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                    <span className="text-neutral-300 text-lg md:text-xl font-light italic group-hover:text-white transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4">
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-white/10 p-8 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Play size={80} className="text-white" />
                </div>
                <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tight italic">Quality First Streetwear</h4>
                <p className="text-neutral-300 text-lg leading-relaxed mb-6 font-light italic">
                  Aqs Attire has redefined local streetwear with high-quality embroidery and premium fabrics, leading to every single collection selling out within minutes.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest">High Quality Fabric</span>
                  <span className="px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest border border-white/10">Sold Out Drops</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BrandSpotlight;
