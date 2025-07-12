import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { getToken } from '../lib/authUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Calendar, Clock, MapPin, Bus, CreditCard, CalendarDays } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface BookingResponse {
  booking: {
    id: number;
    bookingReference: string;
    seatNumber: number;
    paymentStatus: string;
    totalAmount: string;
    createdAt: string;
  };
  trip: {
    id: number;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
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
      };
    };
  };
}

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

export default function Bookings() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState(1);

  const { data: bookingsData, isLoading, error: queryError } = useQuery<BookingResponse[]>({
    queryKey: ['bookings'],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/bookings/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch bookings');
      }

      return response.json();
    },
    enabled: !!user
  });

  // Fetch trip details
  const { data: trip, isLoading: tripLoading, error: tripError } = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: async () => {
              const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch trip details');
      }
      return response.json();
    },
    enabled: !!tripId
  });

  useEffect(() => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a trip",
        variant: "destructive"
      });
      navigate('/login');
    }
  }, [user, navigate, toast]);

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="w-full">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-6 text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please login to view your bookings.</p>
            <Button onClick={() => navigate('/login')} size="lg">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-600">
            <span className="text-lg">Error loading bookings: </span>
            <span>{queryError instanceof Error ? queryError.message : 'Unknown error'}</span>
          </div>
        </Card>
      </div>
    );
  }

  const handleBooking = async () => {
    if (!trip) return;
    
    try {
              const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tripId: trip.id,
          numberOfSeats: selectedSeats,
          totalAmount: (parseInt(trip.price) * selectedSeats).toString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const booking = await response.json();
      toast({
        title: "Booking Successful",
        description: `Your booking reference is: ${booking.bookingReference}`,
      });
      navigate('/bookings');
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive"
      });
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const token = getToken();
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to cancel a booking",
          variant: "destructive"
        });
        return;
      }

              const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel booking');
      }

      toast({
        title: "Success",
        description: "Your booking has been cancelled successfully.",
      });

      // Refresh the bookings data using React Query
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    } catch (error) {
      console.error('Cancel booking error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel booking",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
      
      {(!bookingsData || bookingsData.length === 0) ? (
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Bookings Found</h3>
            <p className="text-muted-foreground">You haven't made any bookings yet.</p>
            <Button onClick={() => navigate('/trips')} className="mt-4">
              Browse Available Trips
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookingsData.map((booking) => (
            <Card key={booking.booking.id} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">Booking #{booking.booking.bookingReference}</h3>
                      <Badge variant={getStatusBadgeVariant(booking.booking.paymentStatus)}>
                        {booking.booking.paymentStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Booked on {new Date(booking.booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">UGX {parseInt(booking.booking.totalAmount).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Route</p>
                        <p className="font-medium">{booking.trip.route.origin} → {booking.trip.route.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Departure Date</p>
                        <p className="font-medium">{formatDate(booking.trip.departureDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{booking.trip.departureTime} - {booking.trip.arrivalTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Bus className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bus Details</p>
                        <p className="font-medium">{booking.trip.bus.busType.name} - {booking.trip.bus.busNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Seat Number</p>
                        <p className="font-medium">#{booking.booking.seatNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t bg-muted/10 flex justify-end gap-4 mt-6">
                {booking.booking.paymentStatus !== 'cancelled' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Cancel Booking</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this booking? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCancelBooking(booking.booking.id)}>
                          Yes, Cancel Booking
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 