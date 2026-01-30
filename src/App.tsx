import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import JunoApp from './components/JunoApp';
import JunoStudio from './components/JunoStudio';
import Pricing from './components/Pricing';
import Team from './components/Team';
import Mission from './components/Mission';
import DownloadSection from './components/DownloadSection';
import Footer from './components/Footer';
import ScreenshotsSection from './components/ScreenshotsSection';
import SellerAuth from './components/seller/SellerAuth';
import SellerDashboard from './components/seller/SellerDashboard';
import SellerOnboarding from './components/seller/SellerOnboarding';
import ProtectedRoute from './components/seller/ProtectedRoute';
import SellerHome from './components/seller/SellerHome';
import ManageInventory from './components/seller/ManageInventory';
import AdminManageOrders from './components/admin/ManageOrders';
import Analytics from './components/seller/Analytics';
import Profile from './components/seller/Profile';
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
import SellerManageOrders from './components/seller/ManageOrders';
import ManageSellers from './components/admin/ManageSellers';
import ManageUsers from './components/admin/ManageUsers';
import ManageInvites from './components/admin/ManageInvites';
import LocationMap from './components/admin/LocationMap';
import DeliveryCoverage from './components/admin/DeliveryCoverage';
import InteractionAnalytics from './components/admin/InteractionAnalytics';
import ProductPerformance from './components/admin/ProductPerformance';
import ManageNotifications from './components/admin/ManageNotifications';
import PlatformStats from './components/admin/PlatformStats';
import ApiStatus from './components/admin/ApiStatus';
import ChapterForms from './components/admin/ChapterForms';
import ManageProducts from './components/admin/ManageProducts';
import SystemTools from './components/admin/SystemTools';
import SalesFunnel from './components/admin/SalesFunnel';
import AmbassadorTasks from './components/admin/AmbassadorTasks';


import AmbassadorAuth from "./components/ambassador/AmbassadorAuth";
import AmbassadorDashboard from "./components/ambassador/AmbassadorDashboard";
import AmbassadorProtectedRoute from "./components/ambassador/ProtectedRoute";

import { AmbassadorAuthProvider } from './contexts/AmbassadorAuthContext';
import BrandPage from './components/BrandPage';
import BrandsSection from './components/BrandsSection';
import BlogIndexPage from './components/blog/BlogIndexPage';
import BlogPostPage from './components/blog/BlogPostPage';
import WritePage from './components/blog/WritePage';
import ProductPage from './components/ProductPage';
import DownloadRedirect from './components/DownloadRedirect';
import ChapterFormPage from './components/chapter/ChapterFormPage';

import WorkAuth from "./components/work/WorkAuth";
import WorkDashboard from "./components/work/WorkDashboard";
import WorkProtectedRoute from "./components/work/ProtectedRoute";
import { WorkAuthProvider } from './contexts/WorkAuthContext';

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
          <WorkAuthProvider>
            <AmbassadorAuthProvider>
              <JunoStudioProvider>
                <div className="min-h-screen bg-background text-white">
                {!window.location.pathname.startsWith('/seller') && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/ambassador') && !window.location.pathname.startsWith('/work') && <Navbar />}
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
                    </main>
                  } />

                  <Route path="/blog" element={<BlogIndexPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/write" element={<WritePage />} />

                  <Route path="/download" element={<DownloadRedirect />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/service-policy" element={<ShippingServicePolicy />} />
                  <Route path="/terms-and-conditions" element={<TermsConditions />} />

                  <Route path="/chapters" element={<ChapterFormPage />} />
                  <Route path="/chapters/:university" element={<ChapterFormPage />} />

                  <Route path="/seller" element={
                    <ProtectedRoute>
                      <Navigate to="/seller/dashboard" replace />
                    </ProtectedRoute>
                  } />
                  <Route path="/seller/auth" element={<SellerAuth />} />
                  <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}>
                    <Route index element={<SellerHome />} />
                    <Route path="inventory" element={<ManageInventory />} />
                    <Route path="orders" element={<SellerManageOrders />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>
                  <Route path="/seller/onboarding" element={
                      <SellerOnboarding />
                  } />


                  <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>}>
                    <Route index element={<PlatformStats />} />
                    <Route path="orders" element={<AdminManageOrders />} />
                    <Route path="sellers" element={<ManageSellers />} />
                    <Route path="users" element={<ManageUsers />} />
                    <Route path="invites" element={<ManageInvites />} />
                    <Route path="locations" element={<LocationMap />} />
                    <Route path="delivery" element={<DeliveryCoverage />} />
                    <Route path="interactions" element={<InteractionAnalytics />} />
                    <Route path="product-performance" element={<ProductPerformance />} />
                    <Route path="notifications" element={<ManageNotifications />} />
                    <Route path="products" element={<ManageProducts />} />
                    <Route path="funnel" element={<SalesFunnel />} />
                    <Route path="system" element={<SystemTools />} />
                    <Route path="api-status" element={<ApiStatus />} />
                    <Route path="chapter-forms" element={<ChapterForms />} />
                    <Route path="ambassador-tasks" element={<AmbassadorTasks />} />
                  </Route>
                  <Route path="/admin/login" element={<AdminAuth />} />


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

                  <Route path="/work" element={
                    <WorkProtectedRoute>
                      <Navigate to="/work/dashboard" replace />
                    </WorkProtectedRoute>
                  } />
                  <Route path="/work/auth" element={<WorkAuth />} />
                  <Route
                    path="/work/dashboard"
                    element={
                      <WorkProtectedRoute>
                        <WorkDashboard />
                      </WorkProtectedRoute>
                    }
                  />
                  
                  <Route path="/product/:productId" element={<ProductPage />} />
                  <Route path="/:brandName" element={<BrandPage />} />
                </Routes>
                {!window.location.pathname.startsWith('/seller') && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/ambassador') && !window.location.pathname.startsWith('/work') && <Footer />}
                </div>
              </JunoStudioProvider>
            </AmbassadorAuthProvider>
          </WorkAuthProvider>
        </SellerAuthProvider>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;