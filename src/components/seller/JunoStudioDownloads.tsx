import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Apple } from 'lucide-react';

const JunoStudioDownloads: React.FC = () => {
  const iosUrl = 'https://apps.apple.com/app/juno-studio'; // Placeholder URL
  const androidUrl = 'https://play.google.com/store/apps/details?id=com.juno.studio'; // Placeholder URL

  const qrCodeApiBase = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=1c1c1c&color=ffffff&data=';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-background rounded-lg p-6 mt-6"
    >
      <div className="flex items-center mb-6">
        <Smartphone size={24} className="text-primary mr-3" />
        <h2 className="text-xl font-semibold text-white">Download Juno Studio</h2>
      </div>
      <p className="text-neutral-400 mb-8 text-center">
        Scan the QR codes below to download the Juno Studio app for your device. Use the app to manage your store on the go.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* iOS Card */}
        <div className="flex flex-col items-center bg-background-light p-6 rounded-lg">
          <div className="flex items-center text-white mb-4">
            <h3 className="text-2xl font-semibold">iOS</h3>
          </div>
          <div className="p-2 bg-white rounded-lg">
            <img
              src={`${qrCodeApiBase}${encodeURIComponent(iosUrl)}`}
              alt="Juno Studio iOS App QR Code"
              width="200"
              height="200"
            />
          </div>
          <p className="text-neutral-500 mt-4 text-sm">Scan for iPhone</p>
        </div>

        {/* Android Card */}
        <div className="flex flex-col items-center bg-background-light p-6 rounded-lg">
          <div className="flex items-center text-white mb-4">
           
            <h3 className="text-2xl font-semibold">Android</h3>
          </div>
           <div className="p-2 bg-white rounded-lg">
            <img
              src={`${qrCodeApiBase}${encodeURIComponent(androidUrl)}`}
              alt="Juno Studio Android App QR Code"
              width="200"
              height="200"
            />
          </div>
          <p className="text-neutral-500 mt-4 text-sm">Scan for Android</p>
        </div>
      </div>
    </motion.div>
  );
};

export default JunoStudioDownloads;
