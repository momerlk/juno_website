import React from 'react';
import { Smartphone, Download, Mail, Instagram, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const DownloadSection: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="download" className="py-32 bg-black relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-secondary/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-7xl mx-auto">
          {/* Left Side: Download App */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative overflow-hidden bg-white/5 border border-white/10 rounded-[3rem] p-10 md:p-14 backdrop-blur-xl flex flex-col justify-between group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
              <Smartphone size={120} />
            </div>

            <div>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-6">For Fashion Lovers</h3>
              <p className="text-xl text-neutral-400 mb-10 max-w-md">Download the Juno app and start your personalized fashion discovery journey today.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/download"
                className="flex items-center justify-between px-6 py-4 bg-white text-black rounded-2xl hover:bg-neutral-200 transition-colors group/btn"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="text-black" size={24} />
                  <div className="text-left">
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-60">Download on</div>
                    <div className="text-lg font-bold">App Store</div>
                  </div>
                </div>
                <ArrowUpRight className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </a>
              
              <a
                href="/download"
                className="flex items-center justify-between px-6 py-4 bg-white/10 border border-white/10 text-white rounded-2xl hover:bg-white/20 transition-colors group/btn"
              >
                <div className="flex items-center gap-3">
                  <Download className="text-white" size={24} />
                  <div className="text-left">
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-60">Get it on</div>
                    <div className="text-lg font-bold">Android</div>
                  </div>
                </div>
                <ArrowUpRight className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </a>
            </div>
          </motion.div>

          {/* Right Side: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative overflow-hidden bg-gradient-to-br from-neutral-900 to-black border border-white/10 rounded-[3rem] p-10 md:p-14 flex flex-col justify-center"
          >
            <div>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-6">Partner With Us</h3>
              <p className="text-xl text-neutral-400 mb-10">Are you a brand looking to scale? Or an investor interested in the future of commerce? Let's talk.</p>
              
              <div className="space-y-6">
                <a href="mailto:junonoww@gmail.com" className="flex items-center p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Mail className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 font-medium">Email Us</p>
                    <p className="text-xl font-bold text-white">junonoww@gmail.com</p>
                  </div>
                </a>

                <a href="https://instagram.com/junonow" target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Instagram className="text-pink-500" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 font-medium">Follow Us</p>
                    <p className="text-xl font-bold text-white">@junonow</p>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;