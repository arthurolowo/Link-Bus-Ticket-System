import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User } from "lucide-react";
import PaymentForm from "./PaymentForm";
import { SearchParams, SeatSelection as SeatSelectionType } from "@/types";
import type { TripWithDetails } from "@shared/schema";

interface SeatSelectionProps {
  trip: TripWithDetails;
  onBack: () => void;
  searchParams: SearchParams;
}

export default function SeatSelection({ trip, onBack, searchParams }: SeatSelectionProps) {
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

  // Generate seat layout based on bus type
  const generateSeatLayout = () => {
    const totalSeats = trip.bus.busType.totalSeats || 40;
    const seatsPerRow = 4;
    const rows = Math.ceil(totalSeats / seatsPerRow);
    const layout = [];

    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      for (let seat = 1; seat <= seatsPerRow; seat++) {
        const seatNumber = `${row}${String.fromCharCode(64 + seat)}`; // 1A, 1B, etc.
        const isOccupied = Math.random() < 0.3; // 30% chance of being occupied
        rowSeats.push({ seatNumber, isOccupied });
      }
      layout.push(rowSeats);
    }
    return layout;
  };

  const seatLayout = generateSeatLayout();

  const handleSeatClick = (seatNumber: string) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(prev => prev.filter(seat => seat !== seatNumber));
    } else if (selectedSeats.length < searchParams.passengers) {
      setSelectedSeats(prev => [...prev, seatNumber]);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seat Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Bus Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-xl p-6">
                {/* Driver Section */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-8 bg-gray-800 rounded-t-3xl text-white">
                    <User className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Driver</p>
                </div>

                {/* Seat Grid */}
                <div className="space-y-3">
                  {seatLayout.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center items-center space-x-4">
                      <div className="flex space-x-2">
                        {row.slice(0, 2).map((seat) => (
                          <button
                            key={seat.seatNumber}
                            disabled={seat.isOccupied}
                            onClick={() => handleSeatClick(seat.seatNumber)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              seat.isOccupied
                                ? 'seat-occupied'
                                : selectedSeats.includes(seat.seatNumber)
                                ? 'seat-selected'
                                : 'seat-available'
                            }`}
                          >
                            {seat.seatNumber}
                          </button>
                        ))}
                      </div>
                      <div className="w-8"></div>
                      <div className="flex space-x-2">
                        {row.slice(2, 4).map((seat) => (
                          <button
                            key={seat.seatNumber}
                            disabled={seat.isOccupied}
                            onClick={() => handleSeatClick(seat.seatNumber)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              seat.isOccupied
                                ? 'seat-occupied'
                                : selectedSeats.includes(seat.seatNumber)
                                ? 'seat-selected'
                                : 'seat-available'
                            }`}
                          >
                            {seat.seatNumber}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 seat-available"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 seat-selected"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 seat-occupied"></div>
                    <span>Occupied</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <span>UGX {(selectedSeats.length * seatPrice).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service Fee</span>
                  <span>UGX {serviceFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">UGX {totalAmount.toLocaleString()}</span>
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
