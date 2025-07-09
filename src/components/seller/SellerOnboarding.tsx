import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Building, 
  MapPin, 
  Upload, 
  CreditCard, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Loader,
  Globe,
  Phone,
  Mail,
  FileText,
  Camera,
  Map
} from 'lucide-react';
import FormStep from './FormStep';
import FormInput from './FormInput';
import { uploadFileAndGetUrl } from '../../api';

interface BusinessInfo {
  businessName: string;
  businessType: string;
  description: string;
  website: string;
  phone: string;
  email: string;
}

interface AddressInfo {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface DocumentsInfo {
  logo: File | null;
  logoUrl: string;
  banner: File | null;
  bannerUrl: string;
  cnic: File | null;
  cnicUrl: string;
  businessLicense: File | null;
  businessLicenseUrl: string;
}

interface LoadingStates {
  logo: boolean;
  banner: boolean;
  cnic: boolean;
  businessLicense: boolean;
}

const SellerOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    businessType: '',
    description: '',
    website: '',
    phone: '',
    email: ''
  });

  const [addressInfo, setAddressInfo] = useState<AddressInfo>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan'
  });

  const [documentsInfo, setDocumentsInfo] = useState<DocumentsInfo>({
    logo: null,
    logoUrl: '',
    banner: null,
    bannerUrl: '',
    cnic: null,
    cnicUrl: '',
    businessLicense: null,
    businessLicenseUrl: ''
  });

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    logo: false,
    banner: false,
    cnic: false,
    businessLicense: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const businessTypes = [
    'Fashion Brand',
    'Clothing Manufacturer',
    'Accessories Designer',
    'Textile Company',
    'Fashion Retailer',
    'Other'
  ];

  const pakistanCities = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana'
  ];

  const pakistanStates = [
    'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
    'Gilgit-Baltistan', 'Azad Kashmir', 'Islamabad Capital Territory'
  ];

  const handleFileUpload = async (file: File, type: keyof DocumentsInfo) => {
    if (!file) return;

    setLoadingStates(prev => ({ ...prev, [type]: true }));

    try {
      const url = await uploadFileAndGetUrl(file);
      setDocumentsInfo(prev => ({
        ...prev,
        [type]: file,
        [`${type}Url`]: url
      }));
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      alert(`Failed to upload ${type}. Please try again.`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  const openLocationPicker = () => {
    // Simple implementation - in a real app, you'd integrate with Google Maps
    const address = `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state}, ${addressInfo.country}`;
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(businessInfo.businessName && businessInfo.businessType && businessInfo.email);
      case 1:
        return !!(addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.postalCode);
      case 2:
        return !!(documentsInfo.logoUrl && documentsInfo.cnicUrl);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Submit to API
      console.log('Submitting onboarding data:', {
        businessInfo,
        addressInfo,
        documentsInfo
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to dashboard or success page
      window.location.href = '/seller/dashboard';
    } catch (error) {
      console.error('Onboarding submission failed:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadField: React.FC<{
    label: string;
    type: keyof DocumentsInfo;
    accept: string;
    description: string;
    icon: React.ReactNode;
  }> = ({ label, type, accept, description, icon }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-400">
        {label} {(type === 'logo' || type === 'cnic') && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, type);
          }}
          className="hidden"
          id={`file-${type}`}
          disabled={loadingStates[type]}
        />
        <label
          htmlFor={`file-${type}`}
          className={`
            flex flex-col items-center justify-center w-full h-32 
            border-2 border-dashed border-neutral-700 rounded-lg 
            cursor-pointer hover:border-primary transition-colors
            ${loadingStates[type] ? 'opacity-50 cursor-not-allowed' : ''}
            ${documentsInfo[`${type}Url` as keyof DocumentsInfo] ? 'border-green-500 bg-green-500/10' : ''}
          `}
        >
          {loadingStates[type] ? (
            <div className="flex flex-col items-center">
              <Loader className="animate-spin text-primary mb-2" size={24} />
              <span className="text-sm text-neutral-400">Uploading...</span>
              <div className="w-32 h-2 bg-neutral-700 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          ) : documentsInfo[`${type}Url` as keyof DocumentsInfo] ? (
            <div className="flex flex-col items-center text-green-500">
              <Check size={24} className="mb-2" />
              <span className="text-sm">Uploaded successfully</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-neutral-400">
              {icon}
              <span className="text-sm mt-2">Click to upload</span>
            </div>
          )}
        </label>
      </div>
      <p className="text-xs text-neutral-500">{description}</p>
    </div>
  );

  const steps = [
    {
      title: "Business Information",
      subtitle: "Tell us about your business",
      icon: <Building className="text-primary" size={32} />,
      content: (
        <div className="space-y-6">
          <FormInput
            id="businessName"
            label="Business Name"
            value={businessInfo.businessName}
            onChange={(value) => setBusinessInfo(prev => ({ ...prev, businessName: value }))}
            required
            icon={<Building size={20} />}
            placeholder="Enter your business name"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-400">
              Business Type <span className="text-red-500">*</span>
            </label>
            <select
              value={businessInfo.businessType}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessType: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Select business type</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-400">Description</label>
            <textarea
              value={businessInfo.description}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Describe your business..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="website"
              label="Website"
              value={businessInfo.website}
              onChange={(value) => setBusinessInfo(prev => ({ ...prev, website: value }))}
              icon={<Globe size={20} />}
              placeholder="https://yourwebsite.com"
            />

            <FormInput
              id="phone"
              label="Phone Number"
              value={businessInfo.phone}
              onChange={(value) => setBusinessInfo(prev => ({ ...prev, phone: value }))}
              icon={<Phone size={20} />}
              placeholder="+92 300 1234567"
            />
          </div>

          <FormInput
            id="email"
            label="Business Email"
            type="email"
            value={businessInfo.email}
            onChange={(value) => setBusinessInfo(prev => ({ ...prev, email: value }))}
            required
            icon={<Mail size={20} />}
            placeholder="business@example.com"
          />
        </div>
      )
    },
    {
      title: "Business Address",
      subtitle: "Where is your business located?",
      icon: <MapPin className="text-secondary" size={32} />,
      content: (
        <div className="space-y-6">
          <FormInput
            id="street"
            label="Street Address"
            value={addressInfo.street}
            onChange={(value) => setAddressInfo(prev => ({ ...prev, street: value }))}
            required
            icon={<MapPin size={20} />}
            placeholder="Enter street address"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-400">
                City <span className="text-red-500">*</span>
              </label>
              <select
                value={addressInfo.city}
                onChange={(e) => setAddressInfo(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select city</option>
                {pakistanCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-400">
                State/Province <span className="text-red-500">*</span>
              </label>
              <select
                value={addressInfo.state}
                onChange={(e) => setAddressInfo(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select state</option>
                {pakistanStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="postalCode"
              label="Postal Code"
              value={addressInfo.postalCode}
              onChange={(value) => setAddressInfo(prev => ({ ...prev, postalCode: value }))}
              required
              placeholder="12345"
            />

            <FormInput
              id="country"
              label="Country"
              value={addressInfo.country}
              onChange={(value) => setAddressInfo(prev => ({ ...prev, country: value }))}
              required
              placeholder="Pakistan"
            />
          </div>

          <button
            type="button"
            onClick={openLocationPicker}
            className="w-full flex items-center justify-center px-4 py-2 bg-secondary/20 border border-secondary/30 rounded-md text-secondary hover:bg-secondary/30 transition-colors"
          >
            <Map size={20} className="mr-2" />
            Verify Location on Map
          </button>
        </div>
      )
    },
    {
      title: "Documents & Media",
      subtitle: "Upload required documents and media",
      icon: <Upload className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadField
              label="Business Logo"
              type="logo"
              accept="image/*"
              description="Upload your business logo (PNG, JPG, max 5MB)"
              icon={<Camera size={24} />}
            />

            <FileUploadField
              label="Banner Image"
              type="banner"
              accept="image/*"
              description="Upload a banner for your store (PNG, JPG, max 10MB)"
              icon={<Camera size={24} />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadField
              label="CNIC/ID Document"
              type="cnic"
              accept="image/*,.pdf"
              description="Upload your CNIC or ID document (PNG, JPG, PDF, max 5MB)"
              icon={<FileText size={24} />}
            />

            <FileUploadField
              label="Business License"
              type="businessLicense"
              accept="image/*,.pdf"
              description="Upload business registration/license (PNG, JPG, PDF, max 5MB)"
              icon={<FileText size={24} />}
            />
          </div>

          <div className="bg-background-light/50 border border-neutral-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-2">Document Requirements:</h4>
            <ul className="text-sm text-neutral-400 space-y-1">
              <li>• All documents must be clear and readable</li>
              <li>• CNIC and Business License are required for verification</li>
              <li>• Logo should be high resolution for best display quality</li>
              <li>• Banner image will be displayed on your store page</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Review & Submit",
      subtitle: "Review your information before submitting",
      icon: <Check className="text-success" size={32} />,
      content: (
        <div className="space-y-6">
          <div className="bg-background-light/50 border border-neutral-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Business Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-400">Business Name:</span>
                <p className="text-white">{businessInfo.businessName}</p>
              </div>
              <div>
                <span className="text-neutral-400">Business Type:</span>
                <p className="text-white">{businessInfo.businessType}</p>
              </div>
              <div>
                <span className="text-neutral-400">Email:</span>
                <p className="text-white">{businessInfo.email}</p>
              </div>
              <div>
                <span className="text-neutral-400">Phone:</span>
                <p className="text-white">{businessInfo.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="bg-background-light/50 border border-neutral-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Address</h4>
            <p className="text-white text-sm">
              {addressInfo.street}, {addressInfo.city}, {addressInfo.state} {addressInfo.postalCode}, {addressInfo.country}
            </p>
          </div>

          <div className="bg-background-light/50 border border-neutral-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Documents Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                {documentsInfo.logoUrl ? (
                  <Check className="text-green-500 mr-2" size={16} />
                ) : (
                  <div className="w-4 h-4 border border-neutral-500 rounded mr-2"></div>
                )}
                <span className={documentsInfo.logoUrl ? 'text-green-500' : 'text-neutral-400'}>
                  Business Logo
                </span>
              </div>
              <div className="flex items-center">
                {documentsInfo.cnicUrl ? (
                  <Check className="text-green-500 mr-2" size={16} />
                ) : (
                  <div className="w-4 h-4 border border-neutral-500 rounded mr-2"></div>
                )}
                <span className={documentsInfo.cnicUrl ? 'text-green-500' : 'text-neutral-400'}>
                  CNIC Document
                </span>
              </div>
              <div className="flex items-center">
                {documentsInfo.bannerUrl ? (
                  <Check className="text-green-500 mr-2" size={16} />
                ) : (
                  <div className="w-4 h-4 border border-neutral-500 rounded mr-2"></div>
                )}
                <span className={documentsInfo.bannerUrl ? 'text-green-500' : 'text-neutral-400'}>
                  Banner Image
                </span>
              </div>
              <div className="flex items-center">
                {documentsInfo.businessLicenseUrl ? (
                  <Check className="text-green-500 mr-2" size={16} />
                ) : (
                  <div className="w-4 h-4 border border-neutral-500 rounded mr-2"></div>
                )}
                <span className={documentsInfo.businessLicenseUrl ? 'text-green-500' : 'text-neutral-400'}>
                  Business License
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background-light py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Seller Onboarding</h1>
            <span className="text-sm text-neutral-400">Step {currentStep + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-background rounded-lg p-8 mb-8">
          <AnimatePresence mode="wait">
            <FormStep
              key={currentStep}
              title={steps[currentStep].title}
              subtitle={steps[currentStep].subtitle}
              icon={steps[currentStep].icon}
            >
              {steps[currentStep].content}
            </FormStep>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center px-6 py-3 bg-neutral-700 text-white rounded-md hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={20} className="mr-2" />
            Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="flex items-center px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight size={20} className="ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!validateStep(currentStep) || isSubmitting}
              className="flex items-center px-6 py-3 bg-success text-white rounded-md hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin mr-2" size={20} />
                  Submitting...
                </>
              ) : (
                <>
                  <Check size={20} className="mr-2" />
                  Complete Onboarding
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;