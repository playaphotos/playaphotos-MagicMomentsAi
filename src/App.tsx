import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoutePaths } from './types';
import { PublicLayout, AppLayout, AdminLayout } from './components/Layouts';
import { AgencySidebarLayout } from './layouts/AgencySidebarLayout';
import { CartProvider } from './contexts/CartContext';
import { InstallPwa } from './components/InstallPwa';
import { Loader2 } from 'lucide-react';

// Pages
import Landing from './pages/Landing';
import AgencyLanding from './pages/AgencyLanding';
import Login from './pages/Login';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Success from './pages/Success';
import Dashboard from './pages/admin/Dashboard'; // IMPORT THE REAL DASHBOARD
import EventsManager from './pages/admin/EventsManager';
import EventUploadManager from './pages/admin/EventUploadManager';
import Documentation from './pages/admin/Documentation';
import Settings from './pages/admin/Settings';

// Marketing Pages
import Features from './pages/Features';
import Pricing from './pages/Pricing';

// LAZY LOAD THE GALLERY
// Critical for performance and preventing the "White Screen" crash
const EventGallery = React.lazy(() => import('./pages/EventGallery'));

// Loading Spinner Component
const PageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-slate-50">
    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
  </div>
);

const App: React.FC = () => {
  return (
    <CartProvider>
      {/* PWA Install Listener & UI */}
      <InstallPwa />
      
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path={RoutePaths.HOME} element={<PublicLayout><Landing /></PublicLayout>} />
          <Route path={RoutePaths.AGENCY_LANDING} element={<PublicLayout><AgencyLanding /></PublicLayout>} />
          <Route path={RoutePaths.LOGIN} element={<PublicLayout><Login /></PublicLayout>} />
          <Route path={RoutePaths.TERMS} element={<PublicLayout><Terms /></PublicLayout>} />
          <Route path={RoutePaths.PRIVACY} element={<PublicLayout><Privacy /></PublicLayout>} />
          
          {/* Marketing Pages */}
          <Route path={RoutePaths.PRICING} element={<PublicLayout><Pricing /></PublicLayout>} />
          <Route path={RoutePaths.FEATURES} element={<PublicLayout><Features /></PublicLayout>} />

          {/* ATTENDEE EXPERIENCE ROUTES (Lazy Loaded) */}
          <Route path={RoutePaths.APP_GALLERY} element={
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <EventGallery />
              </Suspense>
            </AppLayout>
          } />
          
          <Route path={RoutePaths.EVENT_SLUG} element={
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <EventGallery />
              </Suspense>
            </AppLayout>
          } />

          <Route path={RoutePaths.CHECKOUT_SUCCESS} element={<PublicLayout><Success /></PublicLayout>} />

          {/* ADMIN ROUTES - Wrapped in AgencySidebarLayout */}
          {/* Now points to the REAL Dashboard component */}
          <Route path={RoutePaths.ADMIN_DASHBOARD} element={<AgencySidebarLayout><Dashboard /></AgencySidebarLayout>} />
          
          <Route path={RoutePaths.ADMIN_EVENTS} element={<AgencySidebarLayout><EventsManager /></AgencySidebarLayout>} />
          <Route path={RoutePaths.ADMIN_EVENT_DETAIL} element={<AgencySidebarLayout><EventUploadManager /></AgencySidebarLayout>} />
          <Route path="/admin/documentation" element={<AgencySidebarLayout><Documentation /></AgencySidebarLayout>} />
          <Route path="/admin/settings" element={<AgencySidebarLayout><Settings /></AgencySidebarLayout>} />
          
          {/* Safety Redirects */}
          <Route path="/selfie" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to={RoutePaths.HOME} replace />} />
        </Routes>
      </HashRouter>
    </CartProvider>
  );
};

export default App;