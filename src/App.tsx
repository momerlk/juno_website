import React, { Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import Footer from './components/Footer';
import { GuestCartProvider } from './contexts/GuestCartContext';
import CartDrawer from './components/cart/CartDrawer';
import CartStockLimitToast from './components/cart/CartStockLimitToast';
import { lazyWithRetry } from './utils/lazyWithRetry';
import AppErrorBoundary from './components/shared/AppErrorBoundary';
const SellerAuth = lazyWithRetry(() => import('./components/seller/SellerAuth'));
const SellerDashboard = lazyWithRetry(() => import('./components/seller/SellerDashboard'));
const SellerOnboarding = lazyWithRetry(() => import('./components/seller/SellerOnboarding'));
const ProtectedRoute = lazyWithRetry(() => import('./components/seller/ProtectedRoute'));
const SellerHome = lazyWithRetry(() => import('./components/seller/SellerHome'));
const ManageInventory = lazyWithRetry(() => import('./components/seller/ManageInventory'));
const AdminManageOrders = lazyWithRetry(() => import('./components/admin/ManageOrders'));
const Analytics = lazyWithRetry(() => import('./components/seller/Analytics'));
const Profile = lazyWithRetry(() => import('./components/seller/Profile'));
const SellerOrderDetailPage = lazyWithRetry(() => import('./components/seller/OrderDetailPage'));
const SellerStatementsPage = lazyWithRetry(() => import('./components/seller/StatementsPage'));
const JunoStudioLanding = lazyWithRetry(() => import('./components/seller/JunoStudioLanding'));
import { SellerAuthProvider } from './contexts/SellerAuthContext';
import { JunoStudioProvider } from './contexts/JunoStudioContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
const PrivacyPolicy = lazyWithRetry(() => import('./components/policies/PrivacyPolicy'));
const ReturnPolicy = lazyWithRetry(() => import('./components/policies/ReturnPolicy'));
const RefundPolicy = lazyWithRetry(() => import('./components/policies/RefundPolicy'));
const ExchangePolicy = lazyWithRetry(() => import('./components/policies/ExchangePolicy'));
const ShippingServicePolicy = lazyWithRetry(() => import('./components/policies/ShippingServicePolicy'));
const TermsConditions = lazyWithRetry(() => import('./components/policies/TermsConditions'));

const AdminAuth = lazyWithRetry(() => import("./components/admin/AdminAuth"));
const AdminDashboard = lazyWithRetry(() => import("./components/admin/AdminDashboard"));
const AdminProtectedRoute = lazyWithRetry(() => import("./components/admin/ProtectedRoute"));
const SellerManageOrders = lazyWithRetry(() => import('./components/seller/ManageOrders'));
const SellerOrderProcessingGuide = lazyWithRetry(() => import('./components/seller/OrderProcessingGuide'));
const ShopifySuccess = lazyWithRetry(() => import('./components/seller/ShopifySuccess'));
const ManageSellers = lazyWithRetry(() => import('./components/admin/ManageSellers'));
const ManageInvites = lazyWithRetry(() => import('./components/admin/ManageInvites'));
const ManageNotifications = lazyWithRetry(() => import('./components/admin/ManageNotifications'));
const AnalyticsFunnelPage = lazyWithRetry(() => import('./components/admin/AnalyticsFunnelPage'));
const ManageProducts = lazyWithRetry(() => import('./components/admin/ManageProducts'));
const CreateProductPage = lazyWithRetry(() => import('./components/admin/CreateProductPage'));
const ProductImportsPage = lazyWithRetry(() => import('./components/admin/ProductImportsPage'));
const OrderDetailPage = lazyWithRetry(() => import('./components/admin/OrderDetailPage'));
const AdminGuidePage = lazyWithRetry(() => import('./components/admin/AdminGuidePage'));
const CatalogProductPage = lazyWithRetry(() => import('./components/catalog/CatalogProductPage'));
const CatalogBrowsePage = lazyWithRetry(() => import('./components/catalog/CatalogBrowsePage'));
const DownloadRedirect = lazyWithRetry(() => import('./components/DownloadRedirect'));
const CheckoutPage = lazyWithRetry(() => import('./components/checkout/CheckoutPage'));
const OrderConfirmationPage = lazyWithRetry(() => import('./components/checkout/OrderConfirmationPage'));
const OrderTrackingPage = lazyWithRetry(() => import('./components/checkout/OrderTrackingPage'));
const InteractiveTrackingPage = lazyWithRetry(() => import('./components/checkout/InteractiveTrackingPage'));
const SharedSizeQuizPage = lazyWithRetry(() => import('./components/checkout/SharedSizeQuizPage'));
const WishlistPage = lazyWithRetry(() => import('./components/catalog/WishlistPage'));

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

const getPageTitle = (pathname: string) => {
  if (pathname === '/') return 'Juno - Home of Indie Brands';
  if (pathname === '/catalog') return 'Shop | Juno';
  if (pathname.startsWith('/catalog/')) return 'Product | Juno';
  if (pathname === '/wishlist') return 'Wishlist | Juno';
  if (pathname === '/checkout') return 'Checkout | Juno';
  if (pathname === '/checkout/confirmation') return 'Order confirmed | Juno';
  if (pathname.startsWith('/checkout/track/') || pathname.startsWith('/track')) return 'Track your order | Juno';
  if (pathname.startsWith('/size-quiz/')) return 'Size quiz | Juno';
  if (pathname === '/privacy-policy') return 'Privacy policy | Juno';
  if (pathname === '/return-policy') return 'Return policy | Juno';
  if (pathname === '/refund-policy') return 'Refund policy | Juno';
  if (pathname === '/exchange-policy') return 'Exchange policy | Juno';
  if (pathname === '/service-policy') return 'Shipping policy | Juno';
  if (pathname === '/terms-and-conditions') return 'Terms and conditions | Juno';
  if (pathname === '/download') return 'Download Juno | Juno';
  if (pathname === '/shopify/success') return 'Shopify connected | Juno Studio';
  if (pathname === '/studio') return 'Juno Studio | Juno';
  if (pathname.endsWith('/auth')) return 'Seller sign in | Juno';
  if (pathname.endsWith('/onboarding')) return 'Apply to sell | Juno';
  if (pathname.includes('/dashboard/inventory')) return 'Inventory | Juno Studio';
  if (pathname.includes('/dashboard/orders/')) return 'Order details | Juno Studio';
  if (pathname.includes('/dashboard/orders')) return 'Orders | Juno Studio';
  if (pathname.includes('/dashboard/order-processing')) return 'Order processing | Juno Studio';
  if (pathname.includes('/dashboard/statements')) return 'Statements | Juno Studio';
  if (pathname.includes('/dashboard/analytics')) return 'Analytics | Juno Studio';
  if (pathname.includes('/dashboard/profile')) return 'Profile | Juno Studio';
  if (pathname.includes('/dashboard')) return 'Dashboard | Juno Studio';
  if (pathname === '/admin/login') return 'Admin sign in | Juno';
  if (pathname.startsWith('/admin/orders/')) return 'Order details | Juno Admin';
  if (pathname === '/admin/orders') return 'Orders | Juno Admin';
  if (pathname === '/admin/sellers') return 'Sellers | Juno Admin';
  if (pathname === '/admin/products/create') return 'Create product | Juno Admin';
  if (pathname === '/admin/products/imports') return 'Product imports | Juno Admin';
  if (pathname === '/admin/products') return 'Products | Juno Admin';
  if (pathname === '/admin/invites') return 'Invites | Juno Admin';
  if (pathname === '/admin/notifications') return 'Notifications | Juno Admin';
  if (pathname === '/admin/analytics') return 'Analytics | Juno Admin';
  if (pathname.startsWith('/admin/guides/')) return 'Guide | Juno Admin';
  if (pathname.startsWith('/admin')) return 'Juno Admin';
  return 'Juno - Home of Indie Brands';
};

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
    document.title = getPageTitle(location.pathname);
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.hasAttribute('data-default')) {
      titleElement.removeAttribute('data-default');
    }
  }, [location.pathname]);

  useEffect(() => {
    // Identity is local storage, cheap, and the route effect below needs it now.
    clarityIdentityRef.current = resolveClarityIdentityFromStorage();

    // Clarity pulls its recorder script and starts observing the DOM. On a mid
    // range phone that lands right on top of the first product image, so it
    // waits for idle after load. Tags queued before this point still apply:
    // every clarity helper no-ops until init and the route effect re-runs.
    let idleHandle = 0;
    const start = () => {
      const schedule = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1));
      idleHandle = schedule(() => {
        initClarity();
        consentClarityV2({ ad_Storage: 'denied', analytics_Storage: 'granted' });
      }, { timeout: 5000 });
    };

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      window.removeEventListener('load', start);
      if (idleHandle) (window.cancelIdleCallback ?? window.clearTimeout)(idleHandle);
    };
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
              <AppErrorBoundary>
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
              </AppErrorBoundary>
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
