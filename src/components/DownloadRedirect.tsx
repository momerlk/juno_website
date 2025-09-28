import React, { useState, useEffect } from 'react';

const DownloadRedirect: React.FC = () => {
  const [countdown, setCountdown] = useState(15);
  const iosUrl = "https://apps.apple.com/pk/app/juno-swipe-to-shop/id6751541492";
  const androidUrl = "https://storage.googleapis.com/juno_media/constants/juno_1.0.2.apk";
  const whatsappUrl = "https://wa.me/923158972405";

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    let targetUrl = '';

    if (/android/i.test(userAgent)) {
      targetUrl = androidUrl;
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      targetUrl = iosUrl;
    }

    if (targetUrl) {
      const timer = setInterval(() => {
        setCountdown(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);

      const redirectTimeout = setTimeout(() => {
        window.location.href = targetUrl;
      }, 15000);

      return () => {
        clearInterval(timer);
        clearTimeout(redirectTimeout);
      };
    } else {
      setCountdown(0); 
      alert("Could not detect your operating system. Please choose your download manually.");
    }
  }, []);

  return (
    <>
      <style>{`
        .download-redirect-container {
            background-image: url('/doodle.png');
            background-color: #121212;
            background-blend-mode: overlay;
            background-size: cover;
            background-position: center;
        }
        @media (orientation: landscape) {
            .download-redirect-container {
                background-image: url('/doodle_landscape.png');
            }
        }
        .onboarding-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 3.5rem; /* 56px */
            background-color: #FF2D55;
            border-radius: 9999px;
            font-weight: bold;
            color: white;
            font-size: 1.125rem; /* 18px */
            transition: background-color 0.3s;
            text-decoration: none;
        }
        .onboarding-button:hover {
            background-color: #D9264A; /* Darker red for hover */
        }
      `}</style>
      <div
        className="download-redirect-container min-h-screen text-white flex flex-col items-center justify-center p-4 text-center"
      >
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Nova-Bold', sans-serif" }}>Download juno!</h1>
          
          <p className="text-[#AEAEB2] mb-6 text-lg">
            Due to a huge surge in demand, our app might be a little buggy. We're working hard to fix things!
            {countdown > 0 && ` Redirecting you in ${countdown}s...`}
          </p>

          <div className="flex space-x-4 mb-8">
            <a href={iosUrl} className="onboarding-button" style={{ fontFamily: "'Nova-Bold', sans-serif" }}>
              iOS
            </a>
            <a href={androidUrl} className="onboarding-button" style={{ fontFamily: "'Nova-Bold', sans-serif" }}>
              Android
            </a>
          </div>

          <p className="text-lg text-neutral-400 mt-8">
            Having trouble? Contact us on WhatsApp:
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-bold ml-2 hover:underline">
              +92 315 8972405
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default DownloadRedirect;
