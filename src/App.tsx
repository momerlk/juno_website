import React, { Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/landing/Hero';
import Footer from './components/Footer';
import { GuestCartProvider } from './contexts/GuestCartContext';
import CartDrawer from './components/cart/CartDrawer';
import CartStockLimitToast from './components/cart/CartStockLimitToast';
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
const SellerOrderDetailPage = React.lazy(() => import('./components/seller/OrderDetailPage'));
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
const ManageInvites = React.lazy(() => import('./components/admin/ManageInvites'));
const ManageNotifications = React.lazy(() => import('./components/admin/ManageNotifications'));
const ManageProducts = React.lazy(() => import('./components/admin/ManageProducts'));
const CreateProductPage = React.lazy(() => import('./components/admin/CreateProductPage'));
const OrderDetailPage = React.lazy(() => import('./components/admin/OrderDetailPage'));
const BrandsSection = React.lazy(() => import('./components/landing/BrandsSection'));
const BrandShowcase = React.lazy(() => import('./components/landing/BrandShowcase'));
const CatchyProducts = React.lazy(() => import('./components/landing/CatchyProducts'));
const TestimonialsSection = React.lazy(() => import('./components/landing/TestimonialsSection'));
const CatalogProductPage = React.lazy(() => import('./components/catalog/CatalogProductPage'));
const CatalogLandingPage = React.lazy(() => import('./components/catalog/CatalogLandingPage'));
const CatalogGenderPage = React.lazy(() => import('./components/catalog/CatalogGenderPage'));
const CatalogBrowsePage = React.lazy(() => import('./components/catalog/CatalogBrowsePage'));
const DownloadRedirect = React.lazy(() => import('./components/DownloadRedirect'));
const CheckoutPage = React.lazy(() => import('./components/checkout/CheckoutPage'));
const OrderConfirmationPage = React.lazy(() => import('./components/checkout/OrderConfirmationPage'));
const OrderTrackingPage = React.lazy(() => import('./components/checkout/OrderTrackingPage'));
const InteractiveTrackingPage = React.lazy(() => import('./components/checkout/InteractiveTrackingPage'));
const WishlistPage = React.lazy(() => import('./components/catalog/WishlistPage'));

// Probe Analytics
import { useProbeAnalytics } from './hooks/useProbe';
import {
  consentClarityV2,
  getClarityCustomIdFromIdentity,
  getClarityFriendlyNameFromIdentity,
  getClarityRoleFromIdentity,
  identifyClarityFromIdentity,
  initClarity,
  resolveClarityIdentityFromStorage,
  setClarityTags,
  trackClarityEventWithTags,
} from './utils/clarity';

const AppShellFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/65">
      Loading workspace...
    </div>
  </div>
);

const LegacyProductRedirect = () => {
  const { productId } = useParams<{ productId: string }>();
  return <Navigate to={productId ? `/catalog/${productId}` : '/catalog'} replace />;
};

const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return null;
};

