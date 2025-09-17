import React from 'react';
import { Smartphone, Download, Send, Mail, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const DownloadSection: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="download" className="section bg-background-dark section-glow">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get <span className="gradient-text">Started</span> with Juno
          </h2>
          <p className="text-lg text-neutral-400 max-w-3xl mx-auto">
            Whether you're a fashion lover ready to discover, or a brand ready to be discovered, your journey starts here.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side: Download App */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="card p-8 h-full flex flex-col justify-between"
          >
            <div>
              <h3 className="text-3xl font-bold text-white mb-4">For Fashion Lovers</h3>
              <p className="text-neutral-400 mb-8">Download the Juno app and start your personalized fashion discovery journey today.</p>
            </div>
            <div className="space-y-4">
              <a
                href="https://testflight.apple.com/join/JwJEGyUP"
                className="btn bg-neutral-800 hover:bg-neutral-700 text-white w-full text-lg py-4 group"
              >
                <Smartphone size={24} className="mr-3 text-primary" />
                <div className="text-left">
                  <div className="text-sm">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </a>
              <a
                href="https://storage.googleapis.com/juno_media/constants/juno_0.9.0.apk"
                className="btn bg-neutral-800 hover:bg-neutral-700 text-white w-full text-lg py-4 group"
              >
                <Download size={24} className="mr-3 text-accent" />
                <div className="text-left">
                  <div className="text-sm">Get it on</div>
                  <div className="text-lg font-semibold">Android</div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Right Side: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="card p-8"
          >
            <h3 className="text-3xl font-bold text-white mb-4">For Brands & Investors</h3>
            <p className="text-neutral-400 mb-6">Have questions or want to partner with us? We'd love to hear from you.</p>
            
            <div className="flex items-center mb-6">
              <Mail className="text-primary mr-3" size={20} />
              <a href="mailto:junonoww@gmail.com" className="text-neutral-300 hover:text-white">junonoww@gmail.com</a>
            </div>

            <div className="flex items-center">
              <Instagram className="text-primary mr-3" size={20} />
              <a href="https://instagram.com/junonow" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white">@junonow</a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;
