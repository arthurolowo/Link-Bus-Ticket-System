import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Clock, MapPin, AlertCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { getToken } from '../lib/authUtils';

interface Route {
  id: number;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  isActive: number;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getToken();
        const response = await fetch('http://localhost:5000/api/routes', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch routes');
        }
        const data = await response.json();
        setRoutes(data);
      } catch (error) {
        console.error('Error fetching routes:', error);
        setError('Failed to load routes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  const handleBookRoute = (route: Route) => {
    if (!route.isActive) {
      return;
    }
    // Set date to today at start of day in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create search params object matching the expected interface
    const searchParams = {
      from: route.origin,
      to: route.destination,
      date: today.toISOString().split('T')[0], // Format as YYYY-MM-DD
      passengers: '1',
      routeId: route.id.toString()
    };

    navigate('/search-results', { state: searchParams });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">All Routes</h1>
        <p className="text-gray-600">Browse all our bus routes - both active and inactive</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route) => (
          <Card 
            key={route.id}
            className={cn(
              "border-2",
              route.isActive ? "border-green-200" : "border-gray-200 bg-gray-50"
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{route.origin} → {route.destination}</span>
                </div>
                <Badge 
                  variant={route.isActive ? "success" : "secondary"}
                  className="ml-2"
                >
                  {route.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{Math.round(route.estimatedDuration / 60)} hours</span>
                  </div>
                  <div className="text-gray-500">
                    {route.distance} km
                  </div>
                </div>
                {!route.isActive ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 p-2 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>This route is currently unavailable</span>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleBookRoute(route)}
                  >
                    Book This Route
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 