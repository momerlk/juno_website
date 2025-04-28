import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import JunoApp from './components/JunoApp';
import JunoStudio from './components/JunoStudio';
import Pricing from './components/Pricing';
import Team from './components/Team';
import Mission from './components/Mission';
import Contact from './components/Contact';
import DownloadSection from './components/DownloadSection';
import Footer from './components/Footer';
import ScreenshotsSection from './components/ScreenshotsSection';
import SellerAuth from './components/seller/SellerAuth';
import SellerDashboard from './components/seller/SellerDashboard';
import SellerOnboarding from './components/seller/SellerOnboarding';
import ProtectedRoute from './components/seller/ProtectedRoute';
import { SellerAuthProvider } from './contexts/SellerAuthContext';
import { JunoStudioProvider } from './contexts/JunoStudioContext';

function App() {
  useEffect(() => {
    // Update page title
    document.title = 'Juno - Swipe to Shop Fashion App';
    
    // If the title element has a data-default attribute, remove it
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.hasAttribute('data-default')) {
      titleElement.removeAttribute('data-default');
    }
  }, []);

  return (
    <Router>
      <SellerAuthProvider>
        <JunoStudioProvider>
          <div className="min-h-screen bg-background text-white">
          {!window.location.pathname.startsWith('/seller') && <Navbar />}
          <Routes>
            <Route path="/" element={
              <main>
                <Hero />
                <JunoApp />
                <ScreenshotsSection />
                <Mission />
                <JunoStudio />
                <Pricing />
                <Team />
                <DownloadSection />
                <Contact />
              </main>
            } />
            <Route path="/seller" element={
              <ProtectedRoute>
                <Navigate to="/seller/dashboard" replace />
              </ProtectedRoute>
            } />
            <Route path="/seller/auth" element={<SellerAuth />} />
            <Route path="/seller/dashboard" element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/seller/onboarding" element={
                <SellerOnboarding />
            } />
          </Routes>
          <Footer />
          </div>
        </JunoStudioProvider>
      </SellerAuthProvider>
    </Router>
  );
}

export default App;