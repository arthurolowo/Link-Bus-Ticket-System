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
    <div className="container mx-auto py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Book your next journey with Link Bus</p>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search for Buses</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Select
                  value={searchParams.from}
                  onValueChange={(value: UgandanCity) => setSearchParams((prev) => ({ ...prev, from: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select departure city" />
                  </SelectTrigger>
                  <SelectContent>
                    {UGANDAN_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Select
                  value={searchParams.to}
                  onValueChange={(value: UgandanCity) => setSearchParams((prev) => ({ ...prev, to: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {UGANDAN_CITIES.filter((city) => city !== searchParams.from).map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Travel Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={searchParams.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSearchParams((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passengers">Passengers</Label>
                <Select
                  value={searchParams.passengers}
                  onValueChange={(value) => setSearchParams((prev) => ({ ...prev, passengers: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select passengers" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'passenger' : 'passengers'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit"
              className="mt-6 w-full"
              disabled={!searchParams.from || !searchParams.to || !searchParams.date}
            >
              Search Buses
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Popular Routes Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Popular Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularRoutes.map((route) => (
              <Card key={route.id} className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{route.origin} → {route.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(route.estimatedDuration / 60)} hours</span>
                        <span className="mx-2">•</span>
                        <span>{route.distance} km</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickBook(route)}
                    >
                      Quick Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">View and manage your upcoming trips</p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/bookings')}>
              View Bookings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Check availability on all our routes</p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/routes')}>
              View Routes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Contact our support team for assistance</p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/support')}>
              Get Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
