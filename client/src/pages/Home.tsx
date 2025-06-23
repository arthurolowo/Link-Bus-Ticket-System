import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { UGANDAN_CITIES, UgandanCity } from '../types';

export default function Home() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useState({
    origin: '' as UgandanCity,
    destination: '' as UgandanCity,
    date: new Date().toISOString().split('T')[0],
    passengers: 1,
  });

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search params:', searchParams);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="origin">From</Label>
              <Select
                value={searchParams.origin}
                onValueChange={(value: UgandanCity) => setSearchParams((prev) => ({ ...prev, origin: value }))}
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
              <Label htmlFor="destination">To</Label>
              <Select
                value={searchParams.destination}
                onValueChange={(value: UgandanCity) => setSearchParams((prev) => ({ ...prev, destination: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {UGANDAN_CITIES.filter((city) => city !== searchParams.origin).map((city) => (
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
              <Input
                id="passengers"
                type="number"
                min={1}
                max={10}
                value={searchParams.passengers}
                onChange={(e) =>
                  setSearchParams((prev) => ({ ...prev, passengers: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
          </div>

          <Button onClick={handleSearch} className="mt-6 w-full">
            Search Buses
          </Button>
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
            <Button variant="outline" className="w-full">
              View Bookings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Check availability on frequently traveled routes</p>
            <Button variant="outline" className="w-full">
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
            <Button variant="outline" className="w-full">
              Get Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
