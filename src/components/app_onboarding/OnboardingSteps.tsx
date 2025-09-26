
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Auth, Invites, OTP, uploadFileAndGetUrl } from '../../api/userApi';
import { User, UserResponse } from './user';

// --- UI Building Blocks ---

const OnboardingStep = ({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) => (
  <>
    <style>{`
        .onboarding-step-container {
            background-image: url('/doodle.png'); /* Default for all */
            background-color: #121212;
            background-blend-mode: overlay;
            background-size: cover;
            background-position: center;
        }
        @media (orientation: landscape) {
            .onboarding-step-container {
                background-image: url('/doodle_landscape.png'); /* Override for landscape */
            }
        }
    `}</style>
    <div 
      className="onboarding-step-container min-h-screen text-white flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md flex flex-col items-center text-center pt-20">
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Nova-Bold', sans-serif" }}>{title}</h1>
        {subtitle && <p className="text-[#AEAEB2] text-base mb-8 max-w-xs">{subtitle}</p>}
        {children}
      </div>
    </div>
  </>
);

export const OnboardingInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input
    ref={ref}
    {...props}
    className={`w-full h-14 bg-[#1E1E1E] border border-[#444444] rounded-lg px-4 text-white placeholder-[#AEAEB2] focus:outline-none focus:border-[#FF2D55] focus:ring-1 focus:ring-[#FF2D55] ${props.className}`}
  />
));

export const OnboardingButton = ({ onClick, children, disabled }: { onClick: (e: React.MouseEvent<HTMLButtonElement>) => void, children: React.ReactNode, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full h-14 bg-[#FF2D55] rounded-full font-bold text-white text-lg hover:bg-red-700 disabled:bg-[#333333] transition-colors"
    style={{ fontFamily: "'Nova-Bold', sans-serif" }}
  >
    {children}
  </button>
);

// --- Step Components ---

export const InviteVerification = ({ onVerified, onAlreadyHaveAccount }: { onVerified: (code: string) => void, onAlreadyHaveAccount: () => void }) => {
  const [code, setCode] = useState<string[]>(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    if (!/^[a-zA-Z0-9]*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text.toUpperCase();
    setCode(newCode);

    if (text && index < 4) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const finalCode = code.join('');
    if (finalCode.length !== 5) {
      setError('Invite code must be 5 letters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await Invites.GetInviteByCode(finalCode.toLowerCase());
      if (response.ok) {
        onVerified(finalCode);
      } else {
        setError(response.body as any || 'Invalid invite code.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStep title="what's the code?">
      <img src="/eyes.png" alt="eyes" className="w-28 h-auto mb-10 animate-bounce" />
      <div className="flex justify-center gap-2 mb-6">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => inputs.current[index] = el}
            value={digit}
            onChange={e => handleCodeChange(e.target.value.slice(-1), index)}
            onKeyDown={e => handleKeyPress(e, index)}
            maxLength={1}
            className="w-12 h-14 bg-[#1E1E1E] border border-[#444444] rounded-lg text-center text-white text-2xl font-bold focus:border-[#FF2D55] focus:outline-none"
            style={{ fontFamily: "'Nova-Bold', sans-serif" }}
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
      <div className="w-full max-w-xs">
        <OnboardingButton onClick={handleVerify} disabled={loading || code.join('').length < 5}>
          {loading ? 'Verifying...' : 'Continue'}
        </OnboardingButton>
      </div>
      <button onClick={onAlreadyHaveAccount} className="mt-6 text-[#AEAEB2] hover:text-white">
        Already have an account?
      </button>
    </OnboardingStep>
  );
};

export const PhoneNumberEntry = ({ onNext }: { onNext: (data: { phone_number: string }) => void }) => {
  const [phone, setPhone] = useState('');
  const handleNext = () => {
    if (/^3\d{9}$/.test(phone)) {
      onNext({ phone_number: `+92${phone}` });
    } else {
      alert('Please enter a valid 10-digit Pakistan phone number (e.g., 3001234567).');
    }
  };
  return (
    <OnboardingStep title="Can I get your number? 😉" subtitle="We'll text you a code to verify you're really you.">
        <div className="flex gap-2 w-full max-w-xs">
            <div className="w-24 h-14 flex items-center justify-center bg-[#1E1E1E] border border-[#444444] rounded-lg text-white">🇵🇰 +92</div>
            <OnboardingInput type="tel" placeholder="3XX XXXXXXX" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} maxLength={10} />
        </div>
        <div className="w-full max-w-xs mt-6">
            <OnboardingButton onClick={handleNext} disabled={phone.length < 10}>Next</OnboardingButton>
        </div>
    </OnboardingStep>
  );
};

export const PasswordSetup = ({ onNext }: { onNext: (data: { password: string }) => void }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleNext = () => {
    if (password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }
    onNext({ password });
  };
  return (
    <OnboardingStep title="Create a password" subtitle="Make it strong and memorable.">
        <div className="space-y-4 w-full max-w-xs">
            <div className="relative">
                <OnboardingInput type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AEAEB2]">
                    {showPassword ? 'Hide' : 'Show'}
                </button>
            </div>
            <div className="relative">
                <OnboardingInput type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AEAEB2]">
                    {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
            </div>
            <OnboardingButton onClick={handleNext} disabled={!password || !confirmPassword}>Next</OnboardingButton>
        </div>
    </OnboardingStep>
  );
};

export const NameEntry = ({ onNext }: { onNext: (data: { name: string }) => void }) => {
  const [name, setName] = useState('');
  const handleNext = () => {
    if (name.trim()) {
      onNext({ name: name.trim() });
    } else {
      alert('Please enter your name.');
    }
  };
  return (
    <OnboardingStep title="What to call you?">
        <div className="space-y-4 w-full max-w-xs">
            <OnboardingInput type="text" placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} />
            <OnboardingButton onClick={handleNext} disabled={!name.trim()}>Next</OnboardingButton>
        </div>
    </OnboardingStep>
  );
};

export const AgeEntry = ({ onNext }: { onNext: (data: { age: number, date_of_birth: string }) => void }) => {
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);

    const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        setDay(val);
        if (val.length === 2) {
            monthRef.current?.focus();
        }
    }
    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        setMonth(val);
        if (val.length === 2) {
            yearRef.current?.focus();
        }
    }

    const handleNext = () => {
        const dob = `${year}-${month}-${day}`;
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime()) || !year || !month || !day) {
            alert('Please enter a valid date of birth.');
            return;
        }
        let age = new Date().getFullYear() - birthDate.getFullYear();
        const m = new Date().getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && new Date().getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 13) {
            alert('You must be at least 13 years old to sign up.');
            return;
        }
        onNext({ age, date_of_birth: birthDate.toISOString() });
    };
    return (
        <OnboardingStep title="How old are you?" subtitle="Your date of birth won't be visible on your profile.">
            <div className="flex items-center justify-center gap-3 w-full max-w-xs">
                <OnboardingInput className="text-center" placeholder="DD" value={day} onChange={handleDayChange} maxLength={2} />
                <span className="text-2xl text-[#AEAEB2] -mt-1">/</span>
                <OnboardingInput ref={monthRef} className="text-center" placeholder="MM" value={month} onChange={handleMonthChange} maxLength={2} />
                <span className="text-2xl text-[#AEAEB2] -mt-1">/</span>
                <OnboardingInput ref={yearRef} className="text-center" placeholder="YYYY" value={year} onChange={e => setYear(e.target.value.replace(/\D/g, ''))} maxLength={4} />
            </div>
            <div className="w-full max-w-xs mt-6">
                <OnboardingButton onClick={handleNext} disabled={!day || !month || year.length < 4}>Next</OnboardingButton>
            </div>
        </OnboardingStep>
  );
};

