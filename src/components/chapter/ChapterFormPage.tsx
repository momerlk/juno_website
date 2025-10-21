import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { roles } from './roles';
import { ArrowRight, Check, User, Phone, BookOpen, Clock, Link, Send } from 'lucide-react';
import { api_url } from '../../api';

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
    tech_interest: 5,
    fashion_interest: 5,
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
        role: formData.role.join(','),
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
    <RoleStep onNext={handleNext} onBack={handlePrev} onUpdate={handleUpdate} formData={formData} />,
    <InterestStep onNext={handleNext} onBack={handlePrev} onUpdate={handleUpdate} formData={formData} />,
    <CommitmentStep onNext={handleNext} onBack={handlePrev} onUpdate={handleUpdate} formData={formData} />,
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
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 gradient-text">{title}</h1>
    {subtitle && <p className="text-md sm:text-lg text-neutral-400 mb-10">{subtitle}</p>}
    {children}
  </div>
);

const IntroStep = ({ onNext, university }: { onNext: () => void, university?: string }) => (
  <StepWrapper title={university ? `Calling on all ${university} students!` : 'Calling on all university and high school students!'} subtitle="Welcome to the Juno Chapter Program. This form takes just 60 seconds to complete.">
    <div className="text-left bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 mb-10 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-primary mb-2">What is Juno?</h3>
        <p className="text-neutral-300">Juno is a marketplace for indie fashion brands. Users can swipe on videos to shop, build closets, create outfits and get orders delivered in under 1 hour in Karachi, Lahore, Islamabad and Rawalpindi. Juno is re-imagining commerce and shopping for the next generation.</p>
      </div>
      <div>
        <h3 className="text-xl font-bold text-primary mb-2">Incentives</h3>
        <ul className="list-disc list-inside text-neutral-300 space-y-1">
          <li>15% commission on all revenue you bring in for Juno</li>
          <li>Chance to become a paid intern if you meet our KPIs</li>
          <li>Certificate & recommendation letter</li>
          <li>Exclusive loyalty rewards, merch, and vouchers</li>
        </ul>
      </div>
    </div>
    <button onClick={onNext} className="btn btn-primary text-lg px-10 py-4 group">
      Start Application <ArrowRight size={22} className="ml-2 transition-transform group-hover:translate-x-1" />
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
    <StepWrapper title="Personal Details" subtitle="Let's get to know you a bit.">
      <div className="space-y-6 text-left">
        <FormInput icon={<User />} placeholder="Your Name" value={formData.name} onChange={(v) => onUpdate({ name: v })} error={errors.name} />
        <FormInput icon={<Phone />} placeholder="Phone (e.g., 03001234567)" value={formData.phone} onChange={(v) => onUpdate({ phone: v })} error={errors.phone} />
        <FormInput icon={<BookOpen />} placeholder="Institute Name" value={formData.institute} onChange={(v) => onUpdate({ institute: v })} error={errors.institute} disabled={!!university} />
        
        <OptionSelector label="University/High School Year" options={['1st', '2nd', '3rd', '4th']} selected={formData.year} onSelect={(v) => onUpdate({ year: v })} error={errors.year} />
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

const RoleCard = ({ role, isSelected, onSelect }: any) => (
  <motion.div
    layout
    onClick={onSelect}
    className={`p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300 ${isSelected ? 'border-primary bg-primary/10' : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'}`}
  >
    <motion.div layout="position" className="flex justify-between items-center">
      <h3 className="font-bold text-lg text-white">{role.title}</h3>
      {isSelected && <Check size={20} className="text-primary flex-shrink-0" />}
    </motion.div>
    <motion.p layout="position" className="text-sm text-neutral-400 mt-1">{role.shortDescription}</motion.p>
  </motion.div>
);

const RoleStep = ({ onNext, onBack, onUpdate, formData }: any) => {
  const handleSelect = (roleTitle: string) => {
    const currentRoles = formData.role as string[];
    const isSelected = currentRoles.includes(roleTitle);

    let newRoles;
    if (isSelected) {
      newRoles = currentRoles.filter(r => r !== roleTitle);
    } else {
      if (currentRoles.length < 4) {
        newRoles = [...currentRoles, roleTitle];
      } else {
        newRoles = currentRoles;
      }
    }
    onUpdate({ role: newRoles });
  };

  const selectedRoles = formData.role as string[];
  const canProceed = selectedRoles.length >= 2 && selectedRoles.length <= 4;

  return (
    <StepWrapper title="Choose Your Roles" subtitle="Select 2 to 4 roles that fit you best.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => (
          <RoleCard 
            key={role.title} 
            role={role} 
            isSelected={selectedRoles.includes(role.title)}
            onSelect={() => handleSelect(role.title)}
          />
        ))}
      </div>
      <NavigationButtons onBack={onBack} onNext={onNext} disabled={!canProceed} />
    </StepWrapper>
  );
};

