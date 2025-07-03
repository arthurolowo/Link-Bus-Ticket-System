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

      const response = await fetch('http://localhost:5000/api/bookings/my-bookings', {
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
      const response = await fetch(`http://localhost:5000/api/trips/${tripId}`, {
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

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Login Required</h2>
          <p className="mb-4">Please login to view your bookings.</p>
          <Button onClick={() => navigate('/login')}>
            Login
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading your bookings...</div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-500 text-center">
          Error loading bookings: {queryError instanceof Error ? queryError.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  if (tripId && tripError) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-500 text-center">
          Error loading trip details. Please try again.
        </div>
      </div>
    );
  }

  const handleBooking = async () => {
    if (!trip) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
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

      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage your bus ticket bookings</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {(!bookingsData || bookingsData.length === 0) && (
        <Card className="p-6 text-center">
          <p className="text-gray-500">You don't have any bookings yet.</p>
          <Button className="mt-4" onClick={() => navigate('/trips')}>
            Book a Trip
          </Button>
        </Card>
      )}

      <div className="space-y-4">
        {bookingsData?.map(({ booking, trip }) => (
          <Card key={booking.id} className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
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
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                      booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Booking Reference: </span>
                    {booking.bookingReference}
                  </p>
                  <p>
                    <span className="font-medium">Seat Number: </span>
                    {booking.seatNumber}
                  </p>
                  <p>
                    <span className="font-medium">Bus: </span>
                    {trip.bus.busType.name} ({trip.bus.busNumber})
                  </p>
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Departure: </span>
                    {trip.departureTime}
                  </p>
                  <p>
                    <span className="font-medium">Arrival: </span>
                    {trip.arrivalTime}
                  </p>
                  <p>
                    <span className="font-medium">Amount: </span>
                    UGX {parseInt(booking.totalAmount).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Booked on: </span>
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>

                {booking.paymentStatus === 'pending' && (
                  <div className="mt-4 space-x-2">
                    <Button variant="destructive" onClick={() => handleCancelBooking(booking.id)}>
                      Cancel Booking
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {tripId && trip && (
        <>
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Book Your Trip</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Trip Details</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Route: </span>
                    {trip.route.origin} → {trip.route.destination}
                  </p>
                  <p>
                    <span className="font-medium">Date: </span>
                    {new Date(trip.departureDate).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Departure: </span>
                    {trip.departureTime}
                  </p>
                  <p>
                    <span className="font-medium">Arrival: </span>
                    {trip.arrivalTime}
                  </p>
                  <p>
                    <span className="font-medium">Bus Type: </span>
                    {trip.bus.busType.name}
                  </p>
                  <p>
                    <span className="font-medium">Bus Number: </span>
                    {trip.bus.busNumber}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Booking Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Number of Seats
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedSeats}
                      onChange={(e) => setSelectedSeats(parseInt(e.target.value))}
                    >
                      {[...Array(Math.min(5, trip.availableSeats))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? 'seat' : 'seats'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-lg font-medium">
                      Price per seat: UGX {parseInt(trip.price).toLocaleString()}
                    </p>
                    <p className="text-xl font-bold mt-2">
                      Total: UGX {(parseInt(trip.price) * selectedSeats).toLocaleString()}
                    </p>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    onClick={handleBooking}
                    disabled={trip.availableSeats < 1}
                  >
                    {trip.availableSeats < 1 ? 'No Seats Available' : 'Confirm Booking'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Bus Features</h2>
            <div className="flex flex-wrap gap-2">
              {trip.bus.busType.amenities?.map((amenity, index) => (
                <span
                  key={index}
                  className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
} 