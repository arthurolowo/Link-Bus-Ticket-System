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
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/not-found';

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {!user ? (
        <Route path="/" element={<Landing />} />
      ) : (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/support" element={<Support />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </>
      )}
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