export const GenderSelection = ({ onNext }: { onNext: (data: { gender: string }) => void }) => {
  const handleSelect = (gender: string) => {
    onNext({ gender });
  };
  return (
    <OnboardingStep title="What's your gender?" subtitle="This helps us tailor fashion recommendations for you.">
        <div className="space-y-4 w-full max-w-xs">
            <button onClick={() => handleSelect('male')} className="w-full h-14 border border-white rounded-full text-lg font-bold">Male</button>
            <button onClick={() => handleSelect('female')} className="w-full h-14 border border-white rounded-full text-lg font-bold">Female</button>
            <button onClick={() => handleSelect('other')} className="w-full h-14 border border-white rounded-full text-lg font-bold">Other</button>
        </div>
    </OnboardingStep>
  );
};

export const ProfilePictureEntry = ({ onNext }: { onNext: (data: { avatar: string }) => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setLoading(true);
      setError('');
      try {
        const url = await uploadFileAndGetUrl(file, 'profile');
        onNext({ avatar: url }); // Go to next step immediately
      } catch (err) {
        setError('Failed to upload image. Please try again.');
        console.error(err);
        setPreview(null);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <OnboardingStep title="Add a profile picture" subtitle="A profile picture is required. Help others recognize you!">
        <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
            <label htmlFor="avatar-upload" className="w-40 h-40 rounded-full bg-[#1E1E1E] border-2 border-dashed border-[#444444] flex items-center justify-center cursor-pointer overflow-hidden">
                {preview ? <img src={preview} alt="Avatar Preview" className="w-full h-full object-cover" /> : <span className="text-[#AEAEB2] text-5xl">+</span>}
            </label>
            <input type="file" id="avatar-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
            
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <OnboardingButton onClick={() => document.getElementById('avatar-upload')?.click()} disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Photo'}
            </OnboardingButton>
        </div>
    </OnboardingStep>
  );
};

export const LocationRequest = ({ user, password, inviteCode, onRegistrationSuccess, onRegistrationFailure }: { user: Partial<User>, password?: string, inviteCode?: string, onRegistrationSuccess: (user: User) => void, onRegistrationFailure: (error: string) => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const registerWithLocation = async (locationData: { latitude: number, longitude: number }) => {
    setLoading(true);

    const finUser = {
            phone_number: user.phone_number,
            gender: user.gender,
            age: user.age,
            date_of_birth: user.date_of_birth,
            name: user.name,
            location: locationData,
            avatar: user.avatar,
        }
    

        const registrationData : any = {
          password: password!,
          user: finUser,
        };

        console.log(`registration data = ${JSON.stringify(registrationData)}`)

        try {
          const response = await Auth.Register(registrationData);
          if (response.ok) {
            await Invites.IncrementInvite(inviteCode!.toLowerCase(), response.body.user.id);
            onRegistrationSuccess(finUser as any);
          } else {
            const errorMessage = response.body.message || 'Registration failed.';
            alert(`Registration Failed: ${errorMessage}`);
            onRegistrationFailure(errorMessage);
          }
        } catch (err) {
          const errorMessage = 'An unexpected error occurred during registration.';
          alert(errorMessage);
          onRegistrationFailure(errorMessage);
        } finally {
          setLoading(false);
        }
  };

  const handleAllow = () => {
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        registerWithLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        console.error(err);
        setError('Could not get location. You can enable it later in your profile for instant delivery.');
        // Proceed with default location if permission is denied
        registerWithLocation({ latitude: 0, longitude: 0 });
      }
    );
  };

  const handleSkip = () => {
    registerWithLocation({ latitude: 0, longitude: 0 });
  };

  return (
    <OnboardingStep title="Enable location" subtitle="Enable location for our instant delivery feature. You can also skip this for now.">
        <div className="space-y-4 w-full max-w-xs">
            {error && <p className="text-yellow-500 text-sm text-center mb-4">{error}</p>}
            <OnboardingButton onClick={handleAllow} disabled={loading}>
                {loading ? 'Please wait...' : 'Allow Location & Register'}
            </OnboardingButton>
            <button onClick={handleSkip} className="w-full text-[#AEAEB2] hover:text-white" disabled={loading}>
                Skip for now
            </button>
        </div>
    </OnboardingStep>
  );
};