const InterestStep = ({ onNext, onBack, onUpdate, formData }: any) => (
  <StepWrapper title="Your Interests" subtitle="Don't pick 10 just for the sake of it :(">
    <div className="space-y-10">
      <ScaleSelector label="How interested are you in tech startups?" value={formData.tech_interest} onSelect={(v) => onUpdate({ tech_interest: v })} />
      <ScaleSelector label="How interested are you in fashion?" value={formData.fashion_interest} onSelect={(v) => onUpdate({ fashion_interest: v })} />
    </div>
    <NavigationButtons onBack={onBack} onNext={onNext} />
  </StepWrapper>
);

const CommitmentStep = ({ onNext, onBack, onUpdate, formData }: any) => {
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!formData.commitment_hours) {
      newErrors.commitment_hours = 'Please enter your commitment hours.';
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
    <StepWrapper title="Your Commitment">
      <div className="space-y-10 text-left">
        <FormInput 
          icon={<Clock />} 
          placeholder="e.g., 5-10 hours" 
          label="How many hours can you dedicate to Juno per week? *" 
          value={formData.commitment_hours} 
          onChange={(v: string) => onUpdate({ commitment_hours: v })} 
          error={errors.commitment_hours}
        />
        <ScaleSelector label="On a scale of 1-10, how motivated are you to work with proper incentives? *" value={formData.motivation} onSelect={(v: number) => onUpdate({ motivation: v })} />
      </div>
      <NavigationButtons onBack={onBack} onNext={handleNext} disabled={!formData.commitment_hours} />
    </StepWrapper>
  );
};

const ExperienceStep = ({ onNext, onBack, onUpdate, formData }: any) => (
  <StepWrapper title="Showcase Your Experience" subtitle="Drop a link to your resume, portfolio, Instagram, or anything that showcases your work. (Optional)">
    <FormInput icon={<Link />} placeholder="https://..." value={formData.experience_link} onChange={(v) => onUpdate({ experience_link: v })} />
    <NavigationButtons onBack={onBack} onNext={onNext} />
  </StepWrapper>
);

const FinalQuestionStep = ({ onSubmit, onBack, onUpdate, isSubmitting }: any) => {
  const handleSubmitClick = () => {
    onUpdate({ final_answer: 'Yes' });
    onSubmit();
  }

  return (
    <StepWrapper title="Do you want to build the next big thing?">
      <div className="flex justify-center items-center gap-4 mt-10">
        <button onClick={onBack} className="btn btn-outline px-8 py-3">Back</button>
        <button onClick={handleSubmitClick} className="btn btn-primary text-lg px-10 py-4 group" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Yes, Submit Application'}
          {!isSubmitting && <Send size={20} className="ml-2" />}
        </button>
      </div>
    </StepWrapper>
  );
};

const ThankYouStep = () => (
  <StepWrapper title="Thank You!">
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-10">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.2}} className="w-24 h-24 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check size={48} className="text-green-400" />
      </motion.div>
      <p className="text-xl text-neutral-300">Your application has been submitted. We'll be in touch soon!</p>
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
