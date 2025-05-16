import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { Upload, MapPin, Building2, CreditCard, Truck, FileText, Tags, CheckCircle, Mail } from 'lucide-react';
import FormInput from './FormInput';
import FormStep from './FormStep';

import * as api from "../../api"

interface FormData {
  // Login Credentials
  email: string;
  password: string;

  // Business Information
  business_name: string;
  legal_name: string;
  description: string;
  short_description: string;

  // Brand Identity
  logo_url: string | null;
  banner_url: string | null;
  banner_mobile_url: string | null;

  // Contact Information
  contact: {
    contact_person_name: string;
    email: string;
    support_email: string;
    phone_number: string;
    alternate_phone_number: string;
    whatsapp: string;
    business_hours: string;
  };

  // Store Location
  location: {
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    latitude: number;
    longitude: number;
    neighborhood: string;
    store_directions: string;
    pickup_available: boolean;
    pickup_hours: string;
  };

  // Business Profile
  business_details: {
    business_type: string;
    founded_year: number;
    number_of_employees: string;
    business_category: string;
    business_subcategory: string;
  };

  // KYC Documents
  kyc_documents: {
    cnic_front: string | null;
    cnic_back: string | null;
  };

  // Bank Account Details
  bank_details: {
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
  shipping_settings: {
    default_handling_time: number;
    free_shipping_threshold: number;
    platform_shipping: boolean;
    self_shipping: boolean;
    shipping_profiles: Array<{
      profile_name: string;
      regions: string[];
      shipping_rates: Array<{
        delivery_method: string;
        estimated_days: number;
        rate: number;
      }>;
    }>;
  };

  // Return Policy
  return_policy: string;

  // Store Categories & Tags
  categories: string[];
  tags: string[];


  // Status
  status: string;
  verified: boolean;
}

const initialFormData: FormData = {
  email: '',
  password: '',
  business_name: '',
  legal_name: '',
  description: '',
  short_description: '',
  logo_url: null,
  banner_url: null,
  banner_mobile_url: null,
  contact: {
    contact_person_name: '',
    email: '',
    support_email: '',
    phone_number: '',
    alternate_phone_number: '',
    whatsapp: '',
    business_hours: ''
  },
  location: {
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Pakistan',
    latitude: 0,
    longitude: 0,
    neighborhood: '',
    store_directions: '',
    pickup_available: false,
    pickup_hours: ''
  },
  business_details: {
    business_type: '',
    founded_year: new Date().getFullYear(),
    number_of_employees: '',
    business_category: '',
    business_subcategory: '',
  },
  kyc_documents: {
    cnic_front: null,
    cnic_back: null,
  },
  bank_details: {
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
  shipping_settings: {
    default_handling_time: 1,
    free_shipping_threshold: 0,
    platform_shipping: true,
    self_shipping: false,
    shipping_profiles: []
  },
  return_policy: '',
  categories: [],
  tags: [],

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
      
      console.log(formData);
      const resp = await fetch('http://localhost:8080/api/v1/seller/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const respJSON = resp.text();

      if (!resp.ok) {
        console.log(respJSON)
        alert('Registration has failed. Please check your network connection or information and try again.');
      }

      if (resp.ok || resp.status === 201) {
        alert('Registration successful. Please check your email for verification.');
        navigate('/seller/auth');
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
              id="business_name"
              label="Business Name"
              value={formData.business_name}
              onChange={(value) => setFormData({ ...formData, business_name: value })}
              required
              placeholder="Your business name"
            />
            <FormInput
              id="legal_name"
              label="Your Legal Name"
              value={formData.legal_name}
              onChange={(value) => setFormData({ ...formData, legal_name: value })}
              required
              placeholder="Legal registered name of the person onboarding"
            />
            <FormInput
              id="short_description"
              label="Short Description"
              value={formData.short_description}
              onChange={(value) => setFormData({ ...formData, short_description: value })}
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
                      {formData.logo_url ? formData.logo_url : 'Choose a logo'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await api.uploadFileAndGetUrl(file!);
                          setFormData({ ...formData, logo_url: url });
                        }
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
                      {formData.banner_url ? formData.banner_url : 'Choose a banner'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await api.uploadFileAndGetUrl(file!);
                          setFormData({ ...formData, banner_url: url });
                        }
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
                      {formData.banner_mobile_url ? formData.banner_mobile_url : 'Choose a mobile banner'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await api.uploadFileAndGetUrl(file!);
                          setFormData({ ...formData, banner_mobile_url: url });
                        }
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
              id="contact_person_name"
              label="Contact Person Name"
              value={formData.contact.contact_person_name}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, contact_person_name: value }
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
              id="support_email"
              label="Support Email (Optional)"
              type="email"
              value={formData.contact.support_email}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, support_email: value }
              })}
              placeholder="support@business.com"
            />

            <FormInput
              id="phone_number"
              label="Phone Number"
              type="tel"
              value={formData.contact.phone_number}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, phone_number: value }
              })}
              required
              placeholder="+92 XXX XXXXXXX"
            />

            <FormInput
              id="alternatePhone"
              label="Alternate Phone Number (Optional)"
              type="tel"
              value={formData.contact.alternate_phone_number}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, alternate_phone_number: value }
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
              id="business_hours"
              label="Business Hours"
              value={formData.contact.business_hours}
              onChange={(value) => setFormData({
                ...formData,
                contact: { ...formData.contact, business_hours: value }
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
                id="postal_code"
                label="Postal Code"
                type="number"
                value={formData.location.postal_code}
                onChange={(value) => setFormData({
                  ...formData,
                  location: { ...formData.location, postal_code: value }
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
              id="store_directions"
              label="Store Directions (Optional)"
              value={formData.location.store_directions}
              onChange={(value) => setFormData({
                ...formData,
                location: { ...formData.location, store_directions: value }
              })}
              placeholder="Landmarks or directions to find your store"
            />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pickup_available"
                  checked={formData.location.pickup_available}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, pickup_available: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary bg-background border-neutral-700 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="pickup_available" className="text-sm text-neutral-400">
                  Pickup Available?
                </label>
              </div>

              {formData.location.pickup_available && (
                <FormInput
                  id="pickup_hours"
                  label="Pickup Hours"
                  value={formData.location.pickup_hours}
                  onChange={(value) => setFormData({
                    ...formData,
                    location: { ...formData.location, pickup_hours: value }
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
                <label htmlFor="business_type" className="block text-sm font-medium text-neutral-400">
                  Business Type<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="business_type"
                  value={formData.business_details.business_type}
                  onChange={(e) => {
                    formData.business_details.business_type = e.target.value;
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
                id="founded_year"
                label="Founded Year"
                type="number"
                value={formData.business_details.founded_year as unknown as string}
                onChange={(value) => {
                  formData.business_details.founded_year = parseInt(value) || 0;
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
                  value={formData.business_details.number_of_employees}
                  onChange={(e) => {
                    formData.business_details.number_of_employees = e.target.value;
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
                <label htmlFor="business_category" className="block text-sm font-medium text-neutral-400">
                  Business Category<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="business_category"
                  value={formData.business_details.business_category}
                  onChange={(e) => {
                    formData.business_details.business_category = e.target.value;
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
                value={formData.business_details.business_subcategory}
                onChange={(value) => {
                  formData.business_details.business_subcategory = value;
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
                      {formData.kyc_documents.cnic_front ? formData.kyc_documents.cnic_front : 'Upload CNIC front'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await api.uploadFileAndGetUrl(file!);
                          formData.kyc_documents.cnic_front = url;
                          setFormData({ ...formData });
                        }

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
                      {formData.kyc_documents.cnic_back ? formData.kyc_documents.cnic_back : 'Upload CNIC back'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await api.uploadFileAndGetUrl(file!);
                          formData.kyc_documents.cnic_front = url;
                          setFormData({ ...formData });
                        }
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
                      checked={formData.shipping_settings.self_shipping === true}
                      onChange={_ => {
                        formData.shipping_settings.self_shipping = true;
                        formData.shipping_settings.platform_shipping = false;
                        setFormData({...formData, shipping_settings: {...formData.shipping_settings } });
                      }}
                      className="form-radio text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-white">Self-shipping</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="platform"
                      checked={formData.shipping_settings.platform_shipping}
                      onChange={_ => {
                        formData.shipping_settings.self_shipping = false;
                        formData.shipping_settings.platform_shipping = true;
                        setFormData({...formData, shipping_settings: {...formData.shipping_settings } });
                      }}
                      className="form-radio text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-white">Platform Shipping</span>
                  </label>
                </div>
              </div>

              {formData.shipping_settings.self_shipping === true && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-400">
                      Shipping Profiles
                    </label>
                    {formData.shipping_settings.shipping_profiles.map((profile, index) => (
                      <div key={index} className="p-4 bg-background-light rounded-lg space-y-4">
                        <FormInput
                          id={`profile-name-${index}`}
                          label="Profile Name"
                          value={profile.profile_name}
                          onChange={(value) => {
                            const newProfiles = [...formData.shipping_settings.shipping_profiles];
                            newProfiles[index] = { ...profile, profile_name: value };
                            formData.shipping_settings.shipping_profiles = newProfiles;
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
                              const newProfiles = [...formData.shipping_settings.shipping_profiles];
                              newProfiles[index] = {
                                ...profile,
                                regions: Array.from(e.target.selectedOptions, option => option.value)
                              };
                              formData.shipping_settings.shipping_profiles = newProfiles;
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
                            const newProfiles = formData.shipping_settings.shipping_profiles.filter((_, i) => i !== index);
                            formData.shipping_settings.shipping_profiles = newProfiles;
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
                          shipping_settings : {
                           ...formData.shipping_settings,
                          shipping_profiles: [
                            ...formData.shipping_settings.shipping_profiles,
                            { profile_name: '', regions: [], shipping_rates: [] }
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
                id="default_handling_time"
                label="Default Handling Time (days)"
                type="number"
                value={formData.shipping_settings.default_handling_time.toString()}
                onChange={(value) => {
                  formData.shipping_settings.default_handling_time = parseInt(value) || 1;
                  setFormData({ ...formData })
                }}
                required
                placeholder="e.g., 2"
              />

              <FormInput
                id="free_shipping_threshold"
                label="Free Shipping Threshold (PKR)"
                type="number"
                value={formData.shipping_settings.free_shipping_threshold.toString()}
                onChange={(value) => {
                  formData.shipping_settings.free_shipping_threshold = parseInt(value) || 0;
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
      //           <label htmlFor="return_policy" className="block text-sm font-medium text-neutral-400">
      //             Return Policy<span className="text-red-500 ml-1">*</span>
      //           </label>
      //           <textarea
      //             id="return_policy"
      //             value={formData.return_policy}
      //             onChange={(e) => setFormData({ ...formData, return_policy: e.target.value })}
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
                  <p className="text-neutral-400">Business Name: <span className="text-white">{formData.business_name}</span></p>
                  <p className="text-neutral-400">Legal Name: <span className="text-white">{formData.legal_name}</span></p>
                  <p className="text-neutral-400">Business Type: <span className="text-white">{formData.business_details.business_type}</span></p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Login Credentials</h3>
                  <p className="text-neutral-400">Email : <span className="text-white">{formData.email}</span></p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Details</h3>
                  <p className="text-neutral-400">Email: <span className="text-white">{formData.contact.email}</span></p>

                  <p className="text-neutral-400">Phone: <span className="text-white">{formData.contact.phone_number}</span></p>
                  <p className="text-neutral-400">Business Hours: <span className="text-white">{formData.contact.business_hours}</span></p>
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