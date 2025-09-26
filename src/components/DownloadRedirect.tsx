import React, { useState } from 'react';
import { Auth, Invites } from '../api/userApi';
import { User, UserResponse, Location, USER_STATUS } from './app_onboarding/user';
import { onboardingFlow, OnboardingScreenName, getNextOnboardingScreen } from './app_onboarding/onboarding_flow';

import {
  InviteVerification,
  PhoneNumberEntry,
  PasswordSetup,
  NameEntry,
  AgeEntry,
  GenderSelection,
  ProfilePictureEntry,
  LocationRequest,
  OTPVerification,
} from './app_onboarding/OnboardingSteps';

const RenderAppLinks = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: '#0A0A0A',
        color: 'white',
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#4CAF50' }}>
        Account Created!
      </h1>
      <p style={{ marginBottom: '20px', fontSize: '1rem', maxWidth: '600px' }}>
        Due to high demand, we've streamlined our signup process. Please download the app and tap on the <strong style={{ color: '#FF2D55' }}>"Already have an account?"</strong> option on the welcome screen to sign in.
      </p>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
        Download the Juno App
      </h2>
      <p style={{ marginBottom: '30px', fontSize: '1rem' }}>
        Please use the links below:
      </p>
      <div>
        <a
          href="https://apps.apple.com/pk/app/juno-swipe-to-shop/id6751541492"
          style={{ color: '#FF1818', marginRight: '20px', fontSize: '1rem' }}
        >
          iOS App
        </a>
        <a
          href="https://storage.googleapis.com/juno_media/constants/juno_1.0.1.apk"
          style={{ color: '#FF1818', fontSize: '1rem' }}
        >
          Android App
        </a>
      </div>
    </div>
  );
};

const DownloadRedirect: React.FC = () => {
  const [step, setStep] = useState<OnboardingScreenName | 'InviteVerification' | 'Submitting' | 'Completed' | 'Error'>('InviteVerification');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [user, setUser] = useState<Partial<User>>({});
  const [error, setError] = useState<string>('');

  const handleNextStep = (currentStep: OnboardingScreenName | 'InviteVerification', data: any) => {
    if (currentStep === 'InviteVerification') {
        setInviteCode(data.code);
        setStep('PhoneNumberEntry');
        return;
    }
    
    if (data.password) {
        setPassword(data.password);
    } else {
        setUser(prev => ({ ...prev, ...data }));
    }

    const nextScreen = getNextOnboardingScreen(currentStep as OnboardingScreenName);
    if (nextScreen) {
      setStep(nextScreen);
    } else {
        // This should not be reached if LocationRequest is the last step in the flow array
        // as it handles its own transition.
    }
  };

  switch (step) {
    case 'InviteVerification':
      return <InviteVerification 
        onVerified={(code) => handleNextStep('InviteVerification', { code })}
        onAlreadyHaveAccount={() => setStep('Completed')}
      />;
    case 'PhoneNumberEntry':
      return <PhoneNumberEntry onNext={(data) => handleNextStep('PhoneNumberEntry', data)} />;
    case 'PasswordSetup':
        return <PasswordSetup onNext={(data) => handleNextStep('PasswordSetup', data)} />;
    case 'NameEntry':
      return <NameEntry onNext={(data) => handleNextStep('NameEntry', data)} />;
    case 'AgeEntry':
      return <AgeEntry onNext={(data) => handleNextStep('AgeEntry', data)} />;
    case 'GenderSelection':
      return <GenderSelection onNext={(data) => handleNextStep('GenderSelection', data)} />;
    case 'ProfilePictureEntry':
      return <ProfilePictureEntry onNext={(data) => handleNextStep('ProfilePictureEntry', data)} />;
    case 'LocationRequest':
      return <LocationRequest 
        user={user}
        password={password}
        inviteCode={inviteCode}
        onRegistrationSuccess={(finalUser) => {
            setUser(finalUser);
            setStep('OTPVerification');
        }}
        onRegistrationFailure={(err) => {
            setError(err);
            setStep('Error');
        }}
      />;
    case 'OTPVerification':
      return <OTPVerification phone_number={user.phone_number!} onVerified={() => setStep('Completed')} />;
    case 'Submitting':
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Creating your account...</div>;
    case 'Completed':
      return <RenderAppLinks />;
    case 'Error':
        return <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center"><h2>Something went wrong</h2><p>{error}</p></div>;
    default:
      return <div>Unknown step</div>;
  }
};

export default DownloadRedirect;