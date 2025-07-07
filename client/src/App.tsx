import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { Header } from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RoutesPage from './pages/RoutesPage';
import TripsPage from './pages/TripsPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Support from './pages/Support';
import NotFound from './pages/not-found';
import NewBooking from './pages/NewBooking';
import Bookings from './pages/Bookings';
import SearchResults from './pages/SearchResults';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Component to handle auth-aware redirects
function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = window.location;

  // If user is already logged in and tries to access login/register pages
  if (user && ['/login', '/register', '/admin/login'].includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Routes>
                {/* Authentication Routes - Public Access */}
                <Route path="/login" element={
                  <AuthRedirect>
                    <Login />
                  </AuthRedirect>
                } />
                <Route path="/register" element={
                  <AuthRedirect>
                    <Register />
                  </AuthRedirect>
                } />
                <Route path="/admin/login" element={
                  <AuthRedirect>
                    <AdminLogin />
                  </AuthRedirect>
                } />

                {/* Protected Routes - Require Authentication */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/routes" element={
                  <ProtectedRoute>
                    <RoutesPage />
                  </ProtectedRoute>
                } />
                <Route path="/trips" element={
                  <ProtectedRoute>
                    <TripsPage />
                  </ProtectedRoute>
                } />
                <Route path="/search-results" element={
                  <ProtectedRoute>
                    <SearchResults />
                  </ProtectedRoute>
                } />
                <Route path="/bookings" element={
                  <ProtectedRoute>
                    <Bookings />
                  </ProtectedRoute>
                } />
                <Route path="/bookings/new" element={
                  <ProtectedRoute>
                    <NewBooking />
                  </ProtectedRoute>
                } />
                <Route path="/support" element={
                  <ProtectedRoute>
                    <Support />
                  </ProtectedRoute>
                } />

                {/* Admin Routes - Require Admin Access */}
                <Route path="/admin/*" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* 404 Route - Protected */}
                <Route path="*" element={
                  <ProtectedRoute>
                    <NotFound />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
            <Toaster />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
