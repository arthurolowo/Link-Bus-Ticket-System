import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Clock, Users, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

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

type SortOption = 'price-asc' | 'price-desc' | 'departure-asc' | 'departure-desc' | 'seats-desc';

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
  const [sortBy, setSortBy] = useState<SortOption>('departure-asc');

  // Fetch bus types
  const { data: busTypes } = useQuery<BusType[]>({
    queryKey: ['busTypes'],
    queryFn: async () => {
              const response = await fetch(`${API_BASE_URL}/api/buses/types`, {
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
        const params = new URLSearchParams();
        
        // Only add busType if it's not 'all'
        if (searchParams.busType !== 'all') {
          params.append('busType', searchParams.busType);
        }

        // If we have search criteria, use the search endpoint
        if (searchParams.origin && searchParams.destination && searchParams.date) {
          params.append('origin', searchParams.origin);
          params.append('destination', searchParams.destination);
          params.append('date', searchParams.date);
          const response = await fetch(`${API_BASE_URL}/api/trips/search?${params}`, {
            credentials: 'include'
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        }
        
        // Otherwise, use the main endpoint
        const response = await fetch(`${API_BASE_URL}/api/trips${params.toString() ? '?' + params.toString() : ''}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
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

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
  };

  const sortTrips = (tripsToSort: Trip[]) => {
    return [...tripsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return parseInt(a.price) - parseInt(b.price);
        case 'price-desc':
          return parseInt(b.price) - parseInt(a.price);
        case 'departure-asc':
          return new Date(a.departureDate + ' ' + a.departureTime).getTime() -
                 new Date(b.departureDate + ' ' + b.departureTime).getTime();
        case 'departure-desc':
          return new Date(b.departureDate + ' ' + b.departureTime).getTime() -
                 new Date(a.departureDate + ' ' + a.departureTime).getTime();
        case 'seats-desc':
          return b.availableSeats - a.availableSeats;
        default:
          return 0;
      }
    });
  };

  useEffect(() => {
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
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-600">
            <span className="text-lg">Error loading trips: </span>
            <span>{error instanceof Error ? error.message : 'Unknown error'}</span>
          </div>
        </Card>
      </div>
    );
  }

  const LoadingSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );

  const sortedTrips = trips ? sortTrips(trips) : [];

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Available Trips</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
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

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="departure-asc">Departure: Earliest</SelectItem>
              <SelectItem value="departure-desc">Departure: Latest</SelectItem>
              <SelectItem value="seats-desc">Available Seats</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : sortedTrips.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500 space-y-4">
            <p className="text-lg">No trips found for the selected criteria.</p>
            <p className="text-sm">Try adjusting your filters or search for a different date.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedTrips.map((trip, index) => (
            <div
              key={trip.id}
              className="opacity-100 transition-all duration-300 ease-in-out"
            >
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {trip.route.origin} 
                        <ArrowRight className="w-4 h-4" /> 
                        {trip.route.destination}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(trip.departureDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary">{trip.bus.busType.name}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>Departure</span>
                        </div>
                        <p className="font-medium">{trip.departureTime}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>Arrival</span>
                        </div>
                        <p className="font-medium">{trip.arrivalTime}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>Available Seats: </span>
                        <span className="font-medium">{trip.availableSeats}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {trip.bus.busType.amenities?.slice(0, 3).map((amenity, index) => (
                          <Badge key={index} variant="outline">
                            {amenity}
                          </Badge>
                        ))}
                        {trip.bus.busType.amenities?.length > 3 && (
                          <Badge variant="outline">
                            +{trip.bus.busType.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      UGX {parseInt(trip.price).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">per person</p>
                  </div>
                  <Button
                    onClick={() => handleBookTrip(trip.id)}
                    className="ml-4"
                  >
                    Book Now
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 