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

    contact_person_name : string;
    business_email : string;
    support_email : string;
    phone_number : string;
    alternate_phone_number : string;


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

const initialFormData: FormData = {
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
  }
};

const validateHandlingTime = (days: number): string | null => {
  if (!days || days < 1) {
    return "Handling time must be at least 1 day";
  }
  if (days > 14) {
    return "Handling time cannot exceed 14 days";
  }
  return null;
};

const validateFreeShippingThreshold = (amount: number): string | null => {
  if (amount < 0) {
    return "Free shipping threshold cannot be negative";
  }
  if (amount > 50000) {
    return "Free shipping threshold cannot exceed 50,000 PKR";
  }
  return null;
};

const validateShippingProfile = (profile: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Validate profile name
  if (!profile.profile_name) {
    errors.profile_name = "Profile name is required";
  } else if (profile.profile_name.length < 3) {
    errors.profile_name = "Profile name must be at least 3 characters";
  } else if (profile.profile_name.length > 50) {
    errors.profile_name = "Profile name cannot exceed 50 characters";
  }

  // Validate regions
  if (!profile.regions || profile.regions.length === 0) {
    errors.regions = "At least one region must be selected";
  }

  // Validate delivery days
  if (!profile.delivery_days) {
    errors.delivery_days = "Delivery days is required";
  } else if (profile.delivery_days < 1) {
    errors.delivery_days = "Delivery days must be at least 1";
  } else if (profile.delivery_days > 30) {
    errors.delivery_days = "Delivery days cannot exceed 30";
  }

  // Validate shipping rate
  if (profile.shipping_rate === undefined || profile.shipping_rate === null) {
    errors.shipping_rate = "Shipping rate is required";
  } else if (profile.shipping_rate < 0) {
    errors.shipping_rate = "Shipping rate cannot be negative";
  } else if (profile.shipping_rate > 10000) {
    errors.shipping_rate = "Shipping rate cannot exceed 10,000 PKR";
  }

  return errors;
};

const validateContactName = (name: string): string | null => {
  if (!name.trim()) {
    return "Contact person name is required";
  }
  if (name.length < 3) {
    return "Name must be at least 3 characters long";
  }
  if (name.length > 50) {
    return "Name cannot exceed 50 characters";
  }
  if (!/^[a-zA-Z\s]*$/.test(name)) {
    return "Name can only contain letters and spaces";
  }
  return null;
};

const validateBusinessEmail = (email: string): string | null => {
  if (!email.trim()) {
    return "Business email is required";
  }
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
};

const validateSupportEmail = (email: string): string | null => {
  if (!email.trim()) {
    return null; // Optional field
  }
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
};

const validatePhoneNumber = (phone: string): string | null => {
  if (!phone.trim()) {
    return "Phone number is required";
  }
  // Pakistan phone number format: +92 XXX XXXXXXX
  const phoneRegex = /^\+92\s?[0-9]{3}\s?[0-9]{7}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return "Please enter a valid Pakistani phone number (+92 XXX XXXXXXX)";
  }
  return null;
};

const validateOptionalPhone = (phone: string): string | null => {
  if (!phone.trim()) {
    return null; // Optional field
  }
  const phoneRegex = /^\+92\s?[0-9]{3}\s?[0-9]{7}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return "Please enter a valid Pakistani phone number (+92 XXX XXXXXXX)";
  }
  return null;
};

const validateBusinessHours = (hours: string): string | null => {
  if (!hours.trim()) {
    return "Business hours are required";
  }
  // Format: HH:MM-HH:MM, e.g., 09:00-17:00
  const hoursRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!hoursRegex.test(hours)) {
    return "Please enter valid business hours (e.g., 09:00-17:00)";
  }
  return null;
};

const validateCNICImage = (file: File | null): string | null => {
  if (!file) {
    return "Image is required";
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return "Only JPG, JPEG, and PNG files are allowed";
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return "File size must not exceed 5MB";
  }

  return null;
};


const SellerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { seller } = useSellerAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const totalSteps = 8;

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== formData.password) return 'Passwords do not match';
    return undefined;
  };

  const validateBusinessName = (name: string): string | undefined => {
    if (!name) return 'Business name is required';
    if (name.length < 3) return 'Business name must be at least 3 characters long';
    if (name.length > 50) return 'Business name must not exceed 50 characters';
    if (!/^[\w\s\-&'.]+$/.test(name)) return 'Business name can only contain letters, numbers, spaces, and basic punctuation';
    return undefined;
  };

  const validateLegalName = (name: string): string | undefined => {
    if (!name) return 'Legal name is required';
    if (name.length < 3) return 'Legal name must be at least 3 characters long';
    if (name.length > 50) return 'Legal name must not exceed 50 characters';
    if (!/^[\w\s\-'.]+$/.test(name)) return 'Legal name can only contain letters, spaces, and basic punctuation';
    return undefined;
  };

  const validateShortDescription = (desc: string): string | undefined => {
    if (!desc) return 'Short description is required';
    if (desc.length < 10) return 'Short description must be at least 10 characters long';
    if (desc.length > 80) return 'Short description must not exceed 80 characters';
    return undefined;
  };

  const validateFullDescription = (desc: string): string | undefined => {
    if (!desc) return 'Full description is required';
    if (desc.length < 50) return 'Full description must be at least 50 characters long';
    if (desc.length > 1000) return 'Full description must not exceed 1000 characters';
    return undefined;
  };

  // Image validation functions
  const validateImageFile = (file: File): string | undefined => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image';
    }

    if (file.size > maxSize) {
      return 'Image size must not exceed 5MB';
    }

    return undefined;
  };

  const validateBrandImages = (): { logo?: string; banner?: string; bannerMobile?: string } => {
    const errors: { logo?: string; banner?: string; bannerMobile?: string } = {};

    if (!formData.logo_url) {
      errors.logo = 'Logo is required';
    }

    if (!formData.banner_url) {
      errors.banner = 'Landscape banner is required';
    }

    if (!formData.banner_mobile_url) {
      errors.bannerMobile = 'Portrait banner is required';
    }

    return errors;
  };

  // Store location validation functions
  const validateAddress = (address: string): string | undefined => {
    if (!address.trim()) {
      return 'Address is required';
    }
    if (address.length < 5) {
      return 'Address must be at least 5 characters long';
    }
    if (address.length > 200) {
      return 'Address must not exceed 200 characters';
    }
    return undefined;
  };

  const validateCity = (city: string): string | undefined => {
    if (!city.trim()) {
      return 'City is required';
    }
    if (!/^[a-zA-Z\s-]{2,50}$/.test(city)) {
      return 'City name must be 2-50 characters and contain only letters, spaces, and hyphens';
    }
    return undefined;
  };

  const validateState = (state: string): string | undefined => {
    if (!state.trim()) {
      return 'State is required';
    }
    if (!/^[a-zA-Z\s-]{2,50}$/.test(state)) {
      return 'State name must be 2-50 characters and contain only letters, spaces, and hyphens';
    }
    return undefined;
  };

  const validatePostalCode = (code: string): string | undefined => {
    if (!code) {
      return 'Postal code is required';
    }
    // Pakistan postal code format: 5 digits
    if (!/^\d{5}$/.test(code)) {
      return 'Postal code must be exactly 5 digits';
    }
    return undefined;
  };

  const validateCountry = (country: string): string | undefined => {
    if (!country.trim()) {
      return 'Country is required';
    }
    if (!/^[a-zA-Z\s-]{2,50}$/.test(country)) {
      return 'Country name must be 2-50 characters and contain only letters, spaces, and hyphens';
    }
    return undefined;
  };

  const validateCoordinates = (value: number, type: 'latitude' | 'longitude'): string | undefined => {
    if (value === 0) return undefined; // Optional field
    
    if (type === 'latitude') {
      if (value < -90 || value > 90) {
        return 'Latitude must be between -90 and 90 degrees';
      }
    } else {
      if (value < -180 || value > 180) {
        return 'Longitude must be between -180 and 180 degrees';
      }
    }
    return undefined;
  };

  const validatePickupHours = (hours: string, isPickupAvailable: boolean): string | undefined => {
    if (!isPickupAvailable) return undefined;
    
    if (!hours.trim()) {
      return 'Pickup hours are required when pickup is available';
    }
    if (hours.length < 5 || hours.length > 100) {
      return 'Pickup hours must be between 5 and 100 characters';
    }
    return undefined;
  };

  // Shipping settings validation functions
  const validateHandlingTime = (days: number): string | undefined => {
    if (days < 1) return 'Handling time must be at least 1 day';
    if (days > 14) return 'Handling time cannot exceed 14 days';
    return undefined;
  };

  const validateFreeShippingThreshold = (amount: number): string | undefined => {
    if (amount < 0) return 'Free shipping threshold cannot be negative';
    if (amount > 50000) return 'Free shipping threshold cannot exceed PKR 50,000';
    return undefined;
  };

  const validateShippingProfile = (profile: { profile_name: string; regions: string[]; shipping_rates: Array<{ delivery_method: string; estimated_days: number; rate: number; }> }): { 
    profile_name?: string;
    regions?: string;
    shipping_rates?: string;
  } => {
    const errors: { profile_name?: string; regions?: string; shipping_rates?: string; } = {};

    if (!profile.profile_name.trim()) {
      errors.profile_name = 'Profile name is required';
    } else if (profile.profile_name.length < 3 || profile.profile_name.length > 50) {
      errors.profile_name = 'Profile name must be between 3 and 50 characters';
    }

    if (!profile.regions.length) {
      errors.regions = 'Please select at least one region';
    }

    if (!profile.shipping_rates.length) {
      errors.shipping_rates = 'Please add at least one shipping rate';
    } else {
      for (const rate of profile.shipping_rates) {
        if (rate.estimated_days < 1 || rate.estimated_days > 30) {
          errors.shipping_rates = 'Estimated delivery days must be between 1 and 30';
          break;
        }
        if (rate.rate < 0 || rate.rate > 10000) {
          errors.shipping_rates = 'Shipping rate must be between 0 and 10,000 PKR';
          break;
        }
      }
    }

    return errors;
  };

  // Add bank details validation functions
  const validateBankName = (name: string): string | undefined => {
    if (!name) return 'Bank name is required';
    if (name.length < 2) return 'Bank name must be at least 2 characters long';
    if (name.length > 50) return 'Bank name must not exceed 50 characters';
    if (!/^[\w\s\-&'.]+$/.test(name)) return 'Bank name can only contain letters, numbers, spaces, and basic punctuation';
    return undefined;
  };

  const validateAccountTitle = (title: string): string | undefined => {
    if (!title) return 'Account title is required';
    if (title.length < 3) return 'Account title must be at least 3 characters long';
    if (title.length > 50) return 'Account title must not exceed 50 characters';
    if (!/^[\w\s\-'.]+$/.test(title)) return 'Account title can only contain letters, spaces, and basic punctuation';
    return undefined;
  };

  const validateAccountNumber = (number: string): string | undefined => {
    if (!number) return 'Account number is required';
    if (number.length < 8) return 'Account number must be at least 8 characters long';
    if (number.length > 20) return 'Account number must not exceed 20 characters';
    if (!/^\d+$/.test(number)) return 'Account number must contain only numbers';
    return undefined;
  };

  const validateIBAN = (iban: string): string | undefined => {
    if (!iban) return 'IBAN is required';
    if (!/^PK\d{2}[A-Z]{4}\d{16}$/.test(iban)) return 'Please enter a valid Pakistani IBAN (e.g., PK36SCBL0000001123456702)';
    return undefined;
  };

  const validateBranchCode = (code: string): string | undefined => {
    if (!code) return 'Branch code is required';
    if (!/^\d{4}$/.test(code)) return 'Branch code must be exactly 4 digits';
    return undefined;
  };

  const validateBranchAddress = (address: string): string | undefined => {
    if (!address) return 'Branch address is required';
    if (address.length < 5) return 'Branch address must be at least 5 characters long';
    if (address.length > 100) return 'Branch address must not exceed 100 characters';
    return undefined;
  };

  const validateSwiftCode = (code: string): string | undefined => {
    if (!code) return 'SWIFT code is required';
    if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(code)) return 'Please enter a valid SWIFT code (8 or 11 characters)';
    return undefined;
  };

  const validatePaymentMethod = (method: string): string | undefined => {
    if (!method) return 'Payment method is required';
    return undefined;
  };

  const validatePaymentSchedule = (schedule: string): string | undefined => {
    if (!schedule) return 'Payment schedule is required';
    return undefined;
  };

  const validatePaymentThreshold = (threshold: number): string | undefined => {
    if (threshold < 0) return 'Payment threshold cannot be negative';
    if (threshold > 1000000) return 'Payment threshold cannot exceed 1,000,000';
    return undefined;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate login credentials before proceeding
      const emailError = validateEmail(formData.email);
      const passwordError = validatePassword(formData.password);
      const confirmPasswordError = validateConfirmPassword(formData.confirmPassword);

      setFormData(prev => ({
        ...prev,
        formErrors: {
          ...prev.formErrors,
          email: emailError,
          password: passwordError,
          confirmPassword: confirmPasswordError
        }
      }));

      if (emailError || passwordError || confirmPasswordError) {
        return;
      }
    } else if (currentStep === 2) {
      // Validate business details before proceeding
      const businessNameError = validateBusinessName(formData.business_name);
      const legalNameError = validateLegalName(formData.legal_name);
      const shortDescError = validateShortDescription(formData.short_description);
      const fullDescError = validateFullDescription(formData.description);

      setFormData(prev => ({
        ...prev,
        formErrors: {
          ...prev.formErrors,
          business_name: businessNameError,
          legal_name: legalNameError,
          short_description: shortDescError,
          description: fullDescError
        }
      }));

      if (businessNameError || legalNameError || shortDescError || fullDescError) {
        return;
      }
    }

    if (currentStep === 3) {
      // Validate brand identity uploads
      const imageErrors = validateBrandImages();
      setFormData(prev => ({
        ...prev,
        formErrors: { ...prev.formErrors, ...imageErrors }
      }));

      if (Object.keys(imageErrors).length > 0) {
        return;
      }
    }

    if (currentStep === 4) {
      // Validate contact details
      const contactNameError = validateContactName(formData.contact.contact_person_name);
      const businessEmailError = validateBusinessEmail(formData.contact.email);
      const supportEmailError = validateSupportEmail(formData.contact.support_email);
      const phoneNumberError = validatePhoneNumber(formData.contact.phone_number);
      const alternatePhoneError = validateOptionalPhone(formData.contact.alternate_phone_number);

      setFormData(prev => ({
        ...prev,
        formErrors: {
          ...prev.formErrors,
          contact_person_name: contactNameError!,
          business_email: businessEmailError!,
          support_email: supportEmailError!,
          phone_number: phoneNumberError!,
          alternate_phone_number: alternatePhoneError!,
        }
      }));

      if (contactNameError || businessEmailError || supportEmailError || 
          phoneNumberError || alternatePhoneError) {
        return;
      }
    }

    // Store Location Validation Functions
    const validateAddress = (address: string): string => {
      if (!address) return "Address is required";
      if (address.trim().length < 5) return "Address must be at least 5 characters";
      if (address.trim().length > 200) return "Address must not exceed 200 characters";
      return "";
    };

    const validateCity = (city: string): string => {
      if (!city) return "City is required";
      if (city.trim().length < 2) return "City must be at least 2 characters";
      if (city.trim().length > 50) return "City must not exceed 50 characters";
      return "";
    };

    const validateState = (state: string): string => {
      if (!state) return "State/Province is required";
      if (state.trim().length < 2) return "State must be at least 2 characters";
      if (state.trim().length > 50) return "State must not exceed 50 characters";
      return "";
    };

    const validatePostalCode = (code: string): string => {
      if (!code) return "Postal code is required";
      const pakistaniPostalCodeRegex = /^\d{5}$/;
      if (!pakistaniPostalCodeRegex.test(code)) return "Please enter a valid 5-digit postal code";
      return "";
    };

    const validateLatitude = (lat: number): string => {
      if (lat === undefined || lat === null) return "Latitude is required";
      if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90 degrees";
      return "";
    };

    const validateLongitude = (lng: number): string => {
      if (lng === undefined || lng === null) return "Longitude is required";
      if (lng < -180 || lng > 180) return "Longitude must be between -180 and 180 degrees";
      return "";
    };

    if (currentStep === 5) {
      // Validate store location
      const addressError = validateAddress(formData.location.address);
      const cityError = validateCity(formData.location.city);
      const stateError = validateState(formData.location.state);
      const postalCodeError = validatePostalCode(formData.location.postal_code);
      const latitudeError = validateLatitude(formData.location.latitude);
      const longitudeError = validateLongitude(formData.location.longitude);
      // const pickupHoursError = formData.location.pickup_available ? validatePickupHours(formData.location.pickup_hours) : "";

      setFormData(prev => ({
        ...prev,
        formErrors: {
          ...prev.formErrors,
          address: addressError,
          city: cityError,
          state: stateError,
          postal_code: postalCodeError,
          latitude: latitudeError,
          longitude: longitudeError,
        }
      }));

      // Block progression if any validation errors exist
      if (addressError || cityError || stateError || postalCodeError || 
          latitudeError || longitudeError) {
        return;
      }
    }

    if (currentStep === 6) {
      // Validate business profile
      const businessTypeError = validateBusinessType(formData.business_details.business_type);
      const foundedYearError = validateFoundedYear(formData.business_details.founded_year);
      const employeeCountError = validateEmployeeCount(formData.business_details.number_of_employees);
      const businessCategoryError = validateBusinessCategory(formData.business_details.business_category);
      const subcategoryError = validateSubcategory(formData.business_details.business_subcategory);

      setFormData(prev => ({
        ...prev,
        formErrors: {
          ...prev.formErrors,
          business_type: businessTypeError,
          founded_year: foundedYearError,
          number_of_employees: employeeCountError,
          business_category: businessCategoryError,
          business_subcategory: subcategoryError
        }
      }));

      if (businessTypeError || foundedYearError || employeeCountError || 
          businessCategoryError || subcategoryError) {
        return;
      }
    }

    if (currentStep === 7) {
      // Validate KYC documents
      let hasErrors = false;

      if (!formData.kyc_documents.cnic_front) {
        setFormData(prev => ({
          ...prev,
          formErrors: {
            ...prev.formErrors,
            cnic_front: "CNIC front image is required"
          }
        }));
        hasErrors = true;
      }

      if (!formData.kyc_documents.cnic_back) {
        setFormData(prev => ({
          ...prev,
          formErrors: {
            ...prev.formErrors,
            cnic_back: "CNIC back image is required"
          }
        }));
        hasErrors = true;
      }

      if (hasErrors) {
        return;
      }
    }

    if (currentStep === 8) {
      // Validate shipping settings
      let hasErrors = false;
      const newFormErrors = { ...formData.formErrors };

      // Validate handling time
      const handlingTimeError = validateHandlingTime(formData.shipping_settings.default_handling_time);
      if (handlingTimeError) {
        newFormErrors.default_handling_time = handlingTimeError;
        hasErrors = true;
      }

      // Validate free shipping threshold
      const thresholdError = validateFreeShippingThreshold(formData.shipping_settings.free_shipping_threshold);
      if (thresholdError) {
        newFormErrors.free_shipping_threshold = thresholdError;
        hasErrors = true;
      }

      // Validate shipping profiles if self-shipping is selected
      if (formData.shipping_settings.self_shipping) {
        if (formData.shipping_settings.shipping_profiles.length === 0) {
          newFormErrors.shipping_profiles = 'At least one shipping profile is required';
          hasErrors = true;
        } else {
          formData.shipping_settings.shipping_profiles.forEach((profile, index) => {
            const profileErrors = validateShippingProfile(profile);
            if (Object.keys(profileErrors).length > 0) {
              newFormErrors[`shipping_profile_${index}`] = profileErrors;
              hasErrors = true;
            }
          });
        }
      }

      if (hasErrors) {
        setFormData(prev => ({
          ...prev,
          formErrors: newFormErrors
        }));
        return;
      }
    }

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
        const handleEmailChange = (value: string) => {
          const error = validateEmail(value);
          setFormData(prev => ({
            ...prev,
            email: value,
            formErrors: { ...prev.formErrors, email: error }
          }));
        };

        const handlePasswordChange = (value: string) => {
          const error = validatePassword(value);
          setFormData(prev => ({
            ...prev,
            password: value,
            formErrors: { ...prev.formErrors, password: error }
          }));
        };

        const handleConfirmPasswordChange = (value: string) => {
          const error = validateConfirmPassword(value);
          setFormData(prev => ({
            ...prev,
            confirmPassword: value,
            formErrors: { ...prev.formErrors, confirmPassword: error }
          }));
        };

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
              onChange={handleEmailChange}
              required
              placeholder="Enter your email address"
              error={formData.formErrors.email}
            />
            <FormInput
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handlePasswordChange}
              required
              placeholder="Choose a strong password"
              error={formData.formErrors.password}
              showPasswordStrength
            />
            <FormInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              placeholder="Confirm your password"
              error={formData.formErrors.confirmPassword}
            />
          </FormStep>
        );
      case 2:

        const handleBusinessNameChange = (value: string) => {
          const error = validateBusinessName(value);
          setFormData(prev => ({
            ...prev,
            business_name: value,
            formErrors: { ...prev.formErrors, business_name: error }
          }));
        };

        const handleLegalNameChange = (value: string) => {
          const error = validateLegalName(value);
          setFormData(prev => ({
            ...prev,
            legal_name: value,
            formErrors: { ...prev.formErrors, legal_name: error }
          }));
        };

        const handleShortDescriptionChange = (value: string) => {
          const error = validateShortDescription(value);
          setFormData(prev => ({
            ...prev,
            short_description: value,
            formErrors: { ...prev.formErrors, short_description: error }
          }));
        };

        const handleFullDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const value = e.target.value;
          const error = validateFullDescription(value);
          setFormData(prev => ({
            ...prev,
            description: value,
            formErrors: { ...prev.formErrors, description: error }
          }));
        };

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
              onChange={handleBusinessNameChange}
              required
              placeholder="Your business name"
              error={formData.formErrors.business_name}
              maxLength={50}
              helperText="Use your registered business name or brand name"
            />
            <FormInput
              id="legal_name"
              label="Your Legal Name"
              value={formData.legal_name}
              onChange={handleLegalNameChange}
              required
              placeholder="Legal registered name of the person onboarding"
              error={formData.formErrors.legal_name}
              maxLength={50}
              helperText="Enter your full legal name as it appears on official documents"
            />
            <FormInput
              id="short_description"
              label="Short Description"
              value={formData.short_description}
              onChange={handleShortDescriptionChange}
              required
              maxLength={80}
              placeholder="Brief description of your business"
              error={formData.formErrors.short_description}
              helperText={`${formData.short_description.length}/80 characters - This will appear in search results`}
            />
            <div className="space-y-1">
              <label htmlFor="fullDescription" className="block text-sm font-medium text-neutral-400">
                Full Description<span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="fullDescription"
                value={formData.description}
                onChange={handleFullDescriptionChange}
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 bg-background border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Detailed description of your business"
                required
              />
              <div className="flex justify-between mt-1">
                <span className="text-sm text-neutral-400">
                  {formData.description.length}/1000 characters
                </span>
                {formData.formErrors.description && (
                  <span className="text-sm text-red-500">{formData.formErrors.description}</span>
                )}
              </div>
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
                  <label className={`w-full flex flex-col items-center px-4 py-6 bg-background rounded-lg border-2 border-dashed ${formData.formErrors.logo ? 'border-red-500' : 'border-neutral-700'} cursor-pointer hover:border-primary`}>
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">
                      {formData.logo_url ? 'Logo uploaded successfully' : 'Choose a logo (JPEG, PNG, WebP, max 5MB)'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const error = validateImageFile(file);
                          if (error) {
                            setFormData({
                              ...formData,
                              formErrors: { ...formData.formErrors, logo: error }
                            });
                            return;
                          }
                          try {
                            const url = await api.uploadFileAndGetUrl(file);
                            setFormData({
                              ...formData,
                              logo_url: url,
                              formErrors: { ...formData.formErrors, logo: undefined }
                            });
                          } catch (error) {
                            setFormData({
                              ...formData,
                              formErrors: { ...formData.formErrors, logo: 'Failed to upload logo. Please try again.' }
                            });
                          }
                        }
                      }}
                      required
                    />
                  </label>
                </div>
                {formData.formErrors.logo && (
                  <p className="mt-1 text-sm text-red-500">{formData.formErrors.logo}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-400">
                  Landscape Banner Upload<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className={`w-full flex flex-col items-center px-4 py-6 bg-background rounded-lg border-2 border-dashed ${formData.formErrors.banner ? 'border-red-500' : 'border-neutral-700'} cursor-pointer hover:border-primary`}>
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">
                      {formData.banner_url ? 'Banner uploaded successfully' : 'Choose a landscape banner (JPEG, PNG, WebP, max 5MB)'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const error = validateImageFile(file);
                          if (error) {
                            setFormData({
                              ...formData,
                              formErrors: { ...formData.formErrors, banner: error }
                            });
                            return;
                          }
                          try {
                            const url = await api.uploadFileAndGetUrl(file);
                            setFormData({
                              ...formData,
                              banner_url: url,
                              formErrors: { ...formData.formErrors, banner: undefined }
                            });
                          } catch (error) {
                            setFormData({
                              ...formData,
                              formErrors: { ...formData.formErrors, banner: 'Failed to upload banner. Please try again.' }
                            });
                          }
                        }
                      }}
                      required
                    />
                  </label>
                </div>
                {formData.formErrors.banner && (
                  <p className="mt-1 text-sm text-red-500">{formData.formErrors.banner}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-400">
                  Portrait Banner Upload (3:4 aspect ratio)<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className={`w-full flex flex-col items-center px-4 py-6 bg-background rounded-lg border-2 border-dashed ${formData.formErrors.bannerMobile ? 'border-red-500' : 'border-neutral-700'} cursor-pointer hover:border-primary`}>
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">
                      {formData.banner_mobile_url ? 'Portrait banner uploaded successfully' : 'Choose a portrait banner (JPEG, PNG, WebP, max 5MB)'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const error = validateImageFile(file);
                          if (error) {
                            setFormData({
                              ...formData,
                              formErrors: { ...formData.formErrors, bannerMobile: error }
                            });
                            return;
                          }
                          try {
                            const url = await api.uploadFileAndGetUrl(file);
                            setFormData({
                              ...formData,
                              banner_mobile_url: url,
                              formErrors: { ...formData.formErrors, bannerMobile: undefined }
                            });
                          } catch (error) {
                            setFormData({
                              ...formData,
                              formErrors: { ...formData.formErrors, bannerMobile: 'Failed to upload portrait banner. Please try again.' }
                            });
                          }
                        }
                      }}
                      required
                    />
                  </label>
                </div>
                {formData.formErrors.bannerMobile && (
                  <p className="mt-1 text-sm text-red-500">{formData.formErrors.bannerMobile}</p>
                )}
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
              onChange={(value) => {
                //const newFormData = formData;
                //newFormData.contact.contact_person_name = value;
                const error = validateContactName(value);
                //newFormData.formErrors.
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, contact_person_name: value },
                  // formErrors: { ...formData.formErrors, contact_person_name: error }
                });
              }}
              required
              placeholder="Full name of contact person"
              error={formData.formErrors.contact_person_name}
              helperText="Enter the full name of the primary contact person"
            />

            <FormInput
              id="businessEmail"
              label="Business Email"
              type="email"
              value={formData.contact.email}
              onChange={(value) => {
                const error = validateBusinessEmail(value);
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, email: value },
                  formErrors: { ...formData.formErrors, business_email: error }
                });
              }}
              required
              placeholder="your@business.com"
              error={formData.formErrors.business_email}
              helperText="This email will be used for business communications"
            />

            <FormInput
              id="support_email"
              label="Support Email (Optional)"
              type="email"
              value={formData.contact.support_email}
              onChange={(value) => {
                const error = validateSupportEmail(value);
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, support_email: value },
                  formErrors: { ...formData.formErrors, support_email: error }
                });
              }}
              placeholder="support@business.com"
              error={formData.formErrors.support_email}
              helperText="Separate email for customer support inquiries"
            />

            <FormInput
              id="phone_number"
              label="Phone Number"
              type="tel"
              value={formData.contact.phone_number}
              onChange={(value) => {
                const error = validatePhoneNumber(value);
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, phone_number: value },
                  formErrors: { ...formData.formErrors, phone_number: error }
                });
              }}
              required
              placeholder="+92 XXX XXXXXXX"
              error={formData.formErrors.phone_number}
              helperText="Primary contact number in Pakistani format"
            />

            <FormInput
              id="alternatePhone"
              label="Alternate Phone Number (Optional)"
              type="tel"
              value={formData.contact.alternate_phone_number}
              onChange={(value) => {
                const error = validateOptionalPhone(value);
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, alternate_phone_number: value },
                  formErrors: { ...formData.formErrors, alternate_phone_number: error }
                });
              }}
              placeholder="+92 XXX XXXXXXX"
              error={formData.formErrors.alternate_phone_number}
              helperText="Secondary contact number (optional)"
            />

            <FormInput
              id="whatsappNumber"
              label="WhatsApp Number (Optional)"
              type="tel"
              value={formData.contact.whatsapp_number}
              onChange={(value) => {
                const error = validateOptionalPhone(value);
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, whatsapp_number: value },
                  formErrors: { ...formData.formErrors, whatsapp_number: error }
                });
              }}
              placeholder="+92 XXX XXXXXXX"
              error={formData.formErrors.whatsapp_number}
              helperText="WhatsApp number for business communications (optional)"
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
          <>
          <FormStep
            title="Store Location"
            subtitle="Where is your business located?"
            icon={<MapPin size={32} className="text-primary" />}
          >
            <FormInput
              id="address"
              label="Address"
              value={formData.location.address}
              onChange={(value) => {
                const error = validateAddress(value);
                setFormData({
                  ...formData,
                  location: { ...formData.location, address: value },
                  formErrors: { ...formData.formErrors, address: error }
                });
              }}
              required
              placeholder="Street address"
              error={formData.formErrors.address}
              helperText="Enter complete street address (5-200 characters)"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="city"
                label="City"
                value={formData.location.city}
                onChange={(value) => {
                  const error = validateCity(value);
                  setFormData({
                    ...formData,
                    location: { ...formData.location, city: value },
                    formErrors: { ...formData.formErrors, city: error }
                  });
                }}
                required
                placeholder="City"
                error={formData.formErrors.city}
                helperText="Enter city name"
              />

              <FormInput
                id="state"
                label="State/Province"
                value={formData.location.state}
                onChange={(value) => {
                  const error = validateState(value);
                  setFormData({
                    ...formData,
                    location: { ...formData.location, state: value },
                    formErrors: { ...formData.formErrors, state: error }
                  });
                }}
                required
                placeholder="e.g. Punjab"
                error={formData.formErrors.state}
                helperText="Enter state or province name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="postal_code"
                label="Postal Code"
                type="text"
                value={formData.location.postal_code}
                onChange={(value) => {
                  const error = validatePostalCode(value);
                  setFormData({
                    ...formData,
                    location: { ...formData.location, postal_code: value },
                    formErrors: { ...formData.formErrors, postal_code: error }
                  });
                }}
                required
                placeholder="12345"
                error={formData.formErrors.postal_code}
                helperText="Enter 5-digit postal code"
              />

              <FormInput
                id="country"
                label="Country"
                value={formData.location.country}
                disabled
                helperText="Currently only available in Pakistan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="latitude"
                label="Latitude"
                type="number"
                value={formData.location.latitude.toString()}
                onChange={(value) => {
                  const numValue = parseFloat(value) || 0;
                  const error = validateLatitude(numValue);
                  setFormData({
                    ...formData,
                    location: { ...formData.location, latitude: numValue },
                    formErrors: { ...formData.formErrors, latitude: error }
                  });
                }}
                required
                placeholder="e.g. 31.5204"
                error={formData.formErrors.latitude}
                helperText="Value between -90 and 90 degrees"
              />

              <FormInput
                id="longitude"
                label="Longitude"
                type="number"
                value={formData.location.longitude.toString()}
                onChange={(value) => {
                  const numValue = parseFloat(value) || 0;
                  const error = validateLongitude(numValue);
                  setFormData({
                    ...formData,
                    location: { ...formData.location, longitude: numValue },
                    formErrors: { ...formData.formErrors, longitude: error }
                  });
                }}
                required
                placeholder="e.g. 74.3587"
                error={formData.formErrors.longitude}
                helperText="Value between -180 and 180 degrees"
              />
            </div>
            
            <div>

              <FormInput
                id="country"
                label="Country"
                value={formData.location.country}
                onChange={(value) => {
                  const error = validateCountry(value);
                  setFormData({
                    ...formData,
                    location: { ...formData.location, country: value },
                    formErrors: { ...formData.formErrors, country: error }
                  });
                }}
                required
                placeholder="Country"
                error={formData.formErrors.country}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="postal_code"
                label="Postal Code"
                value={formData.location.postal_code}
                onChange={(value) => {
                  const error = validatePostalCode(value);
                  setFormData({
                    ...formData,
                    location: { ...formData.location, postal_code: value },
                    formErrors: { ...formData.formErrors, postal_code: error }
                  });
                }}
                required
                placeholder="12345"
                error={formData.formErrors.postal_code}
                helperText="Enter 5-digit postal code"
              />

              <FormInput
                id="country"
                label="Country"
                value={formData.location.country}
                disabled
                helperText="Currently only available in Pakistan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="latitude"
                label="Latitude (Optional)"
                value={formData.location.latitude as unknown as string}
                onChange={(value) => {
                  const parsedValue = parseFloat(value) || 0;
                  const error = validateCoordinates(parsedValue, 'latitude');
                  setFormData({
                    ...formData,
                    location: { ...formData.location, latitude: parsedValue },
                    formErrors: { ...formData.formErrors, latitude: error }
                  });
                }}
                placeholder="e.g. 31.5204"
                error={formData.formErrors.latitude}
                helperText="Value between -90 and 90 degrees"
              />

              <FormInput
                id="longitude"
                label="Longitude (Optional)"
                value={formData.location.longitude as unknown as string}
                onChange={(value) => {
                  const parsedValue = parseFloat(value) || 0;
                  const error = validateCoordinates(parsedValue, 'longitude');
                  setFormData({
                    ...formData,
                    location: { ...formData.location, longitude: parsedValue },
                    formErrors: { ...formData.formErrors, longitude: error }
                  });
                }}
                placeholder="e.g. 74.3587"
                error={formData.formErrors.longitude}
                helperText="Value between -180 and 180 degrees"
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
                  onChange={(value) => {
                    const error = validatePickupHours(value, formData.location.pickup_available);
                    setFormData({
                      ...formData,
                      location: { ...formData.location, pickup_hours: value },
                      formErrors: { ...formData.formErrors, pickup_hours: error }
                    });
                  }}
                  required
                  placeholder="e.g. Same as business hours"
                  error={formData.formErrors.pickup_hours}
                  helperText="Specify hours when pickup is available (5-100 characters)"
                />
              )}
            </div>
          </FormStep>
          </>
        );
      // Validation functions for business profile
