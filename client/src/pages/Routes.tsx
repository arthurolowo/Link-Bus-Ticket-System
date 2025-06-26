import { Routes as RouterRoutes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

// Pages
import Landing from './Landing';
import Home from './Home';
import Support from './Support';
import AdminDashboard from './AdminDashboard';
import NotFound from './not-found';
import SearchResults from './SearchResults';
import RoutesPage from './RoutesPage.tsx';

export default function Routes() {
  const { user } = useAuth();

  return (
    <RouterRoutes>
      {/* Public Routes */}
      <Route path="/" element={!user ? <Landing /> : <Home />} />
      <Route path="/search-results" element={<SearchResults />} />
      <Route path="/routes" element={<RoutesPage />} />

      {/* Protected Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <Support />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
}