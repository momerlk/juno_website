import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, User, Phone, BookOpen, Clock, Link, Send, Shield } from 'lucide-react';
import { api_url, createEvent } from '../../api';

const ChapterFormPage = () => {
  const { university } = useParams<{ university?: string }>();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    institute: '',
    year: '',
    gender: '',
    role: [] as string[],
    secondary_role: '',
    instagram_handle : "",
    apply_chapter_head: false,
    chapter_head_motivation: '',
    cohort: 'Cohort 2',
    commitment_hours: '',
    motivation: 5,
    experience_link: '',
    final_answer: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (university) {
      setFormData(fd => ({ ...fd, institute: university }));
    }
  }, [university]);

  useEffect(() => {
    const trackVisit = async () => {
      const hasVisited = localStorage.getItem('hasVisitedChapterForm');
      if (!hasVisited) {
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          if (!ipResponse.ok) {
            console.error('Failed to fetch IP address:', ipResponse.statusText);
            return;
          }
          const ipData = await ipResponse.json();
          const ip = ipData.ip;

          const eventData = {
            url: window.location.href,
            ip: ip,
            university: university || 'none'
          };

          await createEvent('chapter_form_visit', eventData);
          localStorage.setItem('hasVisitedChapterForm', 'true');
        } catch (error) {
          console.error('Failed to track visit:', error);
        }
      }
    };

    trackVisit();
  }, [university]);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleUpdate = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        role: formData.secondary_role,
        phone: formData.phone.startsWith('03') ? `+92${formData.phone.substring(1)}` : formData.phone
      };

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify(submissionData);

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      const resp = await fetch(`${api_url}/chapter-forms`, requestOptions as any)
      if(resp.ok === false){
        alert("Failed to submit application. Please try again.");
      }
      handleNext();
    } catch (error) {
      console.error(error);
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    <IntroStep onNext={handleNext} university={university} />,
    <PersonalDetailsStep onNext={handleNext} onUpdate={handleUpdate} formData={formData} university={university} />,
    <SecondaryRoleStep onNext={handleNext} onBack={handlePrev} onUpdate={handleUpdate} formData={formData} />,
    <CommitmentStep onNext={handleNext} onBack={handlePrev} onUpdate={handleUpdate} formData={formData} />,
    <ChapterHeadStep onNext={handleNext} onBack={handlePrev} onUpdate={handleUpdate} formData={formData} />,
    <ExperienceStep onNext={handleNext} onBack={handlePrev} onUpdate={handleUpdate} formData={formData} />,
    <FinalQuestionStep onSubmit={handleSubmit} onBack={handlePrev} onUpdate={handleUpdate} isSubmitting={isSubmitting} />,
    <ThankYouStep />
  ];

  return (
    <div className="min-h-screen bg-background-dark text-white flex flex-col justify-center items-center p-4 pt-24 sm:pt-4 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="w-full"
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Step Components

const StepWrapper = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) => (
  <div className="max-w-4xl mx-auto text-center">
    <div style={{marginTop : 80}}></div>
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 gradient-text">{title}</h1>
    {subtitle && <p className="text-md sm:text-lg text-neutral-400 mb-10">{subtitle}</p>}
    {children}
  </div>
);

