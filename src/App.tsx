import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/landing/Hero';
import Footer from './components/Footer';
const JunoApp = React.lazy(() => import('./components/landing/JunoApp'));
const Mission = React.lazy(() => import('./components/landing/Mission'));
const DownloadSection = React.lazy(() => import('./components/landing/DownloadSection'));
const ScreenshotsSection = React.lazy(() => import('./components/landing/ScreenshotsSection'));
const SellerAuth = React.lazy(() => import('./components/seller/SellerAuth'));
const SellerDashboard = React.lazy(() => import('./components/seller/SellerDashboard'));
const SellerOnboarding = React.lazy(() => import('./components/seller/SellerOnboarding'));
const ProtectedRoute = React.lazy(() => import('./components/seller/ProtectedRoute'));
const SellerHome = React.lazy(() => import('./components/seller/SellerHome'));
const ManageInventory = React.lazy(() => import('./components/seller/ManageInventory'));
const AdminManageOrders = React.lazy(() => import('./components/admin/ManageOrders'));
const Analytics = React.lazy(() => import('./components/seller/Analytics'));
const Profile = React.lazy(() => import('./components/seller/Profile'));
const JunoStudioLanding = React.lazy(() => import('./components/seller/JunoStudioLanding'));
import { SellerAuthProvider } from './contexts/SellerAuthContext';
import { JunoStudioProvider } from './contexts/JunoStudioContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
const PrivacyPolicy = React.lazy(() => import('./components/policies/PrivacyPolicy'));
const RefundPolicy = React.lazy(() => import('./components/policies/RefundPolicy'));
const ShippingServicePolicy = React.lazy(() => import('./components/policies/ShippingServicePolicy'));
const TermsConditions = React.lazy(() => import('./components/policies/TermsConditions'));

const AdminAuth = React.lazy(() => import("./components/admin/AdminAuth"));
const AdminDashboard = React.lazy(() => import("./components/admin/AdminDashboard"));
const AdminProtectedRoute = React.lazy(() => import("./components/admin/ProtectedRoute"));
const SellerManageOrders = React.lazy(() => import('./components/seller/ManageOrders'));
const ShopifySuccess = React.lazy(() => import('./components/seller/ShopifySuccess'));
const ManageSellers = React.lazy(() => import('./components/admin/ManageSellers'));
const ManageUsers = React.lazy(() => import('./components/admin/ManageUsers'));
const ManageInvites = React.lazy(() => import('./components/admin/ManageInvites'));
const LocationMap = React.lazy(() => import('./components/admin/LocationMap'));
const DeliveryCoverage = React.lazy(() => import('./components/admin/DeliveryCoverage'));
const InteractionAnalytics = React.lazy(() => import('./components/admin/InteractionAnalytics'));
const ProductPerformance = React.lazy(() => import('./components/admin/ProductPerformance'));
const ManageNotifications = React.lazy(() => import('./components/admin/ManageNotifications'));
const PlatformStats = React.lazy(() => import('./components/admin/PlatformStats'));
const ApiStatus = React.lazy(() => import('./components/admin/ApiStatus'));
const ChapterForms = React.lazy(() => import('./components/admin/ChapterForms'));
const ManageProducts = React.lazy(() => import('./components/admin/ManageProducts'));
const SystemTools = React.lazy(() => import('./components/admin/SystemTools'));
const SalesFunnel = React.lazy(() => import('./components/admin/SalesFunnel'));
const AmbassadorTasks = React.lazy(() => import('./components/admin/AmbassadorTasks'));


const AmbassadorAuth = React.lazy(() => import("./components/ambassador/AmbassadorAuth"));
const AmbassadorDashboard = React.lazy(() => import("./components/ambassador/AmbassadorDashboard"));
const AmbassadorProtectedRoute = React.lazy(() => import("./components/ambassador/ProtectedRoute"));

import { AmbassadorAuthProvider } from './contexts/AmbassadorAuthContext';
const BrandPage = React.lazy(() => import('./components/BrandPage'));
const BrandsSection = React.lazy(() => import('./components/landing/BrandsSection'));
const BrandShowcase = React.lazy(() => import('./components/landing/BrandShowcase'));
const BrandSpotlight = React.lazy(() => import('./components/landing/BrandSpotlight'));
const CatchyProducts = React.lazy(() => import('./components/landing/CatchyProducts'));
const TestimonialsSection = React.lazy(() => import('./components/landing/TestimonialsSection'));
const BlogIndexPage = React.lazy(() => import('./components/blog/BlogIndexPage'));
const BlogPostPage = React.lazy(() => import('./components/blog/BlogPostPage'));
const WritePage = React.lazy(() => import('./components/blog/WritePage'));
const ProductPage = React.lazy(() => import('./components/ProductPage'));
const DownloadRedirect = React.lazy(() => import('./components/DownloadRedirect'));
const ChapterFormPage = React.lazy(() => import('./components/chapter/ChapterFormPage'));
const BrandReelGraphic = React.lazy(() => import('./components/BrandReelGraphic'));

const WorkAuth = React.lazy(() => import("./components/work/WorkAuth"));
const WorkDashboard = React.lazy(() => import("./components/work/WorkDashboard"));
const WorkProtectedRoute = React.lazy(() => import("./components/work/ProtectedRoute"));
import { WorkAuthProvider } from './contexts/WorkAuthContext';

// Probe Analytics
import { useProbeAnalytics } from './hooks/useProbe';

const AppShellFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/65">
      Loading workspace...
    </div>
  </div>
);

function App() {
  // Initialize Probe analytics for automatic page view and session tracking
  useProbeAnalytics();
  
  useEffect(() => {
    document.title = 'Juno - Home of Indie Brands';
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
                {!window.location.pathname.startsWith('/seller') && !window.location.pathname.startsWith('/studio') && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/ambassador') && !window.location.pathname.startsWith('/work') && !window.location.pathname.startsWith('/brand-reel') && <Navbar />}
                <Suspense fallback={<AppShellFallback />}>
                <Routes>
                  <Route path="/" element={
                    <main>
                      <Hero />
                      <BrandSpotlight />
                      <CatchyProducts />
                      <BrandShowcase />
                      <BrandsSection />
                      <TestimonialsSection />
                      <JunoApp />
                      <ScreenshotsSection />
                      <Mission />
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

                  {/* Juno Studio (Seller) Routes */}
                  <Route path="/studio" element={<JunoStudioLanding />} />
                  <Route path="/seller" element={<JunoStudioLanding />} />
                  
                  <Route path="/seller/auth" element={<SellerAuth />} />
                  <Route path="/studio/auth" element={<SellerAuth />} />

                  <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}>
                    <Route index element={<SellerHome />} />
                    <Route path="inventory" element={<ManageInventory />} />
                    <Route path="orders" element={<SellerManageOrders />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>

                  <Route path="/studio/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}>
                    <Route index element={<SellerHome />} />
                    <Route path="inventory" element={<ManageInventory />} />
                    <Route path="orders" element={<SellerManageOrders />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>

                  <Route path="/seller/onboarding" element={<SellerOnboarding />} />
                  <Route path="/studio/onboarding" element={<SellerOnboarding />} />

                  <Route path="/shopify/success" element={<ShopifySuccess />} />

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
                  <Route path="/brand-reel" element={<BrandReelGraphic />} />
                  <Route path="/:brandName" element={<BrandPage />} />
                </Routes>
                </Suspense>
                {!window.location.pathname.startsWith('/seller') && !window.location.pathname.startsWith('/studio') && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/ambassador') && !window.location.pathname.startsWith('/work') && !window.location.pathname.startsWith('/brand-reel') && <Footer />}
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
