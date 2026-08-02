import React, { Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import Footer from './components/Footer';
import { GuestCartProvider } from './contexts/GuestCartContext';
import CartDrawer from './components/cart/CartDrawer';
import CartStockLimitToast from './components/cart/CartStockLimitToast';
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
const SellerStatementsPage = React.lazy(() => import('./components/seller/StatementsPage'));
const JunoStudioLanding = React.lazy(() => import('./components/seller/JunoStudioLanding'));
import { SellerAuthProvider } from './contexts/SellerAuthContext';
import { JunoStudioProvider } from './contexts/JunoStudioContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
const PrivacyPolicy = React.lazy(() => import('./components/policies/PrivacyPolicy'));
const ReturnPolicy = React.lazy(() => import('./components/policies/ReturnPolicy'));
const RefundPolicy = React.lazy(() => import('./components/policies/RefundPolicy'));
const ExchangePolicy = React.lazy(() => import('./components/policies/ExchangePolicy'));
const ShippingServicePolicy = React.lazy(() => import('./components/policies/ShippingServicePolicy'));
const TermsConditions = React.lazy(() => import('./components/policies/TermsConditions'));

const AdminAuth = React.lazy(() => import("./components/admin/AdminAuth"));
const AdminDashboard = React.lazy(() => import("./components/admin/AdminDashboard"));
const AdminProtectedRoute = React.lazy(() => import("./components/admin/ProtectedRoute"));
const SellerManageOrders = React.lazy(() => import('./components/seller/ManageOrders'));
const SellerOrderProcessingGuide = React.lazy(() => import('./components/seller/OrderProcessingGuide'));
const ShopifySuccess = React.lazy(() => import('./components/seller/ShopifySuccess'));
const ManageSellers = React.lazy(() => import('./components/admin/ManageSellers'));
const ManageInvites = React.lazy(() => import('./components/admin/ManageInvites'));
const ManageNotifications = React.lazy(() => import('./components/admin/ManageNotifications'));
const AnalyticsFunnelPage = React.lazy(() => import('./components/admin/AnalyticsFunnelPage'));
const ManageProducts = React.lazy(() => import('./components/admin/ManageProducts'));
const CreateProductPage = React.lazy(() => import('./components/admin/CreateProductPage'));
const ProductImportsPage = React.lazy(() => import('./components/admin/ProductImportsPage'));
const OrderDetailPage = React.lazy(() => import('./components/admin/OrderDetailPage'));
const AdminGuidePage = React.lazy(() => import('./components/admin/AdminGuidePage'));
const CatalogProductPage = React.lazy(() => import('./components/catalog/CatalogProductPage'));
const CatalogBrowsePage = React.lazy(() => import('./components/catalog/CatalogBrowsePage'));
const DownloadRedirect = React.lazy(() => import('./components/DownloadRedirect'));
const CheckoutPage = React.lazy(() => import('./components/checkout/CheckoutPage'));
const OrderConfirmationPage = React.lazy(() => import('./components/checkout/OrderConfirmationPage'));
const OrderTrackingPage = React.lazy(() => import('./components/checkout/OrderTrackingPage'));
const InteractiveTrackingPage = React.lazy(() => import('./components/checkout/InteractiveTrackingPage'));
const SharedSizeQuizPage = React.lazy(() => import('./components/checkout/SharedSizeQuizPage'));
const WishlistPage = React.lazy(() => import('./components/catalog/WishlistPage'));

import { getLegacyCatalogProductRedirect, useFunnelPageView } from './hooks/useFunnelAnalytics';
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

const CatalogProductRedirect = () => {
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  const redirectProductId = getLegacyCatalogProductRedirect(productId);
  return redirectProductId ? <Navigate to={`/catalog/${redirectProductId}${location.search}`} replace /> : <CatalogProductPage />;
};

const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return null;
};

function RoutedApp() {
  useFunnelPageView();
  const location = useLocation();
  const clarityIdentityRef = useRef<ReturnType<typeof resolveClarityIdentityFromStorage>>(null);
  
  const isExcludedPath = location.pathname.startsWith('/seller') || 
                         location.pathname.startsWith('/studio') || 
                         location.pathname.startsWith('/admin') || 
                         location.pathname === '/' ||
                         location.pathname.startsWith('/catalog') || 
                         location.pathname.startsWith('/checkout') || 
                         location.pathname.startsWith('/track') || 
                         location.pathname.startsWith('/size-quiz') ||
                         location.pathname.startsWith('/wishlist');
  const isBackOfficePath = location.pathname.startsWith('/seller') ||
                            location.pathname.startsWith('/studio') ||
                            location.pathname.startsWith('/admin');

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
              {!isBackOfficePath && (
                <div className="sticky top-0 z-[70] bg-gradient-to-r from-primary to-secondary px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white sm:text-xs">
                  Free shipping on every order
                </div>
              )}
              <Suspense fallback={<AppShellFallback />}>
              <Routes>
                  <Route path="/" element={<CatalogBrowsePage />} />

                <Route path="/download" element={<DownloadRedirect />} />
                
                <Route path="/catalog" element={<CatalogBrowsePage />} />
                <Route path="/catalog/all" element={<Navigate to="/catalog" replace />} />
                <Route path="/catalog/women" element={<Navigate to="/catalog?genders=women" replace />} />
                <Route path="/catalog/men" element={<Navigate to="/catalog?genders=men" replace />} />
                <Route path="/catalog/:productId" element={<CatalogProductRedirect />} />
                
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/confirmation" element={<OrderConfirmationPage />} />
                <Route path="/checkout/track/:orderId" element={<InteractiveTrackingPage />} />
                <Route path="/track" element={<OrderTrackingPage />} />
                <Route path="/track/:token" element={<InteractiveTrackingPage />} />
                <Route path="/size-quiz/:token" element={<SharedSizeQuizPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/return-policy" element={<ReturnPolicy />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/exchange-policy" element={<ExchangePolicy />} />
                <Route path="/service-policy" element={<ShippingServicePolicy />} />
                <Route path="/terms-and-conditions" element={<TermsConditions />} />

                  {/* Juno Studio (Seller) Routes */}
                  <Route path="/studio" element={<JunoStudioLanding />} />
                  <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
                  
                  <Route path="/seller/auth" element={<SellerAuth />} />
                  <Route path="/studio/auth" element={<SellerAuth />} />

                  <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}>
                    <Route index element={<SellerHome />} />
                    <Route path="inventory" element={<ManageInventory />} />
                    <Route path="orders" element={<SellerManageOrders />} />
                    <Route path="order-processing" element={<SellerOrderProcessingGuide />} />
                    <Route path="orders/:orderId" element={<SellerOrderDetailPage />} />
                    <Route path="statements" element={<SellerStatementsPage />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>

                  <Route path="/studio/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}>
                    <Route index element={<SellerHome />} />
                    <Route path="inventory" element={<ManageInventory />} />
                    <Route path="orders" element={<SellerManageOrders />} />
                    <Route path="order-processing" element={<SellerOrderProcessingGuide />} />
                    <Route path="orders/:orderId" element={<SellerOrderDetailPage />} />
                    <Route path="statements" element={<SellerStatementsPage />} />
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
                    <Route path="products/imports" element={<ProductImportsPage />} />
                    <Route path="invites" element={<ManageInvites />} />
                    <Route path="notifications" element={<ManageNotifications />} />
                    <Route path="analytics" element={<AnalyticsFunnelPage />} />
                    <Route path="guides/order-processing" element={<AdminGuidePage guide="processing" />} />
                    <Route path="guides/customer-support" element={<AdminGuidePage guide="support" />} />
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
