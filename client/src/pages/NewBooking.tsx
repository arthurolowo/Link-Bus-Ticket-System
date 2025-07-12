import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { getToken } from '../lib/authUtils';
import PaymentForm from '../components/PaymentForm';
import { Checkbox } from '../components/ui/checkbox';
import { ScrollArea } from '../components/ui/scroll-area';

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
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
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

  const handleSeatToggle = (seatNumber: number) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber);
      } else {
        if (prev.length >= 5) {
          toast({
            title: "Maximum Seats",
            description: "You can only book up to 5 seats at once",
            variant: "destructive"
          });
          return prev;
        }
        return [...prev, seatNumber].sort((a, b) => a - b);
      }
    });
  };

  const calculateTotalAmount = () => {
    if (!trip) return "0.00";
    const total = selectedSeats.length * parseFloat(trip.price);
    return total.toFixed(2);
  };

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
      if (selectedSeats.length === 0) {
        toast({
          title: "Seats Required",
          description: "Please select at least one seat",
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

      // Create booking
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          tripId: parseInt(tripId!),
          seatNumbers: selectedSeats,
          totalAmount: calculateTotalAmount().toString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      const booking = await response.json();
      console.log('Created booking:', booking);
      setBookingId(booking.id);
      setShowPayment(true);
      
      toast({
        title: "Booking Created",
        description: `Please complete the payment to confirm your booking.`,
      });
    } catch (error) {
      console.error('Booking error:', error);
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

  const handlePaymentCancel = async () => {
    setShowPayment(false);
    
    // Cancel the booking if it exists
    if (bookingId) {
      try {
        const token = getToken();
        if (token) {
          await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
          });
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
      }
    }
    
    setBookingId(null);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Book Your Trip</h1>
      
      {showPayment && bookingId ? (
        <PaymentForm
          bookingId={bookingId}
          amount={calculateTotalAmount().toString()}
          onPaymentComplete={handlePaymentSuccess}
          onPaymentError={handlePaymentCancel}
          passengerDetails={{
            name: user?.name || '',
            phone: user?.phone || '',
            email: user?.email || ''
          }}
          selectedSeats={selectedSeats.map(seat => seat.toString())}
          tripDetails={{
            origin: trip.route.origin,
            destination: trip.route.destination,
            departureDate: trip.departureDate,
            departureTime: trip.departureTime,
            busType: trip.bus.busType.name,
            busNumber: trip.bus.busNumber
          }}
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
                <p>
                  <span className="font-medium">Price per seat: </span>
                  UGX {Number(trip.price).toLocaleString()}
                </p>
                {selectedSeats.length > 0 && (
                  <p className="text-lg font-semibold text-primary">
                    Total Amount: UGX {Number(calculateTotalAmount()).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Select Seats</h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select up to 5 seats. Selected seats: {selectedSeats.join(', ')}
                </p>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  <div className="grid grid-cols-5 gap-4">
                    {Array.from({ length: trip.availableSeats }, (_, i) => i + 1).map((seat) => (
                      <div
                        key={seat}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`seat-${seat}`}
                          checked={selectedSeats.includes(seat)}
                          onCheckedChange={() => handleSeatToggle(seat)}
                        />
                        <label
                          htmlFor={`seat-${seat}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {seat}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Button
                  className="w-full"
                  onClick={handleBooking}
                  disabled={selectedSeats.length === 0}
                >
                  {selectedSeats.length > 0
                    ? `Book ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} - UGX ${Number(calculateTotalAmount()).toLocaleString()}`
                    : 'Select seats to book'}
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