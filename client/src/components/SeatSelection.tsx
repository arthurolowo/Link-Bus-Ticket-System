import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft } from "lucide-react";
import PaymentForm from "./PaymentForm";
import { getToken } from "../lib/authUtils";
import { formatCurrency } from '../lib/utils';
import { useToast } from "../hooks/use-toast";

interface Seat {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'selected' | 'premium';
  price: number;
}

interface Trip {
  id: number;
  routeId: number;
  busId: number;
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
    isActive: number;
  };
  bus: {
    busNumber: string;
    busType: {
      name: string;
      description: string;
      amenities: string[];
    };
  };
}

export default function SeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const tripData = location.state as Trip;

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passengerDetails, setPassengerDetails] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [showPayment, setShowPayment] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSeats = useCallback(async () => {
    try {
      setRefreshing(true);
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/trips/${tripData.id}/seats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch seats');
      }

      const data = await response.json();
      setSeats(data);

      // If any of our selected seats are no longer available, deselect them
      setSelectedSeats(prev => prev.filter(seatId => {
        const seat = data.find((s: Seat) => s.id === seatId);
        return seat && seat.status === 'available';
      }));
    } catch (error) {
      console.error('Error fetching seats:', error);
      if (!seats.length) { // Only show error if we don't have any seats data
        setError('Failed to load seats. Please try again.');
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [tripData.id, seats.length]);

  useEffect(() => {
    if (!tripData) {
      navigate('/');
      return;
    }

    fetchSeats();

    // Refresh seats every 30 seconds
    const refreshInterval = setInterval(fetchSeats, 30000);

    return () => clearInterval(refreshInterval);
  }, [tripData, navigate, fetchSeats]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied') return;
    
    setSelectedSeats(prev => {
      if (prev.includes(seat.id)) {
        return prev.filter(id => id !== seat.id);
      }
      if (prev.length >= parseInt(tripData.availableSeats.toString())) {
        return prev;
      }
      return [...prev, seat.id];
    });
  };

  const handleProceedToPayment = async () => {
    if (selectedSeats.length > 0 && passengerDetails.name && passengerDetails.phone) {
      try {
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

        // Create booking first
        const response = await fetch('http://localhost:5000/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({
            tripId: tripData.id,
            seatNumber: parseInt(selectedSeats[0]), // For now just use first seat
            totalAmount: (selectedSeats.length * parseFloat(tripData.price) + 2000).toString()
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          if (error.message === 'Seat already booked') {
            // Refresh seats to show updated availability
            await fetchSeats();
            toast({
              title: "Seat No Longer Available",
              description: "The selected seat was just booked by someone else. Please select another seat.",
              variant: "destructive"
            });
            return;
          }
          throw new Error(error.message || 'Failed to create booking');
        }

        const booking = await response.json();
        console.log('Created booking:', booking);
        setBookingId(booking.id);
        setShowPayment(true);
        
        toast({
          title: "Booking Created",
          description: "Please complete the payment to confirm your booking.",
        });
      } catch (error) {
        console.error('Booking error:', error);
        toast({
          title: "Booking Failed",
          description: error instanceof Error ? error.message : "Failed to create booking",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg">Loading seats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>
      </div>
    );
  }

  if (showPayment && bookingId) {
    return (
      <PaymentForm
        bookingId={bookingId}
        amount={(selectedSeats.length * parseFloat(tripData.price) + 2000).toString()}
        onPaymentComplete={() => navigate('/bookings')}
        onPaymentError={() => {
          setShowPayment(false);
          setBookingId(null);
        }}
        passengerDetails={passengerDetails}
        selectedSeats={selectedSeats}
        tripDetails={{
          origin: tripData.route.origin,
          destination: tripData.route.destination,
          departureDate: tripData.departureDate,
          departureTime: tripData.departureTime,
          busType: tripData.bus?.busType?.name,
          busNumber: tripData.bus?.busNumber
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Select Your Seats</h2>
          <p className="text-muted-foreground">
            {tripData.bus.busType.name} • {tripData.route.origin} → {tripData.route.destination}
            <br />
            {new Date(tripData.departureDate).toLocaleDateString()} at {tripData.departureTime}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Seats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="seat seat-available">A</div>
                    <span className="text-sm">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="seat seat-selected">S</div>
                    <span className="text-sm">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="seat seat-occupied">O</div>
                    <span className="text-sm">Occupied</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {seats.map((seat) => (
                    <button
                      key={seat.id}
                      className={`seat ${selectedSeats.includes(seat.id) ? 'seat-selected' : `seat-${seat.status}`}`}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'occupied'}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Passenger Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={passengerDetails.name}
                      onChange={(e) => setPassengerDetails(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={passengerDetails.phone}
                      onChange={(e) => setPassengerDetails(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={passengerDetails.email}
                      onChange={(e) => setPassengerDetails(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Selected Seats</p>
                  <p className="font-semibold">
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price per Seat</p>
                  <p className="font-semibold">UGX {formatCurrency(parseFloat(tripData.price))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Fee</p>
                  <p className="font-semibold">UGX 2,000</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold">
                    UGX {formatCurrency(selectedSeats.length * parseFloat(tripData.price) + 2000)}
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleProceedToPayment}
                disabled={selectedSeats.length === 0 || !passengerDetails.name || !passengerDetails.phone}
              >
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

