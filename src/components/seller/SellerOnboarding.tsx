import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Loader, Upload, FileText, Camera, MapPin } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import * as SellerApi from '../../api/sellerApi';
import { uploadFileAndGetUrl } from '../../api/sellerApi';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  formErrors: Record<string, string>;
  business_name: string;
  legal_name: string;
  description: string;
  short_description: string;
  logo_url: string | null;
  banner_url: string | null;
  banner_mobile_url: string | null;
  contact: {
    contact_person_name: string;
    email: string;
    support_email: string;
    phone_number: string;
    alternate_phone_number: string;
    whatsapp: string;
    business_hours: string;
  };
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
  business_details: {
    business_type: string;
    founded_year: number;
    number_of_employees: string;
    business_category: string;
    business_subcategory: string;
  };
  kyc_documents: {
    cnic_front: string | null;
    cnic_back: string | null;
  };
  bank_details: {
    bank_name: string;
    account_title: string;
    account_number: string;
    iban: string;
    branch_code: string;
    branch_address: string;
    swift_code: string;
    payment_method: string;
    payment_schedule: string;
    payment_threshold: number;
  };
  shipping_settings: {
    default_handling_time: number;
    free_shipping_threshold: number;
    platform_shipping: boolean;
    self_shipping: boolean;
    shipping_profiles: any[];
  };
  return_policy: string;
  categories: string[];
  tags: string[];
  status: string;
  verified: boolean;
  contract_agreed: boolean;
}

interface LoadingStates {
  logo: boolean;
  banner: boolean;
  cnic_front: boolean;
  cnic_back: boolean;
  businessLicense: boolean;
}

// ─── Password strength meter ───────────────────────────────────────────────
const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ['', 'Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
  const barColor = strength <= 2 ? 'bg-red-500' : strength === 3 ? 'bg-yellow-400' : 'bg-green-400';
  const textColor = strength <= 2 ? 'text-red-400' : strength === 3 ? 'text-yellow-400' : 'text-green-400';
  return (
    <div className="mt-2.5 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? barColor : 'bg-white/[0.07]'}`} />
        ))}
      </div>
      {strength > 0 && <p className={`text-xs ${textColor}`}>{labels[strength]}</p>}
    </div>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────
const SellerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState<{ step: number; draft_data: any } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: '', password: '', confirmPassword: '', formErrors: {},
    business_name: '', legal_name: '', description: '', short_description: '',
    logo_url: null, banner_url: null, banner_mobile_url: null,
    contact: { contact_person_name: '', email: '', support_email: '', phone_number: '', alternate_phone_number: '', whatsapp: '', business_hours: '9:00 AM – 6:00 PM' },
    location: { address: '', city: '', state: '', postal_code: '', country: 'Pakistan', latitude: 0, longitude: 0, neighborhood: '', store_directions: '', pickup_available: false, pickup_hours: '' },
    business_details: { business_type: '', founded_year: new Date().getFullYear(), number_of_employees: '', business_category: 'Fashion', business_subcategory: '' },
    kyc_documents: { cnic_front: null, cnic_back: null },
    bank_details: { bank_name: '', account_title: '', account_number: '', iban: '', branch_code: '', branch_address: '', swift_code: '', payment_method: 'bank_transfer', payment_schedule: 'monthly', payment_threshold: 5000 },
    shipping_settings: { default_handling_time: 1, free_shipping_threshold: 0, platform_shipping: true, self_shipping: false, shipping_profiles: [] },
    return_policy: 'Standard 7-day return policy applies to all items.',
    categories: [], tags: [], status: 'pending', verified: false, contract_agreed: false,
  });

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({ logo: false, banner: false, cnic_front: false, cnic_back: false, businessLicense: false });

  useEffect(() => {
    const stateEmail = (location.state as { prefillEmail?: string } | null)?.prefillEmail;
    const queryEmail = searchParams.get('email');
    const nextEmail = stateEmail || queryEmail || '';

    if (!nextEmail) return;

    setFormData(p => {
      if (p.email === nextEmail && p.contact.email === nextEmail) {
        return p;
      }

      return {
        ...p,
        email: nextEmail,
        contact: {
          ...p.contact,
          email: p.contact.email || nextEmail,
        },
      };
    });
  }, [location.state, searchParams]);

  // ─── Constants ─────────────────────────────────────────────────────────────
  const businessTypes = ['Fashion Brand', 'Accessories Designer', 'Textile Company', 'Fashion Retailer', 'Clothing Manufacturer', 'Other'];
  const pakistanCities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana'];
  const pakistanStates = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir', 'Islamabad Capital Territory'];
  const employeeRanges = ['1–5', '6–10', '11–25', '26–50', '51–100', '100+'];

  // ─── Styling constants ─────────────────────────────────────────────────────
  const ic = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-4 text-white text-base placeholder-white/[0.22] focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all";
  const sc = `${ic} appearance-none cursor-pointer`;
  const lc = "block text-xs font-bold text-white/35 uppercase tracking-widest mb-2.5";

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleFileUpload = async (file: File, type: keyof LoadingStates) => {
    if (!file) return;
    setLoadingStates(p => ({ ...p, [type]: true }));
    try {
      const url = await uploadFileAndGetUrl(file);
      if (type === 'logo') setFormData(p => ({ ...p, logo_url: url }));
      else if (type === 'banner') setFormData(p => ({ ...p, banner_url: url }));
      else if (type === 'cnic_front') setFormData(p => ({ ...p, kyc_documents: { ...p.kyc_documents, cnic_front: url } }));
      else if (type === 'cnic_back') setFormData(p => ({ ...p, kyc_documents: { ...p.kyc_documents, cnic_back: url } }));
    } catch {
      alert(`Upload failed. Please try again.`);
    } finally {
      setLoadingStates(p => ({ ...p, [type]: false }));
    }
  };

  const openLocationPicker = () => {
    const addr = `${formData.location.address}, ${formData.location.city}, ${formData.location.state}, Pakistan`;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(addr)}`, '_blank');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: return !!(formData.email && formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8);
      case 1: return !!(formData.business_name && formData.business_details.business_type && formData.contact.contact_person_name && formData.contact.phone_number);
      case 2: return !!(formData.location.address && formData.location.city && formData.location.state && formData.location.postal_code);
      case 3: return !!(formData.logo_url && formData.kyc_documents.cnic_front && formData.kyc_documents.cnic_back);
      case 4: return !!(formData.bank_details.bank_name && formData.bank_details.account_title && formData.bank_details.account_number && formData.bank_details.iban);
      case 5: return formData.contract_agreed;
      default: return true;
    }
  };

  const saveDraft = async (step: number) => {
    if (!formData.email) return;
    const { password: _p, confirmPassword: _c, formErrors: _e, contract_agreed: _a, status: _s, verified: _v, shipping_settings: _ss, return_policy: _r, categories: _cat, tags: _t, ...draftable } = formData;
    try { await SellerApi.Auth.SaveDraft(formData.email, step, draftable); } catch { /* silent */ }
  };

  const buildRegisterPayload = (): SellerApi.Auth.RegisterRequest => ({
    name: formData.contact.contact_person_name || formData.business_name,
    email: formData.email, password: formData.password,
    legal_name: formData.legal_name || formData.business_name,
    business_name: formData.business_name,
    ...(formData.description && { description: formData.description }),
    ...(formData.short_description && { short_description: formData.short_description }),
    ...(formData.logo_url && { logo_url: formData.logo_url }),
    ...(formData.banner_url && { banner_url: formData.banner_url }),
    ...(formData.banner_mobile_url && { banner_mobile_url: formData.banner_mobile_url }),
    contact: {
      phone_number: formData.contact.phone_number,
      contact_person_name: formData.contact.contact_person_name,
      ...(formData.contact.alternate_phone_number && { alternate_phone_number: formData.contact.alternate_phone_number }),
      ...(formData.contact.whatsapp && { whatsapp: formData.contact.whatsapp }),
      ...(formData.contact.support_email && { support_email: formData.contact.support_email }),
      ...(formData.contact.business_hours && { business_hours: formData.contact.business_hours }),
    },
    location: {
      address: formData.location.address, city: formData.location.city,
      state: formData.location.state, postal_code: formData.location.postal_code,
      country: formData.location.country,
      ...(formData.location.latitude && { latitude: formData.location.latitude }),
      ...(formData.location.longitude && { longitude: formData.location.longitude }),
      ...(formData.location.neighborhood && { neighborhood: formData.location.neighborhood }),
      ...(formData.location.store_directions && { store_directions: formData.location.store_directions }),
      pickup_available: formData.location.pickup_available,
      ...(formData.location.pickup_hours && { pickup_hours: formData.location.pickup_hours }),
    },
    business_details: {
      business_type: formData.business_details.business_type,
      business_category: formData.business_details.business_category,
      ...(formData.business_details.business_subcategory && { business_subcategory: formData.business_details.business_subcategory }),
      ...(formData.business_details.founded_year && { founded_year: formData.business_details.founded_year }),
      ...(formData.business_details.number_of_employees && { number_of_employees: formData.business_details.number_of_employees }),
    },
    kyc_documents: {
      cnic_front: formData.kyc_documents.cnic_front!,
      cnic_back: formData.kyc_documents.cnic_back!,
    },
    bank_details: {
      bank_name: formData.bank_details.bank_name, account_title: formData.bank_details.account_title,
      account_number: formData.bank_details.account_number, iban: formData.bank_details.iban,
      payment_method: formData.bank_details.payment_method,
      ...(formData.bank_details.branch_code && { branch_code: formData.bank_details.branch_code }),
      ...(formData.bank_details.branch_address && { branch_address: formData.bank_details.branch_address }),
      ...(formData.bank_details.swift_code && { swift_code: formData.bank_details.swift_code }),
      ...(formData.bank_details.payment_schedule && { payment_schedule: formData.bank_details.payment_schedule }),
      ...(formData.bank_details.payment_threshold && { payment_threshold: formData.bank_details.payment_threshold }),
    },
  });

  const nextStep = async () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 0 && formData.email) {
      try {
        const resp = await SellerApi.Auth.GetDraft(formData.email);
        if (resp.ok && resp.body?.step > 0) { setDraftAvailable(resp.body); return; }
      } catch { /* proceed */ }
    }
    if (currentStep > 0 && formData.email) saveDraft(currentStep + 1);
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
  };

  const resumeDraft = () => {
    if (!draftAvailable) return;
    setFormData(p => ({ ...p, ...draftAvailable.draft_data }));
    setCurrentStep(draftAvailable.step);
    setDraftAvailable(null);
  };

  const dismissDraft = () => { setDraftAvailable(null); setCurrentStep(s => s + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(s => s - 1); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const resp = await SellerApi.Auth.Register(buildRegisterPayload());
      if (!resp.ok) {
        alert((resp.body as any)?.error || (resp.body as any)?.message || 'Registration failed. Please check your details and try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      alert('Failed to connect. Please check your internet and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Left-panel storytelling metadata ──────────────────────────────────────
  const stepMeta = [
    {
      num: '01', label: 'Your Access',
      headline: "Pakistan's indie brands deserve a real home.",
      sub: "Not Instagram DMs. Not WhatsApp price lists. A storefront built for your brand — one that works while you sleep.",
      stat: { value: '50+', label: 'Brands already on Juno' },
    },
    {
      num: '02', label: 'Your Story',
      headline: "Juno is built around brands, not products.",
      sub: "Buyers discover you as a brand first — your story, your aesthetic, your world. Products come second.",
      stat: { value: '18–30', label: 'Average buyer age' },
    },
    {
      num: '03', label: 'Your Territory',
      headline: "Urban buyers are looking for exactly what you make.",
      sub: "Karachi, Lahore, Islamabad. Buyers who value originality and are ready to pay for it.",
      stat: { value: '3', label: 'Active buyer cities' },
    },
    {
      num: '04', label: 'Your Identity',
      headline: "Your brand's first impression on Juno.",
      sub: "Every brand on Juno is verified — it's part of the trust that makes buyers convert without hesitation.",
      stat: { value: '100%', label: 'Verified brands' },
    },
    {
      num: '05', label: 'Your Earnings',
      headline: "Get paid reliably. No chasing.",
      sub: "Payouts are processed on a set schedule directly to your account. You focus on making, we handle the money.",
      stat: { value: 'Monthly', label: 'Payout cadence' },
    },
    {
      num: '06', label: 'The Commitment',
      headline: "Quality in, quality out.",
      sub: "When you join Juno, you're committing to authenticity. We commit to logistics, payments, and getting you discovered.",
      stat: null,
    },
    {
      num: '07', label: 'Ready to Launch',
      headline: "You're almost there.",
      sub: "Review your application. Our team reads every submission personally and responds within 48 hours.",
      stat: { value: '48 hrs', label: 'Average approval time' },
    },
  ];

  // ─── File upload field ─────────────────────────────────────────────────────
  const FileUploadField: React.FC<{
    label: string; type: keyof LoadingStates; accept: string;
    hint: string; icon: React.ReactNode; required?: boolean;
    aspect?: 'square' | 'wide' | 'doc';
  }> = ({ label, type, accept, hint, icon, required = false, aspect = 'doc' }) => {
    const getUrl = () => {
      if (type === 'logo') return formData.logo_url;
      if (type === 'banner') return formData.banner_url;
      if (type === 'cnic_front') return formData.kyc_documents.cnic_front;
      if (type === 'cnic_back') return formData.kyc_documents.cnic_back;
      return null;
    };
    const url = getUrl();
    const isImg = accept.startsWith('image');
    const h = aspect === 'wide' ? 'h-36' : aspect === 'square' ? 'h-32' : 'h-24';

    return (
      <div>
        <label className={lc}>{label}{required && <span className="text-primary ml-1">*</span>}</label>
        <input type="file" id={`fu-${type}`} className="hidden" accept={accept}
          disabled={loadingStates[type]}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, type); }} />
        <label htmlFor={`fu-${type}`}
          className={`relative flex items-center justify-center w-full ${h} rounded-2xl cursor-pointer overflow-hidden transition-all
            ${url ? 'border-0' : 'border-2 border-dashed border-white/[0.08] hover:border-primary/40 bg-white/[0.02]'}
            ${loadingStates[type] ? 'cursor-not-allowed' : ''}`}
        >
          {/* Image preview */}
          {url && isImg && <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          {/* Dark overlay when uploaded */}
          {url && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                <Check size={12} className="text-green-400" />
                <span className="text-xs text-green-400 font-semibold">Uploaded — click to replace</span>
              </div>
            </div>
          )}
          {/* Loading */}
          {loadingStates[type] && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader className="animate-spin text-primary" size={20} />
              <span className="text-xs text-white/40">Uploading…</span>
            </div>
          )}
          {/* Empty state */}
          {!url && !loadingStates[type] && (
            <div className="flex flex-col items-center gap-2 text-white/25">
              {icon}
              <span className="text-xs">Click to upload</span>
            </div>
          )}
        </label>
        <p className="text-xs text-white/[0.18] mt-1.5">{hint}</p>
      </div>
    );
  };

  // ─── Step content ──────────────────────────────────────────────────────────
  const steps = [
    // 0 — Your Access
    {
      title: "Create your account",
      content: (
        <div className="space-y-5">
          <div>
            <label className={lc}>Email address</label>
            <input type="email" className={ic} placeholder="you@yourbrand.com"
              value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className={lc}>Password <span className="normal-case font-normal text-white/20">— min. 8 characters</span></label>
            <input type="password" className={ic} placeholder="Create a strong password" minLength={8}
              value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
            {formData.password && <PasswordStrength password={formData.password} />}
          </div>
          <div>
            <label className={lc}>Confirm password</label>
            <input type="password" className={ic} placeholder="Same as above"
              value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-400 mt-1.5">Passwords don't match</p>
            )}
          </div>
        </div>
      ),
    },

    // 1 — Your Story
    {
      title: "Tell us about your brand",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Brand name *</label>
              <input className={ic} placeholder="e.g. Khaadi, Sana Safinaz"
                value={formData.business_name} onChange={e => setFormData(p => ({ ...p, business_name: e.target.value }))} />
            </div>
            <div>
              <label className={lc}>Legal name</label>
              <input className={ic} placeholder="As registered with SECP / FBR"
                value={formData.legal_name} onChange={e => setFormData(p => ({ ...p, legal_name: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className={lc}>
              Tagline <span className="normal-case font-normal text-white/20">— one sentence, max 100 chars</span>
            </label>
            <input className={ic} placeholder="What makes your brand different?" maxLength={100}
              value={formData.short_description} onChange={e => setFormData(p => ({ ...p, short_description: e.target.value }))} />
            <p className="text-xs text-white/[0.18] text-right mt-1.5">{formData.short_description.length}/100</p>
          </div>

          <div>
            <label className={lc}>Brand story</label>
            <textarea className={`${ic} resize-none`} rows={3}
              placeholder="Tell buyers who you are and why you create. What's the origin, the ethos, the vision?"
              value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div>
            <label className={lc}>Business type *</label>
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              {businessTypes.map(t => (
                <button key={t} type="button"
                  onClick={() => setFormData(p => ({ ...p, business_details: { ...p.business_details, business_type: t } }))}
                  className={`px-4 py-3 rounded-xl border text-[0.9rem] text-left font-medium transition-all duration-200 ${
                    formData.business_details.business_type === t
                      ? 'border-primary/60 bg-primary/10 text-white'
                      : 'border-white/[0.08] bg-white/[0.02] text-white/35 hover:text-white/60 hover:border-white/15'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Founded year</label>
              <input type="number" className={ic} min={1900} max={new Date().getFullYear()}
                value={formData.business_details.founded_year}
                onChange={e => setFormData(p => ({ ...p, business_details: { ...p.business_details, founded_year: parseInt(e.target.value) } }))} />
            </div>
            <div>
              <label className={lc}>Team size</label>
              <select className={sc}
                value={formData.business_details.number_of_employees}
                onChange={e => setFormData(p => ({ ...p, business_details: { ...p.business_details, number_of_employees: e.target.value } }))}>
                <option value="">Select range</option>
                {employeeRanges.map(r => <option key={r} value={r}>{r} people</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Your name *</label>
              <input className={ic} placeholder="Contact person"
                value={formData.contact.contact_person_name}
                onChange={e => setFormData(p => ({ ...p, contact: { ...p.contact, contact_person_name: e.target.value } }))} />
            </div>
            <div>
              <label className={lc}>Phone *</label>
              <input className={ic} placeholder="+92 300 0000000"
                value={formData.contact.phone_number}
                onChange={e => setFormData(p => ({ ...p, contact: { ...p.contact, phone_number: e.target.value } }))} />
            </div>
          </div>
        </div>
      ),
    },

    // 2 — Your Territory
    {
      title: "Where are you based?",
      content: (
        <div className="space-y-5">
          <div>
            <label className={lc}>Street address *</label>
            <input className={ic} placeholder="e.g. 12 Main Gulberg III"
              value={formData.location.address}
              onChange={e => setFormData(p => ({ ...p, location: { ...p.location, address: e.target.value } }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>City *</label>
              <select className={sc} value={formData.location.city}
                onChange={e => setFormData(p => ({ ...p, location: { ...p.location, city: e.target.value } }))}>
                <option value="">Select city</option>
                {pakistanCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Province *</label>
              <select className={sc} value={formData.location.state}
                onChange={e => setFormData(p => ({ ...p, location: { ...p.location, state: e.target.value } }))}>
                <option value="">Select province</option>
                {pakistanStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Postal code *</label>
              <input className={ic} placeholder="54000"
                value={formData.location.postal_code}
                onChange={e => setFormData(p => ({ ...p, location: { ...p.location, postal_code: e.target.value } }))} />
            </div>
            <div>
              <label className={lc}>Neighborhood</label>
              <input className={ic} placeholder="e.g. DHA, Gulberg"
                value={formData.location.neighborhood}
                onChange={e => setFormData(p => ({ ...p, location: { ...p.location, neighborhood: e.target.value } }))} />
            </div>
          </div>

          <div>
            <label className={lc}>Store directions <span className="normal-case font-normal text-white/20">— optional, shown to buyers</span></label>
            <input className={ic} placeholder="e.g. Near Gaddafi Stadium, first left after the petrol pump"
              value={formData.location.store_directions}
              onChange={e => setFormData(p => ({ ...p, location: { ...p.location, store_directions: e.target.value } }))} />
          </div>

          <button type="button" onClick={openLocationPicker}
            className="flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition-colors mt-1">
            <MapPin size={12} />
            Verify on Google Maps
          </button>
        </div>
      ),
    },

    // 3 — Your Identity
    {
      title: "Brand assets & verification",
      content: (
        <div className="space-y-7">
          <div className="grid grid-cols-2 gap-5">
            <FileUploadField label="Brand Logo" type="logo" accept="image/*"
              hint="PNG or JPG — high resolution" icon={<Camera size={22} />} required aspect="square" />
            <FileUploadField label="Store Banner" type="banner" accept="image/*"
              hint="Recommended: 1600 × 600px" icon={<Upload size={22} />} aspect="square" />
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div>
            <p className="text-xs font-bold text-white/35 uppercase tracking-widest mb-1">Identity Verification</p>
            <p className="text-xs text-white/25 mb-4">Required for account activation. Documents are stored securely and never shown to buyers.</p>
            <div className="grid grid-cols-2 gap-5">
              <FileUploadField label="CNIC — Front" type="cnic_front" accept="image/*,.pdf"
                hint="Clear photo or PDF" icon={<FileText size={22} />} required aspect="doc" />
              <FileUploadField label="CNIC — Back" type="cnic_back" accept="image/*,.pdf"
                hint="Clear photo or PDF" icon={<FileText size={22} />} required aspect="doc" />
            </div>
          </div>
        </div>
      ),
    },

    // 4 — Your Earnings
    {
      title: "Banking & payouts",
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Bank name *</label>
              <input className={ic} placeholder="e.g. HBL, UBL, MCB"
                value={formData.bank_details.bank_name}
                onChange={e => setFormData(p => ({ ...p, bank_details: { ...p.bank_details, bank_name: e.target.value } }))} />
            </div>
            <div>
              <label className={lc}>Account holder name *</label>
              <input className={ic} placeholder="Exactly as on your account"
                value={formData.bank_details.account_title}
                onChange={e => setFormData(p => ({ ...p, bank_details: { ...p.bank_details, account_title: e.target.value } }))} />
            </div>
          </div>

          <div>
            <label className={lc}>Account number *</label>
            <input className={ic} placeholder="Your bank account number"
              value={formData.bank_details.account_number}
              onChange={e => setFormData(p => ({ ...p, bank_details: { ...p.bank_details, account_number: e.target.value } }))} />
          </div>

          <div>
            <label className={lc}>IBAN *</label>
            <input className={`${ic} font-mono tracking-wider`} placeholder="PK36SCBL0000001123456702"
              value={formData.bank_details.iban}
              onChange={e => setFormData(p => ({ ...p, bank_details: { ...p.bank_details, iban: e.target.value } }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Branch code</label>
              <input className={ic} placeholder="Optional"
                value={formData.bank_details.branch_code}
                onChange={e => setFormData(p => ({ ...p, bank_details: { ...p.bank_details, branch_code: e.target.value } }))} />
            </div>
            <div>
              <label className={lc}>SWIFT / BIC code</label>
              <input className={`${ic} font-mono tracking-wider`} placeholder="e.g. HABBPKKA"
                value={formData.bank_details.swift_code}
                onChange={e => setFormData(p => ({ ...p, bank_details: { ...p.bank_details, swift_code: e.target.value } }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Payout schedule</label>
              <select className={sc} value={formData.bank_details.payment_schedule}
                onChange={e => setFormData(p => ({ ...p, bank_details: { ...p.bank_details, payment_schedule: e.target.value } }))}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className={lc}>Payout method</label>
              <select className={sc} value={formData.bank_details.payment_method}
                onChange={e => setFormData(p => ({ ...p, bank_details: { ...p.bank_details, payment_method: e.target.value } }))}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
            <p className="text-xs text-white/50 leading-relaxed">
              <span className="text-white/80 font-semibold">Payout timing.</span>{' '}
              Funds are released after order delivery is confirmed, according to your selected schedule. No minimum threshold — every rupee earned gets transferred.
            </p>
          </div>
        </div>
      ),
    },

    // 5 — The Commitment
    {
      title: "The brand agreement",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-white/40 mb-6">When you join Juno, here's what both sides commit to.</p>

          {[
            { title: 'Authentic products only', body: 'All listings must be original, accurately described, and match what buyers receive.' },
            { title: 'Fulfill orders on time', body: 'You handle shipping within your stated handling time. Delays affect your standing on the platform.' },
            { title: 'Maintain visual quality', body: 'Juno may pause listings that don\'t meet our visual standards. We\'ll always tell you why.' },
            { title: 'Platform commission applies', body: 'A commission on each sale is deducted before payout, as discussed at onboarding.' },
            { title: 'Honor return requests', body: 'Disputes are mediated by Juno. Our decisions are final.' },
            { title: 'Stay authentic', body: 'Fraudulent activity or counterfeit goods result in immediate account termination.' },
          ].map(item => (
            <div key={item.title} className="flex gap-3.5 p-4 rounded-xl bg-white/[0.025] border border-white/[0.06]">
              <Check size={13} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white/80">{item.title}</p>
                <p className="text-sm text-white/35 mt-0.5 leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}

          <div
            onClick={() => setFormData(p => ({ ...p, contract_agreed: !p.contract_agreed }))}
            className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer select-none transition-all mt-6 ${
              formData.contract_agreed
                ? 'border-primary/50 bg-primary/8'
                : 'border-white/[0.08] hover:border-white/15 bg-white/[0.02]'
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              formData.contract_agreed ? 'bg-primary border-primary' : 'border-white/20'
            }`}>
              {formData.contract_agreed && <Check size={11} className="text-white" />}
            </div>
            <span className="text-sm text-white/50 leading-relaxed">
              I've read and agree to the{' '}
              <span className="text-white font-semibold">Juno Brand Agreement</span>{' '}
              and{' '}
              <span className="text-white font-semibold">Privacy Policy</span>.
            </span>
          </div>
        </div>
      ),
    },

    // 6 — Review & Submit
    {
      title: "Review your application",
      content: (
        <div className="space-y-4">
          {[
            {
              heading: 'Brand',
              rows: [
                { label: 'Name', value: formData.business_name },
                { label: 'Legal name', value: formData.legal_name || '—' },
                { label: 'Type', value: formData.business_details.business_type || '—' },
                { label: 'Tagline', value: formData.short_description || '—' },
              ],
            },
            {
              heading: 'Contact',
              rows: [
                { label: 'Person', value: formData.contact.contact_person_name },
                { label: 'Phone', value: formData.contact.phone_number },
                { label: 'Email', value: formData.email },
              ],
            },
            {
              heading: 'Location',
              rows: [
                { label: 'Address', value: formData.location.address },
                { label: 'City', value: `${formData.location.city}, ${formData.location.state}` },
              ],
            },
            {
              heading: 'Banking',
              rows: [
                { label: 'Bank', value: formData.bank_details.bank_name },
                { label: 'Account', value: formData.bank_details.account_title },
                { label: 'IBAN', value: formData.bank_details.iban ? `${formData.bank_details.iban.slice(0, 6)}••••••••••••••` : '—' },
              ],
            },
          ].map(section => (
            <div key={section.heading} className="rounded-2xl border border-white/[0.07] overflow-hidden">
              <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.05]">
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest">{section.heading}</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {section.rows.map(row => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-white/30">{row.label}</span>
                    <span className="text-[0.9rem] text-white font-medium text-right max-w-[60%] truncate">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.05]">
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Documents</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {[
                { label: 'Brand logo', ok: !!formData.logo_url },
                { label: 'Store banner', ok: !!formData.banner_url },
                { label: 'CNIC front', ok: !!formData.kyc_documents.cnic_front },
                { label: 'CNIC back', ok: !!formData.kyc_documents.cnic_back },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-white/30">{d.label}</span>
                  <span className={`text-xs font-semibold ${d.ok ? 'text-green-400' : 'text-white/20'}`}>
                    {d.ok ? 'Uploaded' : 'Not uploaded'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  const prefix = window.location.pathname.startsWith('/studio') ? '/studio' : '/seller';

  // ─── Post-submission: "You're in" screen ───────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-lg w-full text-center space-y-10"
        >
          <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 160, damping: 14 }}
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
            style={{ boxShadow: '0 0 60px rgba(220,38,38,0.3), 0 0 120px rgba(220,38,38,0.1)' }}
          >
            <Check size={36} className="text-white" strokeWidth={2.5} />
          </motion.div>

          <div className="space-y-3">
            <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="text-6xl font-black text-white tracking-tighter">
              You're in.
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              className="text-white/50 text-base leading-relaxed">
              <span className="text-white font-semibold">{formData.business_name}</span> has applied to join Juno.
              {' '}Our team reviews every brand personally — we'll be in touch within 48 hours.
            </motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7 text-left space-y-5"
          >
            <p className="text-[0.65rem] font-bold text-white/25 uppercase tracking-[0.2em]">What happens next</p>
            {[
              { n: '01', text: 'We verify your KYC documents and business details.' },
              { n: '02', text: "You'll receive a welcome email — why Juno exists, who your buyers are, and what makes us different from Instagram." },
              { n: '03', text: 'Log in to Juno Studio to set up your storefront and list your first products.' },
            ].map(item => (
              <div key={item.n} className="flex gap-4 items-start">
                <span className="text-primary font-black text-base leading-tight shrink-0 pt-px">{item.n}</span>
                <span className="text-white/45 text-sm leading-relaxed">{item.text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <p className="text-xs text-white/20">
              Confirmation sent to <span className="text-white/40">{formData.email}</span>
            </p>
            <button onClick={() => navigate(`${prefix}/auth`)}
              className="text-xs text-white/25 hover:text-white/50 transition-colors">
              Back to sign in
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-[#080808] text-white">

      {/* ── Left storytelling panel ─────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 w-[400px] h-screen bg-[#0b0b0b] border-r border-white/[0.05] px-10 py-10 overflow-hidden">

        <img src="/juno_logos/icon+text_white.png" alt="Juno" className="h-7 w-auto object-contain object-left mb-14 opacity-90" />

        {/* Animated narrative */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col justify-center pb-8"
            >
              <p className="text-[0.62rem] font-bold text-primary uppercase tracking-[0.22em] mb-5">
                {stepMeta[currentStep].num} — {stepMeta[currentStep].label}
              </p>
              <h2 className="text-[2.1rem] font-black text-white leading-[1.08] mb-5">
                {stepMeta[currentStep].headline}
              </h2>
              <p className="text-white/35 text-sm leading-[1.7] mb-8">
                {stepMeta[currentStep].sub}
              </p>
              {stepMeta[currentStep].stat && (
                <div className="inline-flex flex-col w-fit">
                  <span className="text-[3.25rem] font-black leading-none bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {stepMeta[currentStep].stat!.value}
                  </span>
                  <span className="text-[0.65rem] text-white/25 mt-1.5 font-semibold uppercase tracking-widest">
                    {stepMeta[currentStep].stat!.label}
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Ghost background number */}
          <AnimatePresence mode="wait">
            <motion.span key={`ghost-${currentStep}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute -bottom-6 -right-8 text-[13rem] font-black leading-none select-none pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.018)' }}
            >
              {stepMeta[currentStep].num}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Vertical step tracker */}
        <div className="space-y-3 pt-4 border-t border-white/[0.05]">
          {stepMeta.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`transition-all duration-400 flex items-center justify-center rounded-full shrink-0 ${
                i < currentStep
                  ? 'w-5 h-5 bg-gradient-to-br from-primary to-secondary'
                  : i === currentStep
                  ? 'w-2 h-2 bg-white ring-[3px] ring-white/15'
                  : 'w-1.5 h-1.5 bg-white/12'
              }`}>
                {i < currentStep && <Check size={9} className="text-white" strokeWidth={3} />}
              </div>
              <span className={`text-xs transition-all duration-300 ${
                i === currentStep ? 'text-white font-semibold' : i < currentStep ? 'text-white/40' : 'text-white/15'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-[400px] flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <img src="/juno_logos/icon+text_white.png" className="h-6 opacity-90" alt="Juno" />
          <span className="text-xs text-white/25 font-medium">{currentStep + 1} / {steps.length}</span>
        </div>
        {/* Mobile progress bar */}
        <div className="lg:hidden h-px bg-white/[0.05]">
          <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[540px] mx-auto px-6 lg:px-12 py-12 lg:py-16">

            {/* Step header */}
            <div className="mb-10">
              <p className="text-[0.62rem] font-bold text-primary/70 uppercase tracking-[0.18em] mb-3">
                {stepMeta[currentStep].label}
              </p>
              <h1 className="text-3xl font-black text-white leading-tight">
                {steps[currentStep].title}
              </h1>
            </div>

            {/* Animated content */}
            <AnimatePresence mode="wait">
              <motion.div key={currentStep}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {steps[currentStep].content}
              </motion.div>
            </AnimatePresence>

          </div>
        </div>

        {/* Sticky navigation */}
        <div className="sticky bottom-0 bg-[#080808]/90 backdrop-blur-xl border-t border-white/[0.05] px-6 lg:px-12 py-5">
          <div className="max-w-[540px] mx-auto flex items-center justify-between">
            <button onClick={prevStep} disabled={currentStep === 0}
              className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200">
              <ArrowLeft size={15} />
              Back
            </button>

            {currentStep < steps.length - 1 ? (
              <button onClick={nextStep} disabled={!validateStep(currentStep)}
                className="flex items-center gap-2.5 px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200">
                Continue
                <ArrowRight size={15} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!validateStep(currentStep) || isSubmitting}
                className="flex items-center gap-2.5 px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200">
                {isSubmitting ? (
                  <><Loader className="animate-spin" size={15} /> Submitting…</>
                ) : (
                  <>Submit Application <ArrowRight size={15} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ── Draft resume modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {draftAvailable && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#111] border border-white/[0.09] rounded-2xl p-8 max-w-sm w-full text-center space-y-5"
            >
              <div className="w-11 h-11 mx-auto rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
                <ArrowRight className="text-primary" size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white mb-2">Welcome back</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  We saved your progress from step {draftAvailable.step + 1}. Continue where you left off?
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={dismissDraft}
                  className="flex-1 py-2.5 text-sm text-white/35 border border-white/[0.08] rounded-xl hover:border-white/20 hover:text-white/55 transition-all">
                  Start fresh
                </button>
                <button onClick={resumeDraft}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-xl hover:opacity-90 transition-opacity">
                  Continue →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SellerOnboarding;
