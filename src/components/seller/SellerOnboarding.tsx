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
import { useNavigate } from 'react-router-dom';
import FormStep from './FormStep';
import FormInput from './FormInput';
import { uploadFileAndGetUrl, api_url } from '../../api';

interface FormData {
  // Login Credentials
  email: string;
  password: string;
  confirmPassword: string;
  formErrors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    business_name?: string;
    legal_name?: string;
    short_description?: string;
    description?: string;
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    branchCode?: string;
    branchAddress?: string;
    swiftCode?: string;
    paymentMethod?: string;
    paymentSchedule?: string;
    paymentThreshold?: string;
    contact_person_name?: string;
    business_email?: string;
    support_email?: string;
    phone_number?: string;
    alternate_phone_number?: string;
    business_type?: string;
    founded_year?: string;
    number_of_employees?: string;
    business_category?: string;
    business_subcategory?: string;
    cnic_front?: string;
    cnic_back?: string;
  };

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

interface LoadingStates {
  logo: boolean;
  banner: boolean;
  cnic_front: boolean;
  cnic_back: boolean;
  businessLicense: boolean;
}

const SellerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    formErrors: {},
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
      business_hours: '9:00 AM - 6:00 PM'
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
      business_category: 'Fashion',
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
      paymentMethod: 'Bank Transfer',
      paymentSchedule: 'Weekly',
      paymentThreshold: 1000
    },
    shipping_settings: {
      default_handling_time: 1,
      free_shipping_threshold: 0,
      platform_shipping: true,
      self_shipping: false,
      shipping_profiles: []
    },
    return_policy: 'Standard 7-day return policy applies to all items.',
    categories: [],
    tags: [],
    status: 'pending',
    verified: false
  });

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    logo: false,
    banner: false,
    cnic_front: false,
    cnic_back: false,
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

  const employeeRanges = [
    '1-5',
    '6-10',
    '11-25',
    '26-50',
    '51-100',
    '100+'
  ];

  const handleFileUpload = async (file: File, type: keyof LoadingStates) => {
    if (!file) return;

    setLoadingStates(prev => ({ ...prev, [type]: true }));

    try {
      const url = await uploadFileAndGetUrl(file);
      
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logo_url: url }));
      } else if (type === 'banner') {
        setFormData(prev => ({ ...prev, banner_url: url }));
      } else if (type === 'cnic_front') {
        setFormData(prev => ({
          ...prev,
          kyc_documents: { ...prev.kyc_documents, cnic_front: url }
        }));
      } else if (type === 'cnic_back') {
        setFormData(prev => ({
          ...prev,
          kyc_documents: { ...prev.kyc_documents, cnic_back: url }
        }));
      }
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      alert(`Failed to upload ${type}. Please try again.`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  const openLocationPicker = () => {
    const address = `${formData.location.address}, ${formData.location.city}, ${formData.location.state}, ${formData.location.country}`;
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(formData.email && formData.password && formData.confirmPassword && 
                 formData.password === formData.confirmPassword);
      case 1:
        return !!(formData.business_name && formData.business_details.business_type && 
                 formData.contact.contact_person_name && formData.contact.phone_number);
      case 2:
        return !!(formData.location.address && formData.location.city && 
                 formData.location.state && formData.location.postal_code);
      case 3:
        return !!(formData.logo_url && formData.kyc_documents.cnic_front);
      case 4:
        return !!(formData.bank_details.bankName && formData.bank_details.accountTitle && 
                 formData.bank_details.accountNumber);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 5) {
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
      console.log('Submitting form data:', formData);
      
      const response = await fetch(`${api_url}/seller/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const responseText = await response.text();
      console.log('Response:', responseText);

      if (!response.ok) {
        console.error('Registration failed:', responseText);
        alert('Registration has failed. Please check your network connection or information and try again.');
        return;
      }

      if (response.ok || response.status === 201) {
        alert('Registration successful. Please check your email for verification.');
        navigate('/seller/auth');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadField: React.FC<{
    label: string;
    type: keyof LoadingStates;
    accept: string;
    description: string;
    icon: React.ReactNode;
    required?: boolean;
  }> = ({ label, type, accept, description, icon, required = false }) => {
    
    const getUploadedUrl = () => {
      if (type === 'logo') return formData.logo_url;
      if (type === 'banner') return formData.banner_url;
      if (type === 'cnic_front') return formData.kyc_documents.cnic_front;
      if (type === 'cnic_back') return formData.kyc_documents.cnic_back;
      return null;
    };

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-400">
          {label} {required && <span className="text-red-500">*</span>}
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
              ${getUploadedUrl() ? 'border-green-500 bg-green-500/10' : ''}
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
            ) : getUploadedUrl() ? (
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
  };

  const steps = [
    {
      title: "Account Credentials",
      subtitle: "Create your seller account",
      icon: <User className="text-primary" size={32} />,
      content: (
        <div className="space-y-6">
          <FormInput
            id="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
            required
            icon={<Mail size={20} />}
            placeholder="your@email.com"
          />

          <FormInput
            id="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
            required
            showPasswordStrength
            minLength={8}
            placeholder="Create a strong password"
          />

          <FormInput
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
            required
            placeholder="Confirm your password"
            validate={(value) => {
              if (value !== formData.password) {
                return "Passwords do not match";
              }
            }}
          />
        </div>
      )
    },
    {
      title: "Business Information",
      subtitle: "Tell us about your business",
      icon: <Building className="text-primary" size={32} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="businessName"
              label="Business Name"
              value={formData.business_name}
              onChange={(value) => setFormData(prev => ({ ...prev, business_name: value }))}
              required
              icon={<Building size={20} />}
              placeholder="Enter your business name"
            />

            <FormInput
              id="legalName"
              label="Legal Name"
              value={formData.legal_name}
              onChange={(value) => setFormData(prev => ({ ...prev, legal_name: value }))}
              placeholder="Legal business name"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-400">
              Business Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.business_details.business_type}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                business_details: { ...prev.business_details, business_type: e.target.value }
              }))}
              className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Select business type</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-400">Founded Year</label>
              <input
                type="number"
                value={formData.business_details.founded_year}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  business_details: { ...prev.business_details, founded_year: parseInt(e.target.value) }
                }))}
                className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-400">Number of Employees</label>
              <select
                value={formData.business_details.number_of_employees}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  business_details: { ...prev.business_details, number_of_employees: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select range</option>
                {employeeRanges.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-400">Business Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Describe your business..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="contactPersonName"
              label="Contact Person Name"
              value={formData.contact.contact_person_name}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, contact_person_name: value }
              }))}
              required
              icon={<User size={20} />}
              placeholder="Contact person name"
            />

            <FormInput
              id="phoneNumber"
              label="Phone Number"
              value={formData.contact.phone_number}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, phone_number: value }
              }))}
              required
              icon={<Phone size={20} />}
              placeholder="+92 300 1234567"
            />
          </div>
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
            id="address"
            label="Street Address"
            value={formData.location.address}
            onChange={(value) => setFormData(prev => ({
              ...prev,
              location: { ...prev.location, address: value }
            }))}
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
                value={formData.location.city}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, city: e.target.value }
                }))}
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
                value={formData.location.state}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, state: e.target.value }
                }))}
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
              value={formData.location.postal_code}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, postal_code: value }
              }))}
              required
              placeholder="12345"
            />

            <FormInput
              id="neighborhood"
              label="Neighborhood"
              value={formData.location.neighborhood}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, neighborhood: value }
              }))}
              placeholder="Area/Neighborhood"
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
              required
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
              label="CNIC Front"
              type="cnic_front"
              accept="image/*,.pdf"
              description="Upload front side of CNIC (PNG, JPG, PDF, max 5MB)"
              icon={<FileText size={24} />}
              required
            />

            <FileUploadField
              label="CNIC Back"
              type="cnic_back"
              accept="image/*,.pdf"
              description="Upload back side of CNIC (PNG, JPG, PDF, max 5MB)"
              icon={<FileText size={24} />}
            />
          </div>

          <div className="bg-background-light/50 border border-neutral-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-2">Document Requirements:</h4>
            <ul className="text-sm text-neutral-400 space-y-1">
              <li>• All documents must be clear and readable</li>
              <li>• CNIC front side is required for verification</li>
              <li>• Logo should be high resolution for best display quality</li>
              <li>• Banner image will be displayed on your store page</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Bank Details",
      subtitle: "Payment and banking information",
      icon: <CreditCard className="text-success" size={32} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="bankName"
              label="Bank Name"
              value={formData.bank_details.bankName}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                bank_details: { ...prev.bank_details, bankName: value }
              }))}
              required
              placeholder="e.g., HBL, UBL, MCB"
            />

            <FormInput
              id="accountTitle"
              label="Account Title"
              value={formData.bank_details.accountTitle}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                bank_details: { ...prev.bank_details, accountTitle: value }
              }))}
              required
              placeholder="Account holder name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="accountNumber"
              label="Account Number"
              value={formData.bank_details.accountNumber}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                bank_details: { ...prev.bank_details, accountNumber: value }
              }))}
              required
              placeholder="Bank account number"
            />

            <FormInput
              id="iban"
              label="IBAN"
              value={formData.bank_details.iban}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                bank_details: { ...prev.bank_details, iban: value }
              }))}
              placeholder="PK36SCBL0000001123456702"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="branchCode"
              label="Branch Code"
              value={formData.bank_details.branchCode}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                bank_details: { ...prev.bank_details, branchCode: value }
              }))}
              placeholder="Branch code"
            />

            <FormInput
              id="branchAddress"
              label="Branch Address"
              value={formData.bank_details.branchAddress}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                bank_details: { ...prev.bank_details, branchAddress: value }
              }))}
              placeholder="Branch address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-400">Payment Method</label>
              <select
                value={formData.bank_details.paymentMethod}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  bank_details: { ...prev.bank_details, paymentMethod: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Banking">Mobile Banking</option>
                <option value="Check">Check</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-400">Payment Schedule</label>
              <select
                value={formData.bank_details.paymentSchedule}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  bank_details: { ...prev.bank_details, paymentSchedule: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
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
            <h4 className="text-lg font-semibold text-white mb-4">Account & Business Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-400">Email:</span>
                <p className="text-white">{formData.email}</p>
              </div>
              <div>
                <span className="text-neutral-400">Business Name:</span>
                <p className="text-white">{formData.business_name}</p>
              </div>
              <div>
                <span className="text-neutral-400">Business Type:</span>
                <p className="text-white">{formData.business_details.business_type}</p>
              </div>
              <div>
                <span className="text-neutral-400">Contact Person:</span>
                <p className="text-white">{formData.contact.contact_person_name}</p>
              </div>
            </div>
          </div>

          <div className="bg-background-light/50 border border-neutral-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Address</h4>
            <p className="text-white text-sm">
              {formData.location.address}, {formData.location.city}, {formData.location.state} {formData.location.postal_code}, {formData.location.country}
            </p>
          </div>

          <div className="bg-background-light/50 border border-neutral-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Documents Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                {formData.logo_url ? (
                  <Check className="text-green-500 mr-2" size={16} />
                ) : (
                  <div className="w-4 h-4 border border-neutral-500 rounded mr-2"></div>
                )}
                <span className={formData.logo_url ? 'text-green-500' : 'text-neutral-400'}>
                  Business Logo
                </span>
              </div>
              <div className="flex items-center">
                {formData.kyc_documents.cnic_front ? (
                  <Check className="text-green-500 mr-2" size={16} />
                ) : (
                  <div className="w-4 h-4 border border-neutral-500 rounded mr-2"></div>
                )}
                <span className={formData.kyc_documents.cnic_front ? 'text-green-500' : 'text-neutral-400'}>
                  CNIC Front
                </span>
              </div>
              <div className="flex items-center">
                {formData.banner_url ? (
                  <Check className="text-green-500 mr-2" size={16} />
                ) : (
                  <div className="w-4 h-4 border border-neutral-500 rounded mr-2"></div>
                )}
                <span className={formData.banner_url ? 'text-green-500' : 'text-neutral-400'}>
                  Banner Image
                </span>
              </div>
              <div className="flex items-center">
                {formData.kyc_documents.cnic_back ? (
                  <Check className="text-green-500 mr-2" size={16} />
                ) : (
                  <div className="w-4 h-4 border border-neutral-500 rounded mr-2"></div>
                )}
                <span className={formData.kyc_documents.cnic_back ? 'text-green-500' : 'text-neutral-400'}>
                  CNIC Back
                </span>
              </div>
            </div>
          </div>

          <div className="bg-background-light/50 border border-neutral-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Bank Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-400">Bank:</span>
                <p className="text-white">{formData.bank_details.bankName}</p>
              </div>
              <div>
                <span className="text-neutral-400">Account Title:</span>
                <p className="text-white">{formData.bank_details.accountTitle}</p>
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
                  Complete Registration
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