export const onboardingFlow = [
  'PhoneNumberEntry',
  'PasswordSetup',
  'NameEntry',
  'AgeEntry',
  'GenderSelection',
  'ProfilePictureEntry',
  'LocationRequest',
  'OTPVerification', 
];

export type OnboardingScreenName = typeof onboardingFlow[number];

// Helper function to get the next screen
export const getNextOnboardingScreen = (currentScreen: OnboardingScreenName): OnboardingScreenName | null => {
  const currentIndex = onboardingFlow.indexOf(currentScreen);
  if (currentIndex === -1 || currentIndex === onboardingFlow.length - 1) {
    return null; // No next screen or current screen not found
  }
  return onboardingFlow[currentIndex + 1];
};

// Helper function to get the previous screen (if needed for back navigation)
export const getPreviousOnboardingScreen = (currentScreen: OnboardingScreenName): OnboardingScreenName | null => {
  const currentIndex = onboardingFlow.indexOf(currentScreen);
  if (currentIndex <= 0) {
    return null; // No previous screen or current screen not found
  }
  return onboardingFlow[currentIndex - 1];
};
