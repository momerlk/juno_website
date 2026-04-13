import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Apple, Smartphone } from 'lucide-react';
import { trackDownloadVisit } from '../api/chapterApi';

const DownloadRedirect: React.FC = () => {
  const [os, setOs] = useState<'android' | 'ios' | 'other'>('other');
  const [countdown, setCountdown] = useState(3);

  const iosUrl = 'https://apps.apple.com/pk/app/juno-swipe-to-shop/id6751541492';
  const androidUrl = 'https://play.google.com/store/apps/details?id=com.junonow.app';
  const whatsappUrl = 'https://wa.me/923158972405';

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
          console.error('Tracking error:', e);
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
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
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

  const storeUrl = os === 'ios' ? iosUrl : androidUrl;
  const storeName = os === 'ios' ? 'App Store' : 'Play Store';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,59,92,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,122,89,0.14),transparent_30%)]" />

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {os !== 'other' ? (
            <motion.div
              key="redirecting"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-[28px] border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl backdrop-blur-xl"
            >
              <img
                src="/juno_logos/icon+text_white.png"
                alt="Juno"
                className="mx-auto mb-8 h-9 w-auto"
              />

              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-secondary">
                {os === 'ios' ? <Apple size={30} className="text-white" /> : <Smartphone size={30} className="text-white" />}
              </div>

              <p className="mb-3 text-xs uppercase tracking-[0.28em] text-white/45">
                Redirecting
              </p>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Opening {storeName}
              </h1>
              <p className="mt-4 text-base leading-7 text-white/65">
                Taking you to Juno in {countdown} second{countdown === 1 ? '' : 's'}.
              </p>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                />
              </div>

              <a
                href={storeUrl}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-neutral-100"
              >
                Open manually
              </a>
            </motion.div>
          ) : (
            <motion.div
              key="other"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-[28px] border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-xl"
            >
              <img
                src="/juno_logos/icon+text_white.png"
                alt="Juno"
                className="mb-8 h-9 w-auto"
              />

              <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                Download the app
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
                Get Juno
              </h1>
              <p className="mt-4 max-w-sm text-base leading-7 text-white/65">
                Discover Pakistan&apos;s indie brands on iOS and Android.
              </p>

              <div className="mt-8 grid gap-3">
                <a
                  href={iosUrl}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 font-bold text-black transition-colors hover:bg-neutral-100"
                >
                  <img
                    src="/apple_logo.png"
                    alt="Apple"
                    className="h-5 w-5 object-contain"
                  />
                  Download for iOS
                </a>
                <a
                  href={androidUrl}
                  className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-bold text-white transition-colors hover:bg-white/10"
                >
                  <img
                    src="/play_store.png"
                    alt="Google Play"
                    className="h-5 w-5 object-contain"
                  />
                  Download for Android
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-sm text-white/45">
          Having trouble?{' '}
          <a href={whatsappUrl} className="font-medium text-primary transition-colors hover:text-secondary">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default DownloadRedirect;
