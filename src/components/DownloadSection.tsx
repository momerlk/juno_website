import React from 'react';
import { Smartphone, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const DownloadSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="download" className="py-24 bg-gradient-to-br from-background via-background-light to-background relative overflow-hidden">
      <div className="container mx-auto">
        <div className="relative z-10">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="mb-4">
              Ready to <span className="gradient-text">Transform</span> Your Fashion Experience?
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
              Download the Juno app today and start discovering fashion that matches your unique style.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center max-w-lg mx-auto"
          >
            <a
              href="#"
              className="btn bg-neutral-800 hover:bg-neutral-700 text-white flex-1 flex items-center justify-center group"
            >
              <div className="mr-3">
                <Smartphone size={24} className="text-primary" />
              </div>
              <div className="text-left">
                <div className="text-sm">Download on the</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="btn bg-neutral-800 hover:bg-neutral-700 text-white flex-1 flex items-center justify-center group"
            >
              <div className="mr-3">
                <Download size={24} className="text-accent" />
              </div>
              <div className="text-left">
                <div className="text-sm">Get it on</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 flex justify-center"
          >
            <div className="relative max-w-xs">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 blur-3xl rounded-full"></div>
              {/* <img
                src="https://images.pexels.com/photos/4050388/pexels-photo-4050388.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Juno App Preview"
                className="relative z-10 rounded-3xl border-4 border-background-light shadow-xl"
              /> */}
              <div className="absolute -top-4 -left-4 z-20 bg-primary rounded-full px-4 py-2 shadow-lg shadow-primary/20">
                <span className="text-white font-medium text-sm">Try Juno</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Background elements */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl"></div>
      </div>
    </section>
  );
};

export default DownloadSection;