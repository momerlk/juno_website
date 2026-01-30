import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Apple } from 'lucide-react';
import { trackDownloadVisit } from '../api/chapterApi';

const DownloadRedirect: React.FC = () => {
  const [os, setOs] = useState<'android' | 'ios' | 'other'>('other');
  const [countdown, setCountdown] = useState(3);

  const iosUrl = "https://apps.apple.com/pk/app/juno-swipe-to-shop/id6751541492";
  const androidUrl = "https://play.google.com/store/apps/details?id=com.junonow.app";
  const whatsappUrl = "https://wa.me/923158972405";

  useEffect(() => {
    const trackVisit = async () => {
      const hasVisited = localStorage.getItem('hasVisitedDownloadPage');
      if (!hasVisited) {
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          if (!ipResponse.ok) return;
          const ipData = await ipResponse.json();
          
          const userAgent = navigator.userAgent || navigator.vendor;
          let currentOs = 'other';
          if (/android/i.test(userAgent)) currentOs = 'android';
          else if (/iPad|iPhone|iPod/.test(userAgent)) currentOs = 'ios';

          await trackDownloadVisit(ipData.ip, currentOs);
          localStorage.setItem('hasVisitedDownloadPage', 'true');
        } catch (e) {
          console.error("Tracking error:", e);
        }
      }
    };
    trackVisit();
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    let targetOs: 'android' | 'ios' | 'other' = 'other';

    if (/android/i.test(userAgent)) {
      targetOs = 'android';
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
      targetOs = 'ios';
    }

    setOs(targetOs);

    if (targetOs !== 'other') {
      const redirectUrl = targetOs === 'ios' ? iosUrl : androidUrl;
      
      const timer = setInterval(() => {
        setCountdown(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
      
      const redirectTimeout = setTimeout(() => {
        window.location.href = redirectUrl;
      }, 3000);

      return () => {
        clearInterval(timer);
        clearTimeout(redirectTimeout);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col justify-center items-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          {os !== 'other' ? (
            <motion.div
              key="redirecting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="bg-white/10 p-4 rounded-full inline-block mb-6">
                {os === 'ios' ? <Apple size={48} className="text-white" /> : <Smartphone size={48} className="text-primary" />}
              </div>
              <h1 className="text-3xl font-bold mb-4">Opening {os === 'ios' ? 'App Store' : 'Play Store'}...</h1>
              <p className="text-neutral-400 mb-8">
                Redirecting you to Juno in {countdown} seconds.
              </p>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-primary animate-spin" />
              </div>
              <a 
                href={os === 'ios' ? iosUrl : androidUrl}
                className="mt-8 inline-block text-primary hover:text-primary-light transition-colors text-sm font-medium underline"
              >
                Click here if you aren't redirected automatically
              </a>
            </motion.div>
          ) : (
            <motion.div
              key="other"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
            >
              <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Get Juno</h1>
              <p className="text-neutral-400 mb-8 text-lg">
                Swipe to shop the latest fashion trends. Available on iOS and Android.
              </p>

              <div className="grid gap-4">
                <a 
                  href={iosUrl}
                  className="flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  <Apple size={24} />
                  Download for iOS
                </a>
                <a 
                  href={androidUrl}
                  className="flex items-center justify-center gap-3 bg-white/10 text-white font-bold py-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors"
                >
                  <Smartphone size={24} />
                  Download for Android
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-neutral-500 text-sm">
            Having trouble? <a href={whatsappUrl} className="text-primary hover:underline">Contact Support</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DownloadRedirect;