function RoutedApp() {
  // Initialize Probe analytics for automatic page view and session tracking
  useProbeAnalytics();
  const location = useLocation();
  const clarityIdentityRef = useRef<ReturnType<typeof resolveClarityIdentityFromStorage>>(null);
  
  const isExcludedPath = location.pathname.startsWith('/seller') || 
                         location.pathname.startsWith('/studio') || 
                         location.pathname.startsWith('/admin') || 
                         location.pathname.startsWith('/catalog') || 
                         location.pathname.startsWith('/checkout') || 
                         location.pathname.startsWith('/track') || 
                         location.pathname.startsWith('/wishlist');

  useEffect(() => {
    document.title = 'Juno - Home of Indie Brands';
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.hasAttribute('data-default')) {
      titleElement.removeAttribute('data-default');
    }
  }, []);

  useEffect(() => {
    initClarity();
    consentClarityV2({ ad_Storage: 'denied', analytics_Storage: 'granted' });
    clarityIdentityRef.current = resolveClarityIdentityFromStorage();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const pathParts = path.split('/').filter(Boolean);
    const clarityIdentity = clarityIdentityRef.current;
    const pageType = path.startsWith('/admin')
      ? 'admin'
      : path.startsWith('/seller') || path.startsWith('/studio')
        ? 'seller'
        : path.startsWith('/checkout')
          ? 'checkout'
          : 'website';

    identifyClarityFromIdentity(clarityIdentity, path);

    setClarityTags({
      route_path: path,
      route_query: location.search || 'none',
      page_type: pageType,
      campaign_slug: 'none',
      actor_role: getClarityRoleFromIdentity(clarityIdentity),
      actor_id: getClarityCustomIdFromIdentity(clarityIdentity),
      actor_name: getClarityFriendlyNameFromIdentity(clarityIdentity),
    });

    trackClarityEventWithTags('spa_page_view', { page_type: pageType });
  }, [location.pathname, location.search]);

  return (
    <AdminAuthProvider>
      <SellerAuthProvider>
        <JunoStudioProvider>
          <GuestCartProvider>
              <div className="min-h-screen bg-background text-white">
              <ScrollToTop />
              {!isExcludedPath && <Navbar />}
              <Suspense fallback={<AppShellFallback />}>
              <Routes>
                  <Route path="/" element={
                    <main>
                      <Hero />
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

                <Route path="/download" element={<DownloadRedirect />} />
                
                {/* Catalog routes:
                    `/catalog` is the landing screen.
                    `/catalog/all` is the full searchable browse view.
                    `/catalog/women` and `/catalog/men` are curated gender edits. */}
                <Route path="/catalog" element={<CatalogLandingPage />} />
                <Route path="/catalog/all" element={<CatalogBrowsePage />} />
                <Route path="/catalog/women" element={<CatalogGenderPage gender="women" />} />
                <Route path="/catalog/men" element={<CatalogGenderPage gender="men" />} />
                <Route path="/catalog/:productId" element={<CatalogProductPage />} />
                
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/confirmation" element={<OrderConfirmationPage />} />
                <Route path="/checkout/track/:orderId" element={<InteractiveTrackingPage />} />
                <Route path="/track" element={<OrderTrackingPage />} />
                <Route path="/track/:token" element={<InteractiveTrackingPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/service-policy" element={<ShippingServicePolicy />} />
                  <Route path="/terms-and-conditions" element={<TermsConditions />} />

                  {/* Juno Studio (Seller) Routes */}
                  <Route path="/studio" element={<JunoStudioLanding />} />
                  <Route path="/seller" element={<JunoStudioLanding />} />
                  
                  <Route path="/seller/auth" element={<SellerAuth />} />
                  <Route path="/studio/auth" element={<SellerAuth />} />

                  <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}>
                    <Route index element={<SellerHome />} />
                    <Route path="inventory" element={<ManageInventory />} />
                    <Route path="orders" element={<SellerManageOrders />} />
                    <Route path="orders/:orderId" element={<SellerOrderDetailPage />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>

                  <Route path="/studio/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}>
                    <Route index element={<SellerHome />} />
                    <Route path="inventory" element={<ManageInventory />} />
                    <Route path="orders" element={<SellerManageOrders />} />
                    <Route path="orders/:orderId" element={<SellerOrderDetailPage />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>

                  <Route path="/seller/onboarding" element={<SellerOnboarding />} />
                  <Route path="/studio/onboarding" element={<SellerOnboarding />} />

                  <Route path="/shopify/success" element={<ShopifySuccess />} />

                  <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>}>
                    <Route index element={<Navigate to="orders" replace />} />
                    <Route path="orders" element={<AdminManageOrders />} />
                    <Route path="orders/:orderId" element={<OrderDetailPage />} />
                    <Route path="sellers" element={<ManageSellers />} />
                    <Route path="products" element={<ManageProducts />} />
                    <Route path="products/create" element={<CreateProductPage />} />
                    <Route path="invites" element={<ManageInvites />} />
                    <Route path="notifications" element={<ManageNotifications />} />
                  </Route>
                  <Route path="/admin/login" element={<AdminAuth />} />

                  <Route path="/product/:productId" element={<LegacyProductRedirect />} />
                  <Route path="/brand-reel" element={<Navigate to="/catalog" replace />} />
              </Routes>
              </Suspense>
              <CartDrawer />
              <CartStockLimitToast />
              {!isExcludedPath && <Footer />}
              </div>
          </GuestCartProvider>
        </JunoStudioProvider>
      </SellerAuthProvider>
    </AdminAuthProvider>
  );
}

function App() {
  return (
    <Router>
      <RoutedApp />
    </Router>
  );
}

export default App;
