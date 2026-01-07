import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Download, Smartphone, AlertCircle, Apple, CheckCircle, Info } from 'lucide-react';

const DownloadRedirect: React.FC = () => {
  const [os, setOs] = useState<'android' | 'ios' | 'other'>('other');
  const [countdown, setCountdown] = useState(5);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);

  const iosUrl = "https://apps.apple.com/pk/app/juno-swipe-to-shop/id6751541492";
  const androidUrl = "https://storage.googleapis.com/juno_media/constants/juno_1.0.2.apk";
  const whatsappUrl = "https://wa.me/923158972405";

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    if (/android/i.test(userAgent)) {
      setOs('android');
      setShowAndroidInstructions(true);
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setOs('ios');
      // Start countdown for iOS
      const timer = setInterval(() => {
        setCountdown(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
      
      const redirectTimeout = setTimeout(() => {
        window.location.href = iosUrl;
      }, 5000);

      return () => {
        clearInterval(timer);
        clearTimeout(redirectTimeout);
      };
    } else {
      setOs('other');
    }
  }, []);

  const handleAndroidDownload = () => {
    window.location.href = androidUrl;
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col justify-center items-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          {os === 'android' ? (
            <motion.div
              key="android"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="bg-primary/20 p-4 rounded-full">
                  <Smartphone size={40} className="text-primary" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-center mb-2">Download Juno for Android</h1>
              <p className="text-neutral-400 text-center mb-8">Follow the instructions below to install the app safely.</p>

              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-green-500 shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-green-400 text-sm mb-1">100% Safe & Secure</h3>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Juno is live and verified on the Apple App Store. This Android version is built with the same strict security standards. We are currently finalizing our Google Play Store listing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <p className="text-sm text-neutral-300">Tap the <span className="text-white font-semibold">Download APK</span> button below.</p>
                </div>
                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <p className="text-sm text-neutral-300">If prompted, allow installation from <span className="text-white font-semibold">Unknown Sources</span> (this is standard for direct downloads).</p>
                </div>
                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <p className="text-sm text-neutral-300">Open the downloaded file to install Juno.</p>
                </div>
              </div>

              <button
                onClick={handleAndroidDownload}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download APK
              </button>
              
              <div className="mt-4 text-center">
                 <p className="text-xs text-neutral-500">Version 1.0.2 • 25 MB</p>
              </div>

            </motion.div>
          ) : os === 'ios' ? (
            <motion.div
              key="ios"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="bg-white/10 p-4 rounded-full inline-block mb-6">
                <Apple size={48} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Opening App Store...</h1>
              <p className="text-neutral-400 mb-8">
                Redirecting you to the Juno page in {countdown} seconds.
              </p>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-primary animate-spin" />
              </div>
              <a 
                href={iosUrl}
                className="mt-8 inline-block text-primary hover:text-primary-light transition-colors text-sm font-medium"
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