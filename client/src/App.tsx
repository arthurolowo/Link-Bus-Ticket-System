import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import ErrorBoundary from './components/ErrorBoundary';
import { Header } from './components/Header';

// Pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Support from './pages/Support';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/not-found';
import SearchResults from './pages/SearchResults';
import RoutesPage from './pages/RoutesPage';
import Bookings from './pages/Bookings';

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!user ? <Landing /> : <Home />} />
      <Route path="/search-results" element={<SearchResults />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="/admin" element={<AdminLogin />} />

      {/* Protected Routes */}
      {user && (
        <>
          <Route path="/home" element={<Home />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/support" element={<Support />} />
          {user.isAdmin && (
            <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
          )}
        </>
      )}

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Router />
                </main>
              </div>
              <Toaster />
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
