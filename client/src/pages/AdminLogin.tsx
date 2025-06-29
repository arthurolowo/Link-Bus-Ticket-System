import { AdminLoginForm } from '../components/admin/AdminLoginForm';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function AdminLogin() {
  const { user } = useAuth();

  // If already logged in as admin, redirect to admin dashboard
  if (user?.isAdmin) {
    return <Navigate to="/admin/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Link Bus Admin</h1>
          <p className="text-muted-foreground mt-2">
            Administrator access only
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
} 