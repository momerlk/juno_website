import React, { useEffect } from 'react';

const DownloadRedirect: React.FC = () => {
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    const iosUrl = 'https://apps.apple.com/pk/app/juno-swipe-to-shop/id6751541492';
    const androidUrl = 'https://storage.googleapis.com/juno_media/constants/juno_1.0.0.apk';
    const fallbackUrl = '/download'; // Redirect to homepage if OS is not detected

    if (/android/i.test(userAgent)) {
      window.location.href = androidUrl;
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      window.location.href = iosUrl;
    } else {
      window.location.href = fallbackUrl;
    }
  }, []);

  return (
    <div style={{ paddingTop : '120px', padding: '40px', textAlign: 'center', backgroundColor: '#0A0A0A', color: 'white', minHeight: '100vh' }}>
      <h1 >Redirecting to the app store...</h1>
      <p style={{marginTop : "50px"}}>If you are not redirected automatically, please use the links below:</p>
      <div style={{ marginTop: '20px' }}>
        <a href="https://apps.apple.com/pk/app/juno-swipe-to-shop/id6751541492" style={{ color: '#FF1818', marginRight: '20px' }}>iOS App</a>
        <a href="https://storage.googleapis.com/juno_media/constants/juno_1.0.0.apk" style={{ color: '#FF1818' }}>Android App</a>
      </div>
    </div>
  );
};

export default DownloadRedirect;