const validateBusinessType = (type: string): string => {
  if (!type) return "Business type is required";
  return "";
};

const validateFoundedYear = (year: number): string => {
  const currentYear = new Date().getFullYear();
  if (!year) return "Founded year is required";
  if (year < 1900 || year > currentYear) return `Year must be between 1900 and ${currentYear}`;
  return "";
};

const validateEmployeeCount = (count: string): string => {
  if (!count) return "Number of employees is required";
  return "";
};

const validateBusinessCategory = (category: string): string => {
  if (!category) return "Business category is required";
  return "";
};

const validateSubcategory = (subcategory: string): string => {
  if (!subcategory) return "Subcategory is required";
  if (subcategory.length < 2) return "Subcategory must be at least 2 characters";
  if (subcategory.length > 50) return "Subcategory must not exceed 50 characters";
  return "";
};

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
              const value = e.target.value;
              const error = validateBusinessType(value);
              setFormData({
                ...formData,
                business_details: { ...formData.business_details, business_type: value },
                formErrors: { ...formData.formErrors, business_type: error }
              });
            }}
            className={`w-full px-3 py-2 bg-background border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              formData.formErrors.business_type ? 'border-red-500' : 'border-neutral-700'
            }`}
            required
          >
            <option value="">Select business type</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership">Partnership</option>
            <option value="Private Limited">Private Limited</option>
            <option value="Public Limited">Public Limited</option>
            <option value="Other">Other</option>
          </select>
          {formData.formErrors.business_type && (
            <p className="mt-1 text-sm text-red-500">{formData.formErrors.business_type}</p>
          )}
        </div>

        <FormInput
          id="founded_year"
          label="Founded Year"
          type="number"
          value={formData.business_details.founded_year as unknown as string}
          onChange={(value) => {
            const yearValue = parseInt(value) || 0;
            const error = validateFoundedYear(yearValue);
            setFormData({
              ...formData,
              business_details: { ...formData.business_details, founded_year: yearValue },
              formErrors: { ...formData.formErrors, founded_year: error }
            });
          }}
          required
          placeholder="e.g. 2020"
          error={formData.formErrors.founded_year}
          helperText={`Enter a year between 1900 and ${new Date().getFullYear()}`}
        />

        <div className="space-y-1">
          <label htmlFor="employeeCount" className="block text-sm font-medium text-neutral-400">
            Number of Employees<span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="employeeCount"
            value={formData.business_details.number_of_employees}
            onChange={(e) => {
              const value = e.target.value;
              const error = validateEmployeeCount(value);
              setFormData({
                ...formData,
                business_details: { ...formData.business_details, number_of_employees: value },
                formErrors: { ...formData.formErrors, number_of_employees: error }
              });
            }}
            className={`w-full px-3 py-2 bg-background border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              formData.formErrors.number_of_employees ? 'border-red-500' : 'border-neutral-700'
            }`}
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
          {formData.formErrors.number_of_employees && (
            <p className="mt-1 text-sm text-red-500">{formData.formErrors.number_of_employees}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="business_category" className="block text-sm font-medium text-neutral-400">
            Business Category<span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="business_category"
            value={formData.business_details.business_category}
            onChange={(e) => {
              const value = e.target.value;
              const error = validateBusinessCategory(value);
              setFormData({
                ...formData,
                business_details: { ...formData.business_details, business_category: value },
                formErrors: { ...formData.formErrors, business_category: error }
              });
            }}
            className={`w-full px-3 py-2 bg-background border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              formData.formErrors.business_category ? 'border-red-500' : 'border-neutral-700'
            }`}
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
          {formData.formErrors.business_category && (
            <p className="mt-1 text-sm text-red-500">{formData.formErrors.business_category}</p>
          )}
        </div>

        <FormInput
          id="subcategory"
          label="Subcategory"
          value={formData.business_details.business_subcategory}
          onChange={(value) => {
            const error = validateSubcategory(value);
            setFormData({
              ...formData,
              business_details: { ...formData.business_details, business_subcategory: value },
              formErrors: { ...formData.formErrors, business_subcategory: error }
            });
          }}
          required
          placeholder="e.g. Women's Clothing, Smartphones"
          error={formData.formErrors.business_subcategory}
          helperText="Enter a specific subcategory (2-50 characters)"
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
                  <label className={`w-full flex flex-col items-center px-4 py-6 bg-background rounded-lg border-2 border-dashed ${
                    formData.formErrors.cnic_front ? 'border-red-500' : 'border-neutral-700'
                  } cursor-pointer hover:border-primary`}>
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">
                      {formData.kyc_documents.cnic_front ? formData.kyc_documents.cnic_front : 'Upload CNIC front'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        const error = validateCNICImage(file);
                        
                        if (file && !error) {
                          try {
                            const url = await api.uploadFileAndGetUrl(file);
                            setFormData({
                              ...formData,
                              kyc_documents: { ...formData.kyc_documents, cnic_front: url },
                              formErrors: { ...formData.formErrors, cnic_front: "" }
                            });
                          } catch (err) {
                            setFormData({
                              ...formData,
                              formErrors: { ...formData.formErrors, cnic_front: "Failed to upload image. Please try again." }
                            });
                          }
                        } else {
                          setFormData({
                            ...formData,
                            formErrors: { ...formData.formErrors, cnic_front: error }
                          });
                        }
                      }}
                      required
                    />
                  </label>
                </div>
                {formData.formErrors.cnic_front && (
                  <p className="mt-1 text-sm text-red-500">{formData.formErrors.cnic_front}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-400">
                  Upload CNIC Back<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className={`w-full flex flex-col items-center px-4 py-6 bg-background rounded-lg border-2 border-dashed ${
                    formData.formErrors.cnic_back ? 'border-red-500' : 'border-neutral-700'
                  } cursor-pointer hover:border-primary`}>
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">
                      {formData.kyc_documents.cnic_back ? formData.kyc_documents.cnic_back : 'Upload CNIC back'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        const error = validateCNICImage(file);
                        
                        if (file && !error) {
                          try {
                            const url = await api.uploadFileAndGetUrl(file);
                            setFormData({
                              ...formData,
                              kyc_documents: { ...formData.kyc_documents, cnic_back: url },
                              formErrors: { ...formData.formErrors, cnic_back: "" }
                            });
                          } catch (err) {
                            setFormData({
                              ...formData,
                              formErrors: { ...formData.formErrors, cnic_back: "Failed to upload image. Please try again." }
                            });
                          }
                        } else {
                          setFormData({
                            ...formData,
                            formErrors: { ...formData.formErrors, cnic_back: error }
                          });
                        }
                      }}
                      required
                    />
                  </label>
                </div>
                {formData.formErrors.cnic_back && (
                  <p className="mt-1 text-sm text-red-500">{formData.formErrors.cnic_back}</p>
                )}
              </div>

              <p className="text-sm text-neutral-400 text-center">
                Please ensure your CNIC images are clear and all details are visible. Supported formats: JPG, JPEG, PNG (max 5MB)
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
                            const errors = validateShippingProfile(newProfiles[index]);
                            setFormData({
                              ...formData,
                              shipping_settings: { ...formData.shipping_settings, shipping_profiles: newProfiles },
                              formErrors: {
                                ...formData.formErrors,
                                [`shipping_profile_${index}`]: errors
                              }
                            });
                          }}
                          required
                          placeholder="e.g., Standard Shipping"
                          error={formData.formErrors[`shipping_profile_${index}`]?.profile_name}
                          helperText="Profile name must be between 3 and 50 characters"
                        />

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-neutral-400">
                            Regions<span className="text-red-500 ml-1">*</span>
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
                              const errors = validateShippingProfile(newProfiles[index]);
                              setFormData({
                                ...formData,
                                shipping_settings: { ...formData.shipping_settings, shipping_profiles: newProfiles },
                                formErrors: {
                                  ...formData.formErrors,
                                  [`shipping_profile_${index}`]: errors
                                }
                              });
                            }}
                            className={`w-full px-3 py-2 bg-background border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                              formData.formErrors[`shipping_profile_${index}`]?.regions ? 'border-red-500' : 'border-neutral-700'
                            }`}
                          >
                            <option value="Punjab">Punjab</option>
                            <option value="Sindh">Sindh</option>
                            <option value="KPK">KPK</option>
                            <option value="Balochistan">Balochistan</option>
                            <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                            <option value="AJK">AJK</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="postal_code"
                label="Postal Code"
                value={formData.location.postal_code}
                onChange={(value) => {
                  const error = validatePostalCode(value);
                  setFormData({
                    ...formData,
                    location: { ...formData.location, postal_code: value },
                    formErrors: { ...formData.formErrors, postal_code: error }
                  });
                }}
                required
                placeholder="12345"
                error={formData.formErrors.postal_code}
                helperText="Enter 5-digit postal code"
              />

              <FormInput
                id="country"
                label="Country"
                value={formData.location.country}
                disabled
                helperText="Currently only available in Pakistan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                          <FormInput
                            id={`delivery-days-${index}`}
                            label="Delivery Days"
                            type="number"
                            value={profile.delivery_days?.toString() || ''}
                            onChange={(value) => {
                              const newProfiles = [...formData.shipping_settings.shipping_profiles];
                              newProfiles[index] = { ...profile, delivery_days: parseInt(value) || 0 };
                              const errors = validateShippingProfile(newProfiles[index]);
                              setFormData({
                                ...formData,
                                shipping_settings: { ...formData.shipping_settings, shipping_profiles: newProfiles },
                                formErrors: {
                                  ...formData.formErrors,
                                  [`shipping_profile_${index}`]: errors
                                }
                              });
                            }}
                            required
                            placeholder="e.g., 3"
                            error={formData.formErrors[`shipping_profile_${index}`]?.delivery_days}
                            helperText="Delivery days must be between 1 and 30 days"
                          />
                          <FormInput
                            id={`shipping-rate-${index}`}
                            label="Shipping Rate (PKR)"
                            type="number"
                            value={profile.shipping_rate?.toString() || ''}
                            onChange={(value) => {
                              const newProfiles = [...formData.shipping_settings.shipping_profiles];
                              newProfiles[index] = { ...profile, shipping_rate: parseInt(value) || 0 };
                              const errors = validateShippingProfile(newProfiles[index]);
                              setFormData({
                                ...formData,
                                shipping_settings: { ...formData.shipping_settings, shipping_profiles: newProfiles },
                                formErrors: {
                                  ...formData.formErrors,
                                  [`shipping_profile_${index}`]: errors
                                }
                              });
                            }}
                            required
                            placeholder="e.g., 250"
                            error={formData.formErrors[`shipping_profile_${index}`]?.shipping_rate}
                            helperText="Shipping rate must be between 0 and 10,000 PKR"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newProfiles = formData.shipping_settings.shipping_profiles.filter((_, i) => i !== index);
                            setFormData({
                              ...formData,
                              shipping_settings: { ...formData.shipping_settings, shipping_profiles: newProfiles },
                              formErrors: {
                                ...formData.formErrors,
                                [`shipping_profile_${index}`]: undefined
                              }
                            });
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
                  const days = parseInt(value) || 1;
                  const error = validateHandlingTime(days);
                  setFormData({
                    ...formData,
                    shipping_settings: { ...formData.shipping_settings, default_handling_time: days },
                    formErrors: { ...formData.formErrors, default_handling_time: error }
                  });
                }}
                required
                placeholder="e.g., 2"
                error={formData.formErrors.default_handling_time}
                helperText="Handling time must be between 1 and 14 days"
              />

              <FormInput
                id="free_shipping_threshold"
                label="Free Shipping Threshold (PKR)"
                type="number"
                value={formData.shipping_settings.free_shipping_threshold.toString()}
                onChange={(value) => {
                  const amount = parseInt(value) || 0;
                  const error = validateFreeShippingThreshold(amount);
                  setFormData({
                    ...formData,
                    shipping_settings: { ...formData.shipping_settings, free_shipping_threshold: amount },
                    formErrors: { ...formData.formErrors, free_shipping_threshold: error }
                  });
                }}
                required
                placeholder="e.g., 2000"
                error={formData.formErrors.free_shipping_threshold}
                helperText="Enter amount between 0 and 50,000 PKR"
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