import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User } from "lucide-react";
import PaymentForm from "./PaymentForm";
import { SearchParams, SeatSelection as SeatSelectionType, TripWithDetails } from "@/types";
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

interface Seat {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'selected' | 'premium';
  price: number;
}

interface SeatSelectionProps {
  trip: TripWithDetails;
  onBack: () => void;
  searchParams: SearchParams;
  seats: Seat[];
  maxSeats: number;
}

export default function SeatSelection({ trip, onBack, searchParams, seats, maxSeats }: SeatSelectionProps) {
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengerDetails, setPassengerDetails] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [showPayment, setShowPayment] = useState(false);

  const seatPrice = parseFloat(trip.price);
  const serviceFee = 2000;
  const totalAmount = (selectedSeats.length * seatPrice) + serviceFee;

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied') return;
    
    setSelectedSeats(prev => {
      if (prev.includes(seat.id)) {
        return prev.filter(id => id !== seat.id);
      }
      if (prev.length >= maxSeats) {
        return prev;
      }
      return [...prev, seat.id];
    });
  };

  const handleProceed = () => {
    if (selectedSeats.length > 0) {
      navigate('/payment', { state: { selectedSeats } });
    }
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length > 0 && passengerDetails.name && passengerDetails.phone) {
      setShowPayment(true);
    }
  };

  const seatSelectionData: SeatSelectionType = {
    tripId: trip.id,
    selectedSeats,
    passengerDetails,
  };

  const getSeatClassName = (seat: Seat) => {
    const baseClass = 'seat';
    if (selectedSeats.includes(seat.id)) return `${baseClass} seat-selected`;
    return `${baseClass} seat-${seat.status}`;
  };

  if (showPayment) {
    return (
      <PaymentForm
        trip={trip}
        seatSelection={seatSelectionData}
        totalAmount={totalAmount}
        onBack={() => setShowPayment(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Select Your Seats</h2>
          <p className="text-muted-foreground">
            {trip.bus.busType.name} • {trip.route.origin} → {trip.route.destination} • {new Date(trip.departureDate).toLocaleDateString()} at {trip.departureTime}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2">Select Your Seats</h3>
          <p className="text-sm">
            You can select up to {maxSeats} seats. Selected: {selectedSeats.length}
          </p>
        </div>

        <div className="flex gap-4 mb-4">
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
          <div className="flex items-center gap-2">
            <div className="seat seat-premium">P</div>
            <span className="text-sm">Premium</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          {seats.map((seat) => (
            <button
              key={seat.id}
              className={getSeatClassName(seat)}
              onClick={() => handleSeatClick(seat)}
              disabled={seat.status === 'occupied'}
            >
              {seat.number}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm">Total Amount:</p>
            <p className="font-bold">
              UGX {formatCurrency(selectedSeats
                .map(id => seats.find(seat => seat.id === id)?.price || 0)
                .reduce((a, b) => a + b, 0))}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleProceed}
            disabled={selectedSeats.length === 0}
          >
            Proceed to Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trip Details */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="font-semibold">{trip.route.origin} → {trip.route.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-semibold">
                    {new Date(trip.departureDate).toLocaleDateString()} • {trip.departureTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Selected Seats</p>
                  <p className="font-semibold">
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                  </p>
                </div>
              </div>

              {/* Passenger Details */}
              <div className="space-y-4">
                <h4 className="font-medium">Passenger Details</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={passengerDetails.name}
                      onChange={(e) => setPassengerDetails(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={passengerDetails.phone}
                      onChange={(e) => setPassengerDetails(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+256..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={passengerDetails.email}
                      onChange={(e) => setPassengerDetails(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span>Tickets ({selectedSeats.length})</span>
                  <span>UGX {formatCurrency(selectedSeats.length * seatPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service Fee</span>
                  <span>UGX {formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">UGX {formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <Button
                onClick={handleProceedToPayment}
                disabled={selectedSeats.length === 0 || !passengerDetails.name || !passengerDetails.phone}
                className="w-full btn-accent"
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
