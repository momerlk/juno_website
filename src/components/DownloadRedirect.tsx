import React, { useEffect } from 'react';

const DownloadRedirect: React.FC = () => {
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    const iosUrl = 'https://apps.apple.com/pk/app/juno-swipe-to-shop/id6751541492';
    const androidUrl = 'https://storage.googleapis.com/juno_media/constants/juno_1.0.0.apk';
    const fallbackUrl = '/download';

    if (/android/i.test(userAgent)) {
      window.location.href = androidUrl;
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      window.location.href = iosUrl;
    } else {
      window.location.href = fallbackUrl;
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', // vertical centering
        alignItems: 'center',     // horizontal centering
        textAlign: 'center',
        backgroundColor: '#0A0A0A',
        color: 'white',
        minHeight: '100vh',
        padding: '20px',          // smaller, responsive padding
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
        Redirecting to the app store...
      </h1>
      <p style={{ marginBottom: '30px', fontSize: '1rem' }}>
        If you are not redirected automatically, please use the links below:
      </p>
      <div>
        <a
          href="https://apps.apple.com/pk/app/juno-swipe-to-shop/id6751541492"
          style={{ color: '#FF1818', marginRight: '20px', fontSize: '1rem' }}
        >
          iOS App
        </a>
        <a
          href="https://storage.googleapis.com/juno_media/constants/juno_1.0.0.apk"
          style={{ color: '#FF1818', fontSize: '1rem' }}
        >
          Android App
        </a>
      </div>
    </div>
  );
};

export default DownloadRedirect;
