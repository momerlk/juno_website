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
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import PrivacyPolicy from './components/policies/PrivacyPolicy';
import RefundPolicy from './components/policies/RefundPolicy';
import ShippingServicePolicy from './components/policies/ShippingServicePolicy';
import TermsConditions from './components/policies/TermsConditions';

import AdminAuth from "./components/admin/AdminAuth";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminProtectedRoute from "./components/admin/ProtectedRoute";


import AmbassadorAuth from "./components/ambassador/AmbassadorAuth";
import AmbassadorDashboard from "./components/ambassador/AmbassadorDashboard";
import AmbassadorProtectedRoute from "./components/ambassador/ProtectedRoute";

import { AmbassadorAuthProvider } from './contexts/AmbassadorAuthContext';
import BrandPage from './components/BrandPage';
import BrandsSection from './components/BrandsSection';

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
      <AdminAuthProvider>
        <SellerAuthProvider>
          <AmbassadorAuthProvider>
            <JunoStudioProvider>
              <div className="min-h-screen bg-background text-white">
              {!window.location.pathname.startsWith('/seller') && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/ambassador') && <Navbar />}
              <Routes>
                <Route path="/" element={
                  <main>
                    <Hero />
                    <BrandsSection />
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

                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/service-policy" element={<ShippingServicePolicy />} />
                <Route path="/terms-and-conditions" element={<TermsConditions />} />

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


                <Route path="/admin" element={
                  <AdminProtectedRoute>
                    <Navigate to="/admin/dashboard" replace />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/login" element={<AdminAuth />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />


                <Route path="/ambassador" element={
                  <AmbassadorProtectedRoute>
                    <Navigate to="/ambassador/dashboard" replace />
                  </AmbassadorProtectedRoute>
                } />
                <Route path="/ambassador/login" element={<AmbassadorAuth />} />
                <Route
                  path="/ambassador/dashboard"
                  element={
                    <AmbassadorProtectedRoute>
                      <AmbassadorDashboard />
                    </AmbassadorProtectedRoute>
                  }
                />
                
                <Route path="/:brandName" element={<BrandPage />} />
              </Routes>
              {!window.location.pathname.startsWith('/seller') && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/ambassador') && <Footer />}
              </div>
            </JunoStudioProvider>
          </AmbassadorAuthProvider>
        </SellerAuthProvider>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;