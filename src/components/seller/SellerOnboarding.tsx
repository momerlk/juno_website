import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { Upload, MapPin, Building2, CreditCard, Truck, FileText, Tags, CheckCircle, Mail } from 'lucide-react';
import FormInput from './FormInput';
import FormStep from './FormStep';

interface FormData {
  // Business Information
  businessName: string;
  legalName: string;
  shortDescription: string;
  fullDescription: string;

  // Brand Identity
  logo: File | null;
  banner: File | null;
  mobileBanner: File | null;

  // Contact Information
  contactPersonName: string;
  businessEmail: string;
  supportEmail: string;
  phoneNumber: string;
  alternatePhone: string;
  whatsappNumber: string;
  businessHours: string;

  // Store Location
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  neighborhood: string;
  storeDirections: string;
  pickupAvailable: boolean;
  pickupHours: string;

  // Business Profile
  businessType: string;
  foundedYear: string;
  employeeCount: string;
  businessCategory: string;
  subcategory: string;

  // KYC Documents
  cnicFront: File | null;
  cnicBack: File | null;

  // Bank Account Details
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branchCode: string;
  branchAddress: string;
  swiftCode: string;
  preferredPaymentMethod: string;
  paymentThreshold: string;
  paymentSchedule: string;

  // Shipping Settings
  shippingType: 'self' | 'platform';
  shippingProfiles: Array<{
    name: string;
    regions: string[];
    rates: Array<{
      name: string;
      price: number;
    }>;
  }>;
  defaultHandlingTime: number;
  freeShippingThreshold: number;
  shippingCutoffTime: string;

  // Return Policy
  returnPolicy: string;

  // Store Categories & Tags
  categories: string[];
  tags: string[];

  // Commission Agreement
  agreesToCommission: boolean;
}

const initialFormData: FormData = {
  businessName: '',
  legalName: '',
  shortDescription: '',
  fullDescription: '',
  logo: null,
  banner: null,
  mobileBanner: null,
  contactPersonName: '',
  businessEmail: '',
  supportEmail: '',
  phoneNumber: '',
  alternatePhone: '',
  whatsappNumber: '',
  businessHours: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Pakistan',
  latitude: '',
  longitude: '',
  neighborhood: '',
  storeDirections: '',
  pickupAvailable: false,
  pickupHours: '',
  businessType: '',
  foundedYear: '',
  employeeCount: '',
  businessCategory: '',
  subcategory: '',
  cnicFront: null,
  cnicBack: null,
  bankName: '',
  accountTitle: '',
  accountNumber: '',
  iban: '',
  branchCode: '',
  branchAddress: '',
  swiftCode: '',
  preferredPaymentMethod: '',
  paymentThreshold: '',
  paymentSchedule: '',
  shippingType: 'platform',
  shippingProfiles: [],
  defaultHandlingTime: 1,
  freeShippingThreshold: 0,
  shippingCutoffTime: '',
  returnPolicy: '',
  categories: [],
  tags: [],
  agreesToCommission: false
};

const SellerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { seller } = useSellerAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const totalSteps = 14;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // TODO: Implement form submission logic
    console.log('Form submitted:', formData);
    navigate('/seller/dashboard');
  };

  

  const renderStep = () => {
    switch (currentStep) {
      case 1:
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
              label="Legal Name"
              value={formData.legalName}
              onChange={(value) => setFormData({ ...formData, legalName: value })}
              required
              placeholder="Legal registered name"
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
                value={formData.fullDescription}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
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
                  Banner Upload<span className="text-red-500 ml-1">*</span>
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
                  Mobile Banner Upload<span className="text-red-500 ml-1">*</span>
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
              value={formData.contactPersonName}
              onChange={(value) => setFormData({ ...formData, contactPersonName: value })}
              required
              placeholder="Full name of contact person"
            />

            <FormInput
              id="businessEmail"
              label="Business Email"
              type="email"
              value={formData.businessEmail}
              onChange={(value) => setFormData({ ...formData, businessEmail: value })}
              required
              placeholder="your@business.com"
            />

            <FormInput
              id="supportEmail"
              label="Support Email (Optional)"
              type="email"
              value={formData.supportEmail}
              onChange={(value) => setFormData({ ...formData, supportEmail: value })}
              placeholder="support@business.com"
            />

            <FormInput
              id="phoneNumber"
              label="Phone Number"
              type="tel"
              value={formData.phoneNumber}
              onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
              required
              placeholder="+92 XXX XXXXXXX"
            />

            <FormInput
              id="alternatePhone"
              label="Alternate Phone Number (Optional)"
              type="tel"
              value={formData.alternatePhone}
              onChange={(value) => setFormData({ ...formData, alternatePhone: value })}
              placeholder="+92 XXX XXXXXXX"
            />

            <FormInput
              id="whatsappNumber"
              label="WhatsApp Number (Optional)"
              type="tel"
              value={formData.whatsappNumber}
              onChange={(value) => setFormData({ ...formData, whatsappNumber: value })}
              placeholder="+92 XXX XXXXXXX"
            />

            <FormInput
              id="businessHours"
              label="Business Hours"
              value={formData.businessHours}
              onChange={(value) => setFormData({ ...formData, businessHours: value })}
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
              value={formData.address}
              onChange={(value) => setFormData({ ...formData, address: value })}
              required
              placeholder="Street address"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="city"
                label="City"
                value={formData.city}
                onChange={(value) => setFormData({ ...formData, city: value })}
                required
                placeholder="City"
              />

              <FormInput
                id="state"
                label="State"
                value={formData.state}
                onChange={(value) => setFormData({ ...formData, state: value })}
                required
                placeholder="State"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="postalCode"
                label="Postal Code"
                type="number"
                value={formData.postalCode}
                onChange={(value) => setFormData({ ...formData, postalCode: value })}
                required
                placeholder="Postal code"
              />

              <FormInput
                id="country"
                label="Country"
                value={formData.country}
                onChange={(value) => setFormData({ ...formData, country: value })}
                required
                disabled
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="latitude"
                label="Latitude (Optional)"
                value={formData.latitude}
                onChange={(value) => setFormData({ ...formData, latitude: value })}
                placeholder="e.g. 31.5204"
              />

              <FormInput
                id="longitude"
                label="Longitude (Optional)"
                value={formData.longitude}
                onChange={(value) => setFormData({ ...formData, longitude: value })}
                placeholder="e.g. 74.3587"
              />
            </div>

            <FormInput
              id="neighborhood"
              label="Neighborhood (Optional)"
              value={formData.neighborhood}
              onChange={(value) => setFormData({ ...formData, neighborhood: value })}
              placeholder="Area or neighborhood name"
            />

            <FormInput
              id="storeDirections"
              label="Store Directions (Optional)"
              value={formData.storeDirections}
              onChange={(value) => setFormData({ ...formData, storeDirections: value })}
              placeholder="Landmarks or directions to find your store"
            />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pickupAvailable"
                  checked={formData.pickupAvailable}
                  onChange={(e) => setFormData({ ...formData, pickupAvailable: e.target.checked })}
                  className="w-4 h-4 text-primary bg-background border-neutral-700 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="pickupAvailable" className="text-sm text-neutral-400">
                  Pickup Available?
                </label>
              </div>

              {formData.pickupAvailable && (
                <FormInput
                  id="pickupHours"
                  label="Pickup Hours"
                  value={formData.pickupHours}
                  onChange={(value) => setFormData({ ...formData, pickupHours: value })}
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
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
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
                value={formData.foundedYear}
                onChange={(value) => setFormData({ ...formData, foundedYear: value })}
                required
                placeholder="e.g. 2020"
              />

              <div className="space-y-1">
                <label htmlFor="employeeCount" className="block text-sm font-medium text-neutral-400">
                  Number of Employees<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="employeeCount"
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
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
                  value={formData.businessCategory}
                  onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select business category</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Home & Living">Home & Living</option>
                  <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                  <option value="Sports & Outdoors">Sports & Outdoors</option>
                  <option value="Books & Stationery">Books & Stationery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <FormInput
                id="subcategory"
                label="Subcategory"
                value={formData.subcategory}
                onChange={(value) => setFormData({ ...formData, subcategory: value })}
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
                      {formData.cnicFront ? formData.cnicFront.name : 'Upload CNIC front'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData({ ...formData, cnicFront: file });
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
                      {formData.cnicBack ? formData.cnicBack.name : 'Upload CNIC back'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData({ ...formData, cnicBack: file });
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
            title="Payout Settings"
            subtitle="Set up your payment details"
            icon={<CreditCard size={32} className="text-primary" />}
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="bankName" className="block text-sm font-medium text-neutral-400">
                  Bank Name<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select bank</option>
                  <option value="HBL">HBL</option>
                  <option value="UBL">UBL</option>
                  <option value="MCB">MCB</option>
                  <option value="ABL">ABL</option>
                  <option value="Bank Alfalah">Bank Alfalah</option>
                  <option value="Meezan Bank">Meezan Bank</option>
                </select>
              </div>

              <FormInput
                id="accountTitle"
                label="Account Title"
                value={formData.accountTitle}
                onChange={(value) => setFormData({ ...formData, accountTitle: value })}
                required
                placeholder="Enter account title"
              />

              <FormInput
                id="accountNumber"
                label="Account Number"
                value={formData.accountNumber}
                onChange={(value) => setFormData({ ...formData, accountNumber: value })}
                required
                placeholder="Enter account number"
              />

              <FormInput
                id="iban"
                label="IBAN"
                value={formData.iban}
                onChange={(value) => setFormData({ ...formData, iban: value })}
                required
                placeholder="PK36XXXX..."
              />

              <FormInput
                id="branchCode"
                label="Branch Code"
                value={formData.branchCode}
                onChange={(value) => setFormData({ ...formData, branchCode: value })}
                required
                placeholder="Enter branch code"
              />

              <FormInput
                id="branchAddress"
                label="Branch Address"
                value={formData.branchAddress}
                onChange={(value) => setFormData({ ...formData, branchAddress: value })}
                required
                placeholder="Enter branch address"
              />

              <FormInput
                id="swiftCode"
                label="Swift Code (Optional)"
                value={formData.swiftCode}
                onChange={(value) => setFormData({ ...formData, swiftCode: value })}
                placeholder="Enter swift code"
              />

              <div className="space-y-1">
                <label htmlFor="preferredPaymentMethod" className="block text-sm font-medium text-neutral-400">
                  Preferred Payment Method<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="preferredPaymentMethod"
                  value={formData.preferredPaymentMethod}
                  onChange={(e) => setFormData({ ...formData, preferredPaymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select payment method</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                </select>
              </div>

              <FormInput
                id="paymentThreshold"
                label="Payment Threshold (PKR)"
                type="number"
                value={formData.paymentThreshold}
                onChange={(value) => setFormData({ ...formData, paymentThreshold: value })}
                required
                placeholder="Minimum amount for payout"
              />

              <div className="space-y-1">
                <label htmlFor="paymentSchedule" className="block text-sm font-medium text-neutral-400">
                  Payment Schedule<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="paymentSchedule"
                  value={formData.paymentSchedule}
                  onChange={(e) => setFormData({ ...formData, paymentSchedule: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select payment schedule</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Biweekly">Biweekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>
          </FormStep>
        );
      case 9:
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
                      checked={formData.shippingType === 'self'}
                      onChange={(e) => setFormData({ ...formData, shippingType: 'self' })}
                      className="form-radio text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-white">Self-shipping</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="platform"
                      checked={formData.shippingType === 'platform'}
                      onChange={(e) => setFormData({ ...formData, shippingType: 'platform' })}
                      className="form-radio text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-white">Platform Shipping</span>
                  </label>
                </div>
              </div>

              {formData.shippingType === 'self' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-400">
                      Shipping Profiles
                    </label>
                    {formData.shippingProfiles.map((profile, index) => (
                      <div key={index} className="p-4 bg-background-light rounded-lg space-y-4">
                        <FormInput
                          id={`profile-name-${index}`}
                          label="Profile Name"
                          value={profile.name}
                          onChange={(value) => {
                            const newProfiles = [...formData.shippingProfiles];
                            newProfiles[index] = { ...profile, name: value };
                            setFormData({ ...formData, shippingProfiles: newProfiles });
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
                              const newProfiles = [...formData.shippingProfiles];
                              newProfiles[index] = {
                                ...profile,
                                regions: Array.from(e.target.selectedOptions, option => option.value)
                              };
                              setFormData({ ...formData, shippingProfiles: newProfiles });
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
                            const newProfiles = formData.shippingProfiles.filter((_, i) => i !== index);
                            setFormData({ ...formData, shippingProfiles: newProfiles });
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
                          shippingProfiles: [
                            ...formData.shippingProfiles,
                            { name: '', regions: [], rates: [] }
                          ]
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
                value={formData.defaultHandlingTime.toString()}
                onChange={(value) => setFormData({ ...formData, defaultHandlingTime: parseInt(value) || 1 })}
                required
                placeholder="e.g., 2"
              />

              <FormInput
                id="freeShippingThreshold"
                label="Free Shipping Threshold (PKR)"
                type="number"
                value={formData.freeShippingThreshold.toString()}
                onChange={(value) => setFormData({ ...formData, freeShippingThreshold: parseInt(value) || 0 })}
                required
                placeholder="e.g., 2000"
              />

              <FormInput
                id="shippingCutoffTime"
                label="Shipping Cutoff Time"
                type="time"
                value={formData.shippingCutoffTime}
                onChange={(value) => setFormData({ ...formData, shippingCutoffTime: value })}
                required
                placeholder="e.g., 14:00"
              />
            </div>
          </FormStep>
        );
      case 10:
        return (
          <FormStep
            title="Set Your Return Policy"
            subtitle="Specify your return and refund terms"
            icon={<FileText size={32} className="text-primary" />}
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="returnPolicy" className="block text-sm font-medium text-neutral-400">
                  Return Policy<span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  id="returnPolicy"
                  value={formData.returnPolicy}
                  onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Specify conditions for returns (e.g., unused items, within 7 days)"
                  required
                />
              </div>

              <p className="text-sm text-neutral-400">
                Help Text: Specify conditions for returns (e.g., unused items, within 7 days).
              </p>
            </div>
          </FormStep>
        );
      case 11:
        return (
          <FormStep
            title="Categorize Your Store"
            subtitle="Help customers find your products"
            icon={<Tags size={32} className="text-primary" />}
          >
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-400">
                  Select Categories<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  multiple
                  value={formData.categories}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      categories: Array.from(e.target.selectedOptions, option => option.value)
                    });
                  }}
                  className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="Women's Wear">Women's Wear</option>
                  <option value="Men's Wear">Men's Wear</option>
                  <option value="Kids Wear">Kids Wear</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Home">Home</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-400">
                  Store Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            tags: formData.tags.filter((_, i) => i !== index)
                          });
                        }}
                        className="ml-2 text-primary hover:text-primary/90"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add a tag and press Enter"
                  className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mt-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      setFormData({
                        ...formData,
                        tags: [...formData.tags, e.currentTarget.value.trim()]
                      });
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </FormStep>
        );
      case 12:
        return (
          <FormStep
            title="Commission Agreement"
            subtitle="Review and accept our terms"
            icon={<CheckCircle size={32} className="text-primary" />}
          >
            <div className="space-y-6">
              <div className="p-6 bg-background-light rounded-lg">
                <p className="text-lg font-semibold mb-4">Our standard commission is 12.5% per sale.</p>
                <p className="text-neutral-400 mb-6">
                  This commission helps us maintain the platform, provide customer support, and market your products
                  effectively.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="agreesToCommission"
                      checked={formData.agreesToCommission}
                      onChange={(e) => setFormData({ ...formData, agreesToCommission: e.target.checked })}
                      className="w-4 h-4 text-primary bg-background border-neutral-700 rounded focus:ring-primary focus:ring-2"
                      required
                    />
                    <label htmlFor="agreesToCommission" className="text-white">
                      I agree to the commission terms
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </FormStep>
        );
      case 13:
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
                  <p className="text-neutral-400">Business Type: <span className="text-white">{formData.businessType}</span></p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Details</h3>
                  <p className="text-neutral-400">Email: <span className="text-white">{formData.businessEmail}</span></p>
                  <p className="text-neutral-400">Phone: <span className="text-white">{formData.phoneNumber}</span></p>
                  <p className="text-neutral-400">Business Hours: <span className="text-white">{formData.businessHours}</span></p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Location</h3>
                  <p className="text-neutral-400">Address: <span className="text-white">{formData.address}</span></p>
                  <p className="text-neutral-400">City: <span className="text-white">{formData.city}</span></p>
                  <p className="text-neutral-400">State: <span className="text-white">{formData.state}</span></p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bank Details</h3>
                  <p className="text-neutral-400">Bank: <span className="text-white">{formData.bankName}</span></p>
                  <p className="text-neutral-400">Account Title: <span className="text-white">{formData.accountTitle}</span></p>
                  <p className="text-neutral-400">Payment Schedule: <span className="text-white">{formData.paymentSchedule}</span></p>
                </div>
              </div>
            </div>
          </FormStep>
        );
      case 14:
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
        {currentStep > 1 && currentStep < totalSteps && (
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