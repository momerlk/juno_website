import QRCode from 'qrcode';

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    // Generate QR code as a data URL
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#FFFFFF',  // White foreground for dark theme
        light: '#00000000'  // Transparent background
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};