export const OTPVerification = ({ phone_number, onVerified }: { phone_number: string, onVerified: () => void }) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    inputs.current[0]?.focus();
    const interval = setInterval(() => {
        setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    if (!/^[0-9]*$/.test(text)) return; // Numbers only

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) { // 3 because it's a 4-digit code (0, 1, 2, 3)
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError('');
    try {
        const response = await OTP.Send(phone_number);
        if (response.ok) {
            setTimer(60); // Restart timer
        } else {
            setError(response.body.message || 'Failed to resend OTP.');
        }
    } catch (err) {
        setError('An error occurred while resending OTP.');
    } finally {
        setLoading(false);
    }
  };

  const handleVerify = async () => {
    const finalOtp = otp.join('');
    if (finalOtp.length !== 4) {
      setError('OTP must be 4 digits.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await OTP.Verify(phone_number, finalOtp);
      if (response.ok) {
        onVerified();
      } else {
        setError(response.body.message || 'Invalid OTP.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStep title="Verify your number" subtitle={`Enter the 4-digit code we sent to ${phone_number}.`}>
        <div className="flex justify-center gap-2 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputs.current[index] = el}
            value={digit}
            onChange={e => handleCodeChange(e.target.value.slice(-1), index)}
            onKeyDown={e => handleKeyPress(e, index)}
            maxLength={1}
            className="w-12 h-14 bg-[#1E1E1E] border border-[#444444] rounded-lg text-center text-white text-2xl font-bold focus:border-[#FF2D55] focus:outline-none"
            style={{ fontFamily: "'Nova-Bold', sans-serif" }}
          />
        ))}
      </div>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <div className="w-full max-w-xs space-y-4">
            <OnboardingButton onClick={handleVerify} disabled={loading || otp.join('').length < 4}>
                {loading ? 'Verifying...' : 'Verify'}
            </OnboardingButton>
            <button onClick={handleResend} className="w-full text-[#AEAEB2] hover:text-white disabled:text-gray-600" disabled={timer > 0 || loading}>
                {timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
            </button>
        </div>
    </OnboardingStep>
  );
};
