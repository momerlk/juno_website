import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { Upload, MapPin, Building2, CreditCard, Truck, FileText, Tags, CheckCircle, Mail } from 'lucide-react';
import FormInput from './FormInput';
import FormStep from './FormStep';

interface FormData {
  // Login Credentials
  email: string;
  password: string;

  // Business Information
  businessName: string;
  legalName: string;
  description: string;
  shortDescription: string;

  // Brand Identity
  logo: File | null;
  banner: File | null;
  mobileBanner: File | null;

  // Contact Information
  contact: {
    contactPersonName: string;
    email: string;
    supportEmail: string;
    phoneNumber: string;
    alternatePhoneNumber: string;
    whatsapp: string;
    businessHours: string;
  };

  // Store Location
  location: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    neighborhood: string;
    storeDirections: string;
    pickupAvailable: boolean;
    pickupHours: string;
  };

  // Business Profile
  businessDetails: {
    businessType: string;
    foundedYear: number;
    numberOfEmployees: string;
    businessCategory: string;
    businessSubcategory: string;
    registrationNumber: string;
    ntnNumber: string;
    salesTaxNumber: string;
  };

  // KYC Documents
  kycDocuments: {
    cnicFront: File | null;
    cnicBack: File | null;
    businessCertificate: File | null;
    taxCertificate: File | null;
    utilityBill: File | null;
    storeImages: File[];
  };

  // Bank Account Details
  bankDetails: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    branchCode: string;
    branchAddress: string;
    swiftCode: string;
    paymentMethod: string;
    paymentSchedule: string;
    paymentThreshold: number;
  };

  // Shipping Settings
  shippingSettings: {
    defaultHandlingTime: number;
    freeShippingThreshold: number;
    platformShipping: boolean;
    selfShipping: boolean;
    shippingCutoffTime: string;
    shippingProfiles: Array<{
      profileName: string;
      regions: string[];
      shippingRates: Array<{
        deliveryMethod: string;
        estimatedDays: number;
        rate: number;
      }>;
    }>;
  };

  // Return Policy
  returnPolicy: string;

  // Store Categories & Tags
  categories: string[];
  tags: string[];

  // Commission Settings
  commissionSettings: {
    commissionRate: number;
    commissionType: string;
  };

  // Status
  status: string;
  verified: boolean;
}

const initialFormData: FormData = {
  email: '',
  password: '',
  businessName: '',
  legalName: '',
  description: '',
  shortDescription: '',
  logo: null,
  banner: null,
  mobileBanner: null,
  contact: {
    contactPersonName: '',
    email: '',
    supportEmail: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    whatsapp: '',
    businessHours: ''
  },
  location: {
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    latitude: 0,
    longitude: 0,
    neighborhood: '',
    storeDirections: '',
    pickupAvailable: false,
    pickupHours: ''
  },
  businessDetails: {
    businessType: '',
    foundedYear: new Date().getFullYear(),
    numberOfEmployees: '',
    businessCategory: '',
    businessSubcategory: '',
    registrationNumber: '',
    ntnNumber: '',
    salesTaxNumber: ''
  },
  kycDocuments: {
    cnicFront: null,
    cnicBack: null,
    businessCertificate: null,
    taxCertificate: null,
    utilityBill: null,
    storeImages: []
  },
  bankDetails: {
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    branchCode: '',
    branchAddress: '',
    swiftCode: '',
    paymentMethod: '',
    paymentSchedule: '',
    paymentThreshold: 0
  },
  shippingSettings: {
    defaultHandlingTime: 1,
    freeShippingThreshold: 0,
    platformShipping: true,
    selfShipping: false,
    shippingCutoffTime: '',
    shippingProfiles: []
  },
  returnPolicy: '',
  categories: [],
  tags: [],
  commissionSettings: {
    commissionRate: 0,
    commissionType: 'percentage'
  },
  status: 'pending',
  verified: false
};

const SellerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { seller } = useSellerAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const totalSteps = 8;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      
      const resp = await fetch('http://localhost:8080/api/v1/seller/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!resp.ok) {
        throw new Error('Registration failed');
      }

      if (resp.ok || resp.status === 201) {
        alert('Registration successful. Please check your email for verification.');
        navigate('/seller/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register. Please try again.');
    }
  };

  

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Welcome to Juno Seller Center!</h2>
            <p className="text-neutral-400 mb-8">Let's set up your store in a few easy steps.</p>
            <button
              onClick={handleNext}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Get Started
            </button>
          </motion.div>
        );
      case 1:
        return (
          <FormStep
            title="Login Credentials"
            subtitle="Create your login credentials"
            icon={<Mail size={32} className="text-primary" />}
          >
            <FormInput
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              required
              placeholder="Enter your email address"
            />
            <FormInput
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              required
              placeholder="Choose a strong password"
            />
          </FormStep>
        );
      case 2:
        return (
          <FormStep
            title="Business Details"
            subtitle="Tell us about your business"
            icon={<Building2 size={32} className="text-primary" />}
          >
            <FormInput
              id="businessName"
              label="Business Name"
              value={formData.businessName}
              onChange={(value) => setFormData({ ...formData, businessName: value })}
              required
              placeholder="Your business name"
            />
            <FormInput
              id="legalName"
              label="Your Legal Name"
              value={formData.legalName}
              onChange={(value) => setFormData({ ...formData, legalName: value })}
              required
              placeholder="Legal registered name of the person onboarding"
            />
            <FormInput
              id="shortDescription"
              label="Short Description"
              value={formData.shortDescription}
              onChange={(value) => setFormData({ ...formData, shortDescription: value })}
              required
              maxLength={80}
              placeholder="Brief description of your business"
            />
            <div className="space-y-1">
              <label htmlFor="fullDescription" className="block text-sm font-medium text-neutral-400">
                Full Description<span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="fullDescription"
                value={formData.description}
                onChange={(e) => {
                  formData.description = e.target.value;

                  setFormData({ ...formData });
                }}
                rows={4}
                className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Detailed description of your business"
                required
              />
            </div>
          </FormStep>
        );
      case 3:
        return (
          <FormStep
            title="Upload Your Logo and Banner"
            subtitle="Add your brand identity"
            icon={<Upload size={32} className="text-primary" />}
          >
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-400">
                  Logo Upload<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-4 py-6 bg-background rounded-lg border-2 border-dashed border-neutral-700 cursor-pointer hover:border-primary">
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">
                      {formData.logo ? formData.logo.name : 'Choose a logo'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData({ ...formData, logo: file });
                      }}
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-400">
                  LandScape Banner Upload<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-4 py-6 bg-background rounded-lg border-2 border-dashed border-neutral-700 cursor-pointer hover:border-primary">
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">
                      {formData.banner ? formData.banner.name : 'Choose a banner'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData({ ...formData, banner: file });
                      }}
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-400">
                  Portrait Banner Upload 3:4 aspect ratio (not phone size) <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-4 py-6 bg-background rounded-lg border-2 border-dashed border-neutral-700 cursor-pointer hover:border-primary">
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">
                      {formData.mobileBanner ? formData.mobileBanner.name : 'Choose a mobile banner'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData({ ...formData, mobileBanner: file });
                      }}
                      required
                    />
                  </label>
                </div>
              </div>

              <p className="text-sm text-neutral-400 text-center">
                Use high-quality images for better visibility
              </p>
            </div>
          </FormStep>
        );
      case 4:
        return (
          <FormStep
            title="Contact Details"
            subtitle="How can customers reach you?"
            icon={<Mail size={32} className="text-primary" />}
          >
            <FormInput
              id="contactPersonName"
              label="Contact Person Name"
              value={formData.contact.contactPersonName}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, contactPersonName: value }
              })}
              required
              placeholder="Full name of contact person"
            />

            <FormInput
              id="businessEmail"
              label="Business Email"
              type="email"
              value={formData.contact.email}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, email: value }
              })}
              required
              placeholder="your@business.com"
            />

            <FormInput
              id="supportEmail"
              label="Support Email (Optional)"
              type="email"
              value={formData.contact.supportEmail}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, supportEmail: value }
              })}
              placeholder="support@business.com"
            />

            <FormInput
              id="phoneNumber"
              label="Phone Number"
              type="tel"
              value={formData.contact.phoneNumber}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, phoneNumber: value }
              })}
              required
              placeholder="+92 XXX XXXXXXX"
            />

            <FormInput
              id="alternatePhone"
              label="Alternate Phone Number (Optional)"
              type="tel"
              value={formData.contact.alternatePhoneNumber}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, alternatePhoneNumber: value }
              })}
              placeholder="+92 XXX XXXXXXX"
            />

            <FormInput
              id="whatsappNumber"
              label="WhatsApp Number (Optional)"
              type="tel"
              value={formData.contact.whatsapp}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, whatsapp: value }
              })}
              placeholder="+92 XXX XXXXXXX"
            />

            <FormInput
              id="businessHours"
              label="Business Hours"
              value={formData.contact.businessHours}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, businessHours: value }
              })}
              required
              placeholder="Mon-Sat, 10AM - 6PM"
            />
          </FormStep>
        );
      case 5:
        return (
          <FormStep
            title="Store Location"
            subtitle="Where is your business located?"
            icon={<MapPin size={32} className="text-primary" />}
          >
            <FormInput
              id="address"
              label="Address"
              value={formData.location.address}
              onChange={(value) => setFormData({
                ...formData,
                location: { ...formData.location, address: value }
              })}
              required
              placeholder="Street address"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="city"
                label="City"
                value={formData.location.city}
                onChange={(value) => setFormData({
                  ...formData,
                  location: { ...formData.location, city: value }
                })}
                required
                placeholder="City"
              />

              <FormInput
                id="state"
                label="State"
                value={formData.location.state}
                onChange={(value) => setFormData({
                  ...formData,
                  location: { ...formData.location, state: value }
                })}
                required
                placeholder="State"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="postalCode"
                label="Postal Code"
                type="number"
                value={formData.location.postalCode}
                onChange={(value) => setFormData({
                  ...formData,
                  location: { ...formData.location, postalCode: value }
                })}
                required
                placeholder="Postal code"
              />

              <FormInput
                id="country"
                label="Country"
                value={formData.location.country}
                onChange={(value) => setFormData({
                  ...formData,
                  location: { ...formData.location, country: value }
                })}
                required
                // disabled
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="latitude"
                label="Latitude (Optional)"
                value={formData.location.latitude as unknown as string}
                onChange={(value) => setFormData({
                  ...formData,
                  location: { ...formData.location, latitude: parseFloat(value) || 0 }
                })}
                placeholder="e.g. 31.5204"
              />

              <FormInput
                id="longitude"
                label="Longitude (Optional)"
                value={formData.location.longitude as unknown as string}
                onChange={(value) => setFormData({
                  ...formData,
                  location: { ...formData.location, longitude: parseFloat(value) || 0 }
                })}
                placeholder="e.g. 74.3587"
              />
            </div>

            <FormInput
              id="neighborhood"
              label="Neighborhood (Optional)"
              value={formData.location.neighborhood}
              onChange={(value) => setFormData({
                ...formData,
                location: { ...formData.location, neighborhood: value }
              })}
              placeholder="Area or neighborhood name"
            />

            <FormInput
              id="storeDirections"
              label="Store Directions (Optional)"
              value={formData.location.storeDirections}
              onChange={(value) => setFormData({
                ...formData,
                location: { ...formData.location, storeDirections: value }
              })}
              placeholder="Landmarks or directions to find your store"
            />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pickupAvailable"
                  checked={formData.location.pickupAvailable}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, pickupAvailable: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary bg-background border-neutral-700 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="pickupAvailable" className="text-sm text-neutral-400">
                  Pickup Available?
                </label>
              </div>

              {formData.location.pickupAvailable && (
                <FormInput
                  id="pickupHours"
                  label="Pickup Hours"
                  value={formData.location.pickupHours}
                  onChange={(value) => setFormData({
                    ...formData,
                    location: { ...formData.location, pickupHours: value }
                  })}
                  required
                  placeholder="e.g. Same as business hours"
                />
              )}
            </div>
          </FormStep>
        );
      case 6:
        return (
          <FormStep
            title="Business Profile"
            subtitle="Tell us more about your business type"
            icon={<Building2 size={32} className="text-primary" />}
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="businessType" className="block text-sm font-medium text-neutral-400">
                  Business Type<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="businessType"
                  value={formData.businessDetails.businessType}
                  onChange={(e) => {
                    formData.businessDetails.businessType = e.target.value;
                    setFormData({ ...formData });
                  }}
                  className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select business type</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <FormInput
                id="foundedYear"
                label="Founded Year"
                type="number"
                value={formData.businessDetails.foundedYear as unknown as string}
                onChange={(value) => {
                  formData.businessDetails.foundedYear = parseInt(value) || 0;
                  setFormData({ ...formData });
                }}
                required
                placeholder="e.g. 2020"
              />

              <div className="space-y-1">
                <label htmlFor="employeeCount" className="block text-sm font-medium text-neutral-400">
                  Number of Employees<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="employeeCount"
                  value={formData.businessDetails.numberOfEmployees}
                  onChange={(e) => {
                    formData.businessDetails.numberOfEmployees = e.target.value;
                    setFormData({ ...formData });
                  }}
                  className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select employee count</option>
                  <option value="1-5">1-5</option>
                  <option value="6-10">6-10</option>
                  <option value="11-20">11-20</option>
                  <option value="21-50">21-50</option>
                  <option value="51-100">51-100</option>
                  <option value="100+">100+</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="businessCategory" className="block text-sm font-medium text-neutral-400">
                  Business Category<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="businessCategory"
                  value={formData.businessDetails.businessCategory}
                  onChange={(e) => {
                    formData.businessDetails.businessCategory = e.target.value;
                    setFormData({ ...formData });
                  }}
                  className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select business category</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                  <option value="Bags & Luggage">Bags & Luggage</option>
                  <option value="Kids & Babies">Kids & Babies</option>
                  <option value="Handmade & Crafts">Handmade & Crafts</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Sports & Outdoors">Sports & Outdoors</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <FormInput
                id="subcategory"
                label="Subcategory"
                value={formData.businessDetails.businessSubcategory}
                onChange={(value) => {
                  formData.businessDetails.businessSubcategory = value;
                  setFormData({ ...formData });
                }}
                required
                placeholder="e.g. Women's Clothing, Smartphones"
              />
            </div>
          </FormStep>
        );
      case 7:
        return (
          <FormStep
            title="Verify Your Identity"
            subtitle="We verify all sellers to maintain trust and security"
            icon={<FileText size={32} className="text-primary" />}
          >
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-400">
                  Upload CNIC Front<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-4 py-6 bg-background rounded-lg border-2 border-dashed border-neutral-700 cursor-pointer hover:border-primary">
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">
                      {formData.kycDocuments.cnicFront ? formData.kycDocuments.cnicFront.name : 'Upload CNIC front'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) formData.kycDocuments.cnicFront = file;

                        setFormData({ ...formData });
                      }}
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-400">
                  Upload CNIC Back<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-4 py-6 bg-background rounded-lg border-2 border-dashed border-neutral-700 cursor-pointer hover:border-primary">
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">
                      {formData.kycDocuments.cnicBack ? formData.kycDocuments.cnicBack.name : 'Upload CNIC back'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) formData.kycDocuments.cnicBack = file;
                        setFormData({ ...formData });
                      }}
                      required
                    />
                  </label>
                </div>
              </div>

              <p className="text-sm text-neutral-400 text-center">
                Please ensure your CNIC images are clear and all details are visible
              </p>
            </div>
          </FormStep>
        );

      case 8:
        return (
          <FormStep
            title="Shipping Settings"
            subtitle="Set up your delivery options"
            icon={<Truck size={32} className="text-primary" />}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-400">
                  Shipping Type<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="self"
                      checked={formData.shippingSettings.selfShipping === true}
                      onChange={_ => {
                        formData.shippingSettings.selfShipping = true;
                        formData.shippingSettings.platformShipping = false;
                        setFormData({...formData, shippingSettings: {...formData.shippingSettings } });
                      }}
                      className="form-radio text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-white">Self-shipping</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="platform"
                      checked={formData.shippingSettings.platformShipping}
                      onChange={_ => {
                        formData.shippingSettings.selfShipping = false;
                        formData.shippingSettings.platformShipping = true;
                        setFormData({...formData, shippingSettings: {...formData.shippingSettings } });
                      }}
                      className="form-radio text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-white">Platform Shipping</span>
                  </label>
                </div>
              </div>

              {formData.shippingSettings.selfShipping === true && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-400">
                      Shipping Profiles
                    </label>
                    {formData.shippingSettings.shippingProfiles.map((profile, index) => (
                      <div key={index} className="p-4 bg-background-light rounded-lg space-y-4">
                        <FormInput
                          id={`profile-name-${index}`}
                          label="Profile Name"
                          value={profile.profileName}
                          onChange={(value) => {
                            const newProfiles = [...formData.shippingSettings.shippingProfiles];
                            newProfiles[index] = { ...profile, profileName: value };
                            formData.shippingSettings.shippingProfiles = newProfiles;
                            setFormData({ ...formData });
                          }}
                          required
                          placeholder="e.g., Standard Shipping"
                        />

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-neutral-400">
                            Regions
                          </label>
                          <select
                            multiple
                            value={profile.regions}
                            onChange={(e) => {
                              const newProfiles = [...formData.shippingSettings.shippingProfiles];
                              newProfiles[index] = {
                                ...profile,
                                regions: Array.from(e.target.selectedOptions, option => option.value)
                              };
                              formData.shippingSettings.shippingProfiles = newProfiles;
                              setFormData({ ...formData });
                            }}
                            className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="Punjab">Punjab</option>
                            <option value="Sindh">Sindh</option>
                            <option value="KPK">KPK</option>
                            <option value="Balochistan">Balochistan</option>
                            <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                            <option value="AJK">AJK</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newProfiles = formData.shippingSettings.shippingProfiles.filter((_, i) => i !== index);
                            formData.shippingSettings.shippingProfiles = newProfiles;
                            setFormData({ ...formData });
                          }}
                          className="text-red-500 text-sm hover:text-red-400"
                        >
                          Remove Profile
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          shippingSettings : {
                           ...formData.shippingSettings,
                          shippingProfiles: [
                            ...formData.shippingSettings.shippingProfiles,
                            { profileName: '', regions: [], shippingRates: [] }
                          ]
                          }
                        });
                      }}
                      className="text-primary text-sm hover:text-primary/90"
                    >
                      + Add Shipping Profile
                    </button>
                  </div>
                </div>
              )}

              <FormInput
                id="defaultHandlingTime"
                label="Default Handling Time (days)"
                type="number"
                value={formData.shippingSettings.defaultHandlingTime.toString()}
                onChange={(value) => {
                  formData.shippingSettings.defaultHandlingTime = parseInt(value) || 1;
                  setFormData({ ...formData })
                }}
                required
                placeholder="e.g., 2"
              />

              <FormInput
                id="freeShippingThreshold"
                label="Free Shipping Threshold (PKR)"
                type="number"
                value={formData.shippingSettings.freeShippingThreshold.toString()}
                onChange={(value) => {
                  formData.shippingSettings.freeShippingThreshold = parseInt(value) || 0;
                  setFormData({ ...formData })
                }}
                required
                placeholder="e.g., 2000"
              />

              
            </div>
          </FormStep>
        );
      // case 10:
      //   return (
      //     <FormStep
      //       title="Set Your Return Policy"
      //       subtitle="Specify your return and refund terms"
      //       icon={<FileText size={32} className="text-primary" />}
      //     >
      //       <div className="space-y-4">
      //         <div className="space-y-1">
      //           <label htmlFor="returnPolicy" className="block text-sm font-medium text-neutral-400">
      //             Return Policy<span className="text-red-500 ml-1">*</span>
      //           </label>
      //           <textarea
      //             id="returnPolicy"
      //             value={formData.returnPolicy}
      //             onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
      //             rows={6}
      //             className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      //             placeholder="Specify conditions for returns (e.g., unused items, within 7 days)"
      //             required
      //           />
      //         </div>

      //         <p className="text-sm text-neutral-400">
      //           Help Text: Specify conditions for returns (e.g., unused items, within 7 days).
      //         </p>
      //       </div>
      //     </FormStep>
      //   );
      // case 11:
      //   return (
      //     <FormStep
      //       title="Categorize Your Store"
      //       subtitle="Help customers find your products"
      //       icon={<Tags size={32} className="text-primary" />}
      //     >
      //       <div className="space-y-6">
      //         <div className="space-y-1">
      //           <label className="block text-sm font-medium text-neutral-400">
      //             Select Categories<span className="text-red-500 ml-1">*</span>
      //           </label>
      //           <select
      //             multiple
      //             value={formData.categories}
      //             onChange={(e) => {
      //               setFormData({
      //                 ...formData,
      //                 categories: Array.from(e.target.selectedOptions, option => option.value)
      //               });
      //             }}
      //             className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      //             required
      //           >
      //             <option value="Women's Wear">Women's Wear</option>
      //             <option value="Men's Wear">Men's Wear</option>
      //             <option value="Kids Wear">Kids Wear</option>
      //             <option value="Accessories">Accessories</option>
      //             <option value="Footwear">Footwear</option>
      //             <option value="Beauty">Beauty</option>
      //             <option value="Home">Home</option>
      //           </select>
      //         </div>

      //         <div className="space-y-1">
      //           <label className="block text-sm font-medium text-neutral-400">
      //             Store Tags
      //           </label>
      //           <div className="flex flex-wrap gap-2">
      //             {formData.tags.map((tag, index) => (
      //               <span
      //                 key={index}
      //                 className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center"
      //               >
      //                 {tag}
      //                 <button
      //                   type="button"
      //                   onClick={() => {
      //                     setFormData({
      //                       ...formData,
      //                       tags: formData.tags.filter((_, i) => i !== index)
      //                     });
      //                   }}
      //                   className="ml-2 text-primary hover:text-primary/90"
      //                 >
      //                   ×
      //                 </button>
      //               </span>
      //             ))}
      //           </div>
      //           <input
      //             type="text"
      //             placeholder="Add a tag and press Enter"
      //             className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mt-2"
      //             onKeyDown={(e) => {
      //               if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      //                 e.preventDefault();
      //                 setFormData({
      //                   ...formData,
      //                   tags: [...formData.tags, e.currentTarget.value.trim()]
      //                 });
      //                 e.currentTarget.value = '';
      //               }
      //             }}
      //           />
      //         </div>
      //       </div>
      //     </FormStep>
      //   );
      // case 12:
      //   return (
      //     <FormStep
      //       title="Commission Agreement"
      //       subtitle="Review and accept our terms"
      //       icon={<CheckCircle size={32} className="text-primary" />}
      //     >
      //       <div className="space-y-6">
      //         <div className="p-6 bg-background-light rounded-lg">
      //           <p className="text-lg font-semibold mb-4">Our standard commission is 12.5% per sale.</p>
      //           <p className="text-neutral-400 mb-6">
      //             This commission helps us maintain the platform, provide customer support, and market your products
      //             effectively.
      //           </p>
      //           <div className="space-y-4">
      //             <div className="flex items-center space-x-2">
      //               <input
      //                 type="checkbox"
      //                 id="agreesToCommission"
      //                 checked={formData.}
      //                 onChange={(e) => setFormData({ ...formData, agreesToCommission: e.target.checked })}
      //                 className="w-4 h-4 text-primary bg-background border-neutral-700 rounded focus:ring-primary focus:ring-2"
      //                 required
      //               />
      //               <label htmlFor="agreesToCommission" className="text-white">
      //                 I agree to the commission terms
      //               </label>
      //             </div>
      //           </div>
      //         </div>
      //       </div>
      //     </FormStep>
      //   );
      case 9:
        return (
          <FormStep
            title="Review Your Store Details"
            subtitle="Make sure everything is correct"
            icon={<CheckCircle size={32} className="text-primary" />}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Business Information</h3>
                  <p className="text-neutral-400">Business Name: <span className="text-white">{formData.businessName}</span></p>
                  <p className="text-neutral-400">Legal Name: <span className="text-white">{formData.legalName}</span></p>
                  <p className="text-neutral-400">Business Type: <span className="text-white">{formData.businessDetails.businessType}</span></p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Login Credentials</h3>
                  <p className="text-neutral-400">Email : <span className="text-white">{formData.email}</span></p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Details</h3>
                  <p className="text-neutral-400">Email: <span className="text-white">{formData.contact.email}</span></p>

                  <p className="text-neutral-400">Phone: <span className="text-white">{formData.contact.phoneNumber}</span></p>
                  <p className="text-neutral-400">Business Hours: <span className="text-white">{formData.contact.businessHours}</span></p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Location</h3>
                  <p className="text-neutral-400">Address: <span className="text-white">{formData.location.address}</span></p>
                  <p className="text-neutral-400">City: <span className="text-white">{formData.location.city}</span></p>
                  <p className="text-neutral-400">State: <span className="text-white">{formData.location.state}</span></p>
                </div>

                {/* <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bank Details</h3>
                  <p className="text-neutral-400">Bank: <span className="text-white">{formData.bankName}</span></p>
                  <p className="text-neutral-400">Account Title: <span className="text-white">{formData.accountTitle}</span></p>
                  <p className="text-neutral-400">Payment Schedule: <span className="text-white">{formData.paymentSchedule}</span></p>
                </div> */}
              </div>
            </div>
          </FormStep>
        );
      case 10:
        return (
          <FormStep
            title="You're All Set! 🎉"
            subtitle="Our team will review your profile shortly"
            icon={<CheckCircle size={32} className="text-primary" />}
          >
            <div className="text-center space-y-6">
              <p className="text-lg text-neutral-400">
                Thank you for completing your seller profile. Our team will review your information
                and get back to you within 2-3 business days.
              </p>
              <button
                onClick={() => navigate('/seller/dashboard')}
                className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Go to Seller Dashboard
              </button>
            </div>
          </FormStep>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-light py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-neutral-400">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-neutral-400">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-background rounded-lg p-6 mb-6">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        {currentStep > 0 && currentStep < totalSteps && (
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2 text-neutral-400 hover:text-white focus:outline-none"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Next
            </button>
          </div>
        )}

        {currentStep === totalSteps && (
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2 text-neutral-400 hover:text-white focus:outline-none"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOnboarding;