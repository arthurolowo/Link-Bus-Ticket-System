import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { UGANDAN_CITIES, UgandanCity } from '../types';
import { Clock, MapPin } from 'lucide-react';
import { SearchForm } from "../components/SearchForm";

interface Route {
  id: number;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  isActive: number;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [popularRoutes, setPopularRoutes] = useState<Route[]>([]);
  const [searchParams, setSearchParams] = useState({
    from: '' as UgandanCity,
    to: '' as UgandanCity,
    date: new Date().toISOString().split('T')[0],
    passengers: '1',
  });

  useEffect(() => {
    const fetchPopularRoutes = async () => {
      try {
        console.log('Fetching popular routes...');
        const response = await fetch('/api/routes');
        if (!response.ok) {
          throw new Error(`Failed to fetch routes: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('All routes:', data);
        
        // Get major routes (longer distance routes)
        const majorRoutes = data
          .filter((route: Route) => {
            console.log('Checking route:', route);
            return route.isActive && route.distance > 200;
          })
          .sort((a: Route, b: Route) => b.distance - a.distance)
          .slice(0, 4);
        
        console.log('Popular routes:', majorRoutes);
        setPopularRoutes(majorRoutes);
      } catch (error) {
        console.error('Error fetching popular routes:', error);
      }
    };

    fetchPopularRoutes();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.from || !searchParams.to || !searchParams.date) {
      return;
    }
    navigate('/search-results', { state: searchParams });
  };

  const handleQuickBook = (route: Route) => {
    navigate('/search-results', {
      state: {
        from: route.origin,
        to: route.destination,
        date: searchParams.date,
        passengers: '1'
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
      <section className="relative bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Travel Across Uganda with Comfort
            </h1>
            <p className="text-xl opacity-90">
              Book your bus tickets online for a seamless journey across major cities
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <SearchForm />
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Booking</h3>
              <p className="text-gray-600">Book your tickets in minutes with our easy-to-use platform</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Travel</h3>
              <p className="text-gray-600">Safe and comfortable travel with experienced drivers</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Customer support available round the clock</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Routes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularRoutes.map((route) => (
              <Card key={route.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{route.origin} → {route.destination}</h3>
                    <p className="text-gray-600">Daily Departures</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Starting from</p>
                    <p className="text-lg font-semibold text-blue-600">UGX {Math.round(route.distance / 1000)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Modern Fleet</h3>
                <p className="text-gray-600">Well-maintained buses with modern amenities for your comfort</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Competitive Prices</h3>
                <p className="text-gray-600">Best value for money with transparent pricing</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Fast & Efficient</h3>
                <p className="text-gray-600">Direct routes with minimal stops for faster travel</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Safe Journey</h3>
                <p className="text-gray-600">Professional drivers and regular vehicle maintenance</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