const PartnerLogos = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.6 }}
    className="mb-16 px-4"
  >
    <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-10 md:gap-12 lg:gap-16">
      {[
        { src: '/dark_logos/hbl.png', alt: 'HBL' },
        { src: '/dark_logos/impactx.png', alt: 'ImpactX' },
        { src: '/dark_logos/netsol.png', alt: 'NetSol' },
        { src: '/dark_logos/nic.png', alt: 'NIC' },
        { src: '/dark_logos/pmyp.png', alt: 'PMYP' },
      ].map((logo, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="h-12 sm:h-14 flex items-center"
        >
          <img 
            src={logo.src} 
            alt={logo.alt} 
            className="h-full object-contain filter opacity-70 hover:opacity-100 transition-opacity duration-300"
          />
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const IntroStep = ({ onNext, university }: { onNext: () => void, university?: string }) => (
  <StepWrapper title={university ? `Juno Campus Fellowship: Cohort 2 - ${university}` : 'Juno Campus Fellowship: Cohort 2'} subtitle="A prestigious opportunity to shape the future of commerce.">
    <PartnerLogos />
    <div className="text-left bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 mb-10 space-y-8">
      <div>
        <h3 className="text-xl font-bold text-primary mb-3">About Juno</h3>
        <p className="text-neutral-300 leading-relaxed">
          Juno is building Pakistan's leading indie-fashion commerce platform, connecting independent labels with high-intent shoppers through strong storytelling and modern distribution. We are seeking high-potential candidates for our selective Cohort 2 internship program.
        </p>
      </div>
      <div>
        <h3 className="text-xl font-bold text-primary mb-3">Program Incentives</h3>
        <ul className="space-y-4 text-neutral-300">
            <li className="flex items-start gap-3">
                <Check className="text-primary mt-1 flex-shrink-0" size={18} />
                <span><strong className="text-white">Executive Letter of Recommendation:</strong> A formal endorsement from the CEO, reserved for candidates demonstrating exceptional leadership and execution capabilities.</span>
            </li>
            <li className="flex items-start gap-3">
                <Check className="text-primary mt-1 flex-shrink-0" size={18} />
                <span><strong className="text-white">Certificate of Completion:</strong> Official certification validating tenure and skill acquisition in high-growth startup operations.</span>
            </li>
            <li className="flex items-start gap-3">
                <Check className="text-primary mt-1 flex-shrink-0" size={18} />
                <span><strong className="text-white">Performance-Based Rewards:</strong> Exclusive accolades and the prestigious Platinum Card for top-quartile performers.</span>
            </li>
        </ul>
      </div>
    </div>
    <button onClick={onNext} className="btn btn-primary text-lg px-10 py-4 group">
      Begin Assessment <ArrowRight size={22} className="ml-2 transition-transform group-hover:translate-x-1" />
    </button>
  </StepWrapper>
);

const PersonalDetailsStep = ({ onNext, onUpdate, formData, university }: any) => {
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^03\d{9}$/.test(formData.phone)) newErrors.phone = 'Enter a valid Pakistan number (e.g., 03001234567)';
    if (!formData.institute) newErrors.institute = 'Institute is required';
    if (!formData.year) newErrors.year = 'Please select your year';
    if (!formData.gender) newErrors.gender = 'Please select your gender';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <StepWrapper title="Personal Details" subtitle="Please provide your particulars for our records.">
      <div className="space-y-6 text-left">
        <FormInput icon={<User />} placeholder="Full Name" value={formData.name} onChange={(v) => onUpdate({ name: v })} error={errors.name} />
        <FormInput icon={<Phone />} placeholder="Phone Number (e.g., 03001234567)" value={formData.phone} onChange={(v) => onUpdate({ phone: v })} error={errors.phone} />
        <FormInput icon={<BookOpen />} placeholder="Institute Name" value={formData.institute} onChange={(v) => onUpdate({ institute: v })} error={errors.institute} disabled={!!university} />
        
        <OptionSelector label="Academic Year" options={['1st', '2nd', '3rd', '4th']} selected={formData.year} onSelect={(v) => onUpdate({ year: v })} error={errors.year} />
        <OptionSelector label="Gender" options={['Male', 'Female', 'Other']} selected={formData.gender} onSelect={(v) => onUpdate({ gender: v })} error={errors.gender} />
      </div>
      <div className="mt-10">
        <button onClick={handleNext} className="btn btn-primary text-lg px-10 py-4 group">
          Next <ArrowRight size={22} className="ml-2 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </StepWrapper>
  );
};

const CommitmentStep = ({ onNext, onBack, onUpdate, formData }: any) => {
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!formData.commitment_hours) {
      newErrors.commitment_hours = 'Required field.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <StepWrapper title="Commitment Level">
      <div className="space-y-10 text-left">
        <FormInput 
          icon={<Clock />} 
          placeholder="e.g., 5-10 hours" 
          label="Weekly hour commitment available for this fellowship *" 
          value={formData.commitment_hours} 
          onChange={(v: string) => onUpdate({ commitment_hours: v })} 
          error={errors.commitment_hours}
        />
        <ScaleSelector label="Motivation level to achieve KPIs (1-10) *" value={formData.motivation} onSelect={(v: number) => onUpdate({ motivation: v })} />
      </div>
      <NavigationButtons onBack={onBack} onNext={handleNext} disabled={!formData.commitment_hours} />
    </StepWrapper>
  );
};

