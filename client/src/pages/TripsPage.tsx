import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface Trip {
  id: number;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  availableSeats: number;
  route: {
    origin: string;
    destination: string;
    distance: number;
    estimatedDuration: number;
  };
  bus: {
    busNumber: string;
    busType: {
      name: string;
      amenities: string[];
      totalSeats: number;
    };
  };
}

interface BusType {
  id: number;
  name: string;
  description: string;
  amenities: string[];
  totalSeats: number;
}

export default function TripsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    date: '',
    busType: 'all'
  });

  // Fetch bus types
  const { data: busTypes } = useQuery<BusType[]>({
    queryKey: ['busTypes'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/buses/types', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    }
  });

  const { data: trips, isLoading, error } = useQuery<Trip[]>({
    queryKey: ['trips', searchParams],
    queryFn: async () => {
      try {
        if (searchParams.origin && searchParams.destination && searchParams.date) {
          const params = new URLSearchParams({
            ...searchParams,
            busType: searchParams.busType === 'all' ? '' : searchParams.busType
          });
          const response = await fetch(`http://localhost:5000/api/trips/search?${params}`, {
            credentials: 'include'
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log('Search response:', data);
          return data;
        }
        
        const response = await fetch('http://localhost:5000/api/trips', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('All trips response:', data);
        return data;
      } catch (error) {
        console.error('Error fetching trips:', error);
        throw error;
      }
    }
  });

  const handleBusTypeChange = (value: string) => {
    setSearchParams(prev => ({
      ...prev,
      busType: value
    }));
  };

  const handleBookTrip = (tripId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a trip",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    navigate(`/bookings/new?tripId=${tripId}`);
  };

  useEffect(() => {
    // Get search params from URL
    const urlParams = new URLSearchParams(window.location.search);
    setSearchParams({
      origin: urlParams.get('origin') || '',
      destination: urlParams.get('destination') || '',
      date: urlParams.get('date') || '',
      busType: urlParams.get('busType') || 'all'
    });
  }, []);

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-500">
          Error loading trips: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Available Trips</h1>
      
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Select value={searchParams.busType} onValueChange={handleBusTypeChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select bus type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All bus types</SelectItem>
              {busTypes?.map((type) => (
                <SelectItem key={type.id} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {trips?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No trips found for the selected criteria.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trips?.map((trip) => (
          <Card key={trip.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {trip.route.origin} → {trip.route.destination}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(trip.departureDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">UGX {parseInt(trip.price).toLocaleString()}</p>
                <p className="text-sm text-gray-500">{trip.bus.busType.name}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Departure</span>
                <span className="font-medium">{trip.departureTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Arrival</span>
                <span className="font-medium">{trip.arrivalTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Available Seats</span>
                <span className="font-medium">{trip.availableSeats}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Bus Features:</p>
              <div className="flex flex-wrap gap-2">
                {trip.bus.busType.amenities?.slice(0, 3).map((amenity, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >
                    {amenity}
                  </span>
                ))}
                {trip.bus.busType.amenities?.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{trip.bus.busType.amenities.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => handleBookTrip(trip.id)}
            >
              Book Now
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
} 