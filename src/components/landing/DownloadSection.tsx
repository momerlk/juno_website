import React from 'react';
import { Smartphone, Download, ArrowUpRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const DownloadSection: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="download" className="py-32 bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-secondary/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Join the Movement</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Be part of what's{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">
              happening.
            </span>
          </h2>

          <p className="text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Discover original Pakistani labels, follow their stories, and be first when new drops land.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <motion.a
              href="/download"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-between px-8 py-5 bg-white text-black rounded-2xl hover:bg-neutral-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="text-black" size={24} />
                <div className="text-left">
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-60">Download on</div>
                  <div className="text-lg font-bold">App Store</div>
                </div>
              </div>
              <ArrowUpRight className="ml-6 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>

            <motion.a
              href="/download"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-between px-8 py-5 bg-white/10 border border-white/10 text-white rounded-2xl hover:bg-white/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Download className="text-white" size={24} />
                <div className="text-left">
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-60">Get it on</div>
                  <div className="text-lg font-bold">Android</div>
                </div>
              </div>
              <ArrowUpRight className="ml-6 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          </div>

          <motion.a
            href="/studio"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors text-sm font-medium group"
          >
            Own an indie label?{' '}
            <span className="text-neutral-400 group-hover:text-white transition-colors font-bold">
              Join Juno Studio
            </span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default DownloadSection;