const ExperienceStep = ({ onNext, onBack, onUpdate, formData }: any) => (
  <StepWrapper title="Professional Portfolio" subtitle="Please provide a link to your resume, portfolio, or relevant social media profiles. (Optional)">
    <FormInput icon={<Link />} placeholder="URL (LinkedIn, Portfolio, etc.)" value={formData.experience_link} onChange={(v) => onUpdate({ experience_link: v })} />
    <NavigationButtons onBack={onBack} onNext={onNext} />
  </StepWrapper>
);

const FinalQuestionStep = ({ onSubmit, onBack, onUpdate, isSubmitting }: any) => {
  const handleSubmitClick = () => {
    onUpdate({ final_answer: 'Yes' });
    onSubmit();
  }

  return (
    <StepWrapper title="Declaration">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-8 mb-10"
      >
        <div className="flex gap-4 items-start">
          <Shield className="text-primary flex-shrink-0 mt-1" size={24} />
          <p className="text-neutral-200 text-lg leading-relaxed">
            By submitting this application, I confirm my interest in the Juno Cohort 2 Fellowship and commit to the professional standards required for this role.
          </p>
        </div>
      </motion.div>
      <div className="flex justify-center items-center gap-4 mt-10">
        <button onClick={onBack} className="btn btn-outline px-8 py-3">Back</button>
        <button onClick={handleSubmitClick} className="btn btn-primary text-lg px-10 py-4 group" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
          {!isSubmitting && <Send size={20} className="ml-2" />}
        </button>
      </div>
    </StepWrapper>
  );
};

const SecondaryRoleStep = ({ onNext, onBack, onUpdate, formData }: any) => {
  const secondaryRoles = [
    { title: 'Content Creator', description: 'Specializing in video production and on-camera presence.' },
    { title: 'Content Editor', description: 'Specializing in post-production and video editing (CapCut, Premiere).' },
    { title: 'Outreach', description: 'Specializing in brand partnerships and business development.' }
  ];

  const handleSelect = (role: string) => {
    onUpdate({ secondary_role: role });
  };

  return (
    <StepWrapper title="Role Selection" subtitle="Please select your primary functional area for the duration of the fellowship.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {secondaryRoles.map(role => (
          <motion.div
            key={role.title}
            onClick={() => handleSelect(role.title)}
            className={`p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300 ${formData.secondary_role === role.title ? 'border-primary bg-primary/10' : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'}`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-white">{role.title}</h3>
              {formData.secondary_role === role.title && <Check size={20} className="text-primary flex-shrink-0" />}
            </div>
            <p className="text-sm text-neutral-400">{role.description}</p>
          </motion.div>
        ))}
      </div>
      <NavigationButtons onBack={onBack} onNext={onNext} disabled={!formData.secondary_role} />
    </StepWrapper>
  );
};

