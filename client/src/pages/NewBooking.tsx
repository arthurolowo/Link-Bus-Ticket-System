import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { getToken } from '../lib/authUtils';
import PaymentForm from '../components/PaymentForm';

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

export default function NewBooking() {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  // Fetch trip details
  const { data: trip, isLoading, error } = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/trips/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch trip details');
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading trip details...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-500 text-center">
          Error loading trip details. Please try again.
        </div>
      </div>
    );
  }

  const handleBooking = async () => {
    try {
      if (!selectedSeat) {
        toast({
          title: "Seat Required",
          description: "Please select a seat number",
          variant: "destructive"
        });
        return;
      }

      const token = getToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login again",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Format totalAmount to match the required format (e.g., "1000.00")
      const formattedAmount = Number(trip.price).toFixed(2);

      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          tripId: trip.id,
          seatNumber: selectedSeat,
          totalAmount: formattedAmount
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      const booking = await response.json();
      setBookingId(booking.id);
      setShowPayment(true);
      
      toast({
        title: "Booking Created",
        description: `Please complete the payment to confirm your booking.`,
      });
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive"
      });
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Booking Confirmed",
      description: "Your payment was successful and your booking is confirmed.",
    });
    navigate('/bookings');
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setBookingId(null);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Book Your Trip</h1>
      
      {showPayment && bookingId ? (
        <PaymentForm
          bookingId={bookingId}
          amount={Number(trip.price).toFixed(2)}
          onPaymentComplete={handlePaymentSuccess}
          onPaymentError={handlePaymentCancel}
        />
      ) : (
        <Card className="p-6 mb-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold mb-4">Trip Details</h2>
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
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Seat Number
                  </label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedSeat || ''}
                    onChange={(e) => setSelectedSeat(parseInt(e.target.value))}
                  >
                    <option value="">Choose a seat</option>
                    {Array.from({ length: trip.availableSeats }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Seat {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-lg font-medium">
                    Price: UGX {parseInt(trip.price).toLocaleString()}
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleBooking}
                  disabled={!selectedSeat}
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
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
    </div>
  );
} 