const ChapterHeadStep = ({ onNext, onBack, onUpdate, formData }: any) => {
  return (
    <StepWrapper title="Leadership Application" subtitle="Apply for the Chapter Head position. High responsibility, maximum reward.">
      <div className="text-left space-y-6">
        <motion.div 
          whileHover={{ scale: 1.01 }}
          onClick={() => onUpdate({ apply_chapter_head: !formData.apply_chapter_head })}
          className={`p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300 flex items-center justify-between ${formData.apply_chapter_head ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'}`}
        >
          <div>
            <h3 className="font-bold text-lg text-white">Apply for Chapter Head</h3>
            <p className="text-sm text-neutral-400 mt-1">Responsible for team performance metrics and weekly reporting.</p>
          </div>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.apply_chapter_head ? 'border-primary bg-primary' : 'border-neutral-500'}`}>
            {formData.apply_chapter_head && <Check size={14} className="text-black" />}
          </div>
        </motion.div>

        <AnimatePresence>
          {formData.apply_chapter_head && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <label className="block text-sm font-medium text-neutral-300 mb-2">Statement of Purpose (Leadership Experience)</label>
              <textarea
                value={formData.chapter_head_motivation}
                onChange={(e) => onUpdate({ chapter_head_motivation: e.target.value })}
                placeholder="Elaborate on your suitability for this leadership role..."
                className="w-full h-32 p-4 bg-neutral-900/50 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <NavigationButtons onBack={onBack} onNext={onNext} disabled={formData.apply_chapter_head && !formData.chapter_head_motivation} />
    </StepWrapper>
  );
};

const ThankYouStep = () => (
  <StepWrapper title="Application Received">
    <div className="bg-gradient-to-b from-neutral-900/50 to-neutral-900/30 border border-neutral-800 rounded-2xl p-10">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.2}} className="w-24 h-24 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check size={48} className="text-green-400" />
      </motion.div>
      <p className="text-xl text-neutral-300">Your application is under review. Successful candidates will be contacted shortly.</p>
    </div>
  </StepWrapper>
);

// Helper Components

const FormInput = ({ icon, placeholder, value, onChange, error, disabled = false, label }: any) => (
  <div>
    {label && <label className="block text-sm font-medium text-neutral-300 mb-2">{label}</label>}
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">{icon}</div>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        disabled={disabled}
        className={`w-full pl-12 pr-4 py-4 bg-neutral-900/50 border-2 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-500/50 focus:ring-red-500' : 'border-neutral-800 focus:ring-primary'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const OptionSelector = ({ label, options, selected, onSelect, error }: any) => (
  <div>
    <label className="block text-sm font-medium text-neutral-300 mb-3">{label}</label>
    <div className="flex flex-wrap gap-3">
      {options.map((opt: string) => (
        <button 
          key={opt} 
          type="button"
          onClick={() => onSelect(opt)}
          className={`px-5 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${selected === opt ? 'bg-primary border-primary text-white' : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'}`}>
          {opt}
        </button>
      ))}
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const ScaleSelector = ({ label, value, onSelect }: any) => (
  <div className="text-left">
    <label className="block text-lg text-neutral-300 mb-4">{label}</label>
    <div className="flex flex-wrap justify-center items-center gap-2">
      {[...Array(11).keys()].map(i => (
        <button 
          key={i} 
          type="button"
          onClick={() => onSelect(i)} 
          className={`w-10 h-10 rounded-full font-bold text-sm transition-all duration-200 flex-shrink-0 ${value === i ? 'bg-primary text-white scale-110' : 'bg-neutral-800 hover:bg-neutral-700'}`}>
          {i}
        </button>
      ))}
    </div>
  </div>
);

const NavigationButtons = ({ onBack, onNext, disabled = false }: any) => (
  <div className="mt-12 flex justify-center items-center gap-4">
    <button onClick={onBack} className="btn btn-outline px-8 py-3">Back</button>
    <button onClick={onNext} className="btn btn-primary text-lg px-10 py-4 group" disabled={disabled}>
      Next <ArrowRight size={22} className="ml-2 transition-transform group-hover:translate-x-1" />
    </button>
  </div>
);

export default ChapterFormPage;
