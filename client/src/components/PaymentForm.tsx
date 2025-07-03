import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "../hooks/use-toast";
import { ArrowLeft, CreditCard, Smartphone, Building2, Lock } from "lucide-react";
import DigitalTicket from "./DigitalTicket";
import { SeatSelection } from "../types";
import type { TripWithDetails } from "../types";

interface PaymentFormProps {
  trip: TripWithDetails;
  seatSelection: SeatSelection;
  totalAmount: number;
  onBack: () => void;
}

export default function PaymentForm({ trip, seatSelection, totalAmount, onBack }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money' | 'bank_transfer'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [mobileDetails, setMobileDetails] = useState({
    provider: 'mtn' as 'mtn' | 'airtel',
    number: "",
  });
  const [showTicket, setShowTicket] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const { toast } = useToast();

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: trip.id,
          seatNumber: seatSelection.selectedSeats[0], // For now, handle single seat
          totalAmount: totalAmount.toString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setBookingId(data.id);
      // Process payment
      processPaymentMutation.mutate(data.id);
    },
    onError: (error: unknown) => {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/bookings/${bookingId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: 'completed',
          paymentMethod,
          ...(paymentMethod === 'card' ? { cardDetails } : {}),
          ...(paymentMethod === 'mobile_money' ? { mobileDetails } : {}),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Your ticket has been confirmed!",
      });
      setShowTicket(true);
    },
    onError: (error: unknown) => {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment processing failed",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate payment details based on method
    if (paymentMethod === 'card') {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
        toast({
          title: "Invalid Card Details",
          description: "Please fill in all card details",
          variant: "destructive",
        });
        return;
      }
    } else if (paymentMethod === 'mobile_money') {
      if (!mobileDetails.number) {
        toast({
          title: "Invalid Mobile Number",
          description: "Please enter your mobile money number",
          variant: "destructive",
        });
        return;
      }
    }

    createBookingMutation.mutate();
  };

  if (showTicket && bookingId) {
    return (
      <DigitalTicket
        bookingId={bookingId}
        onNewBooking={() => {
          setShowTicket(false);
          setBookingId(null);
          onBack();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Seats
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Payment Details</h2>
          <p className="text-muted-foreground">Secure payment processing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Payment Methods */}
                <div>
                  <Label className="text-base font-medium mb-4 block">Select Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label className="relative cursor-pointer">
                        <RadioGroupItem value="card" className="sr-only" />
                        <div className={`border-2 rounded-lg p-4 text-center transition-colors ${
                          paymentMethod === 'card' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}>
                          <CreditCard className={`w-8 h-8 mx-auto mb-2 ${
                            paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <p className={`font-medium ${
                            paymentMethod === 'card' ? 'text-primary' : 'text-foreground'
                          }`}>
                            Credit/Debit Card
                          </p>
                          <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
                        </div>
                      </label>

                      <label className="relative cursor-pointer">
                        <RadioGroupItem value="mobile_money" className="sr-only" />
                        <div className={`border-2 rounded-lg p-4 text-center transition-colors ${
                          paymentMethod === 'mobile_money' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}>
                          <Smartphone className={`w-8 h-8 mx-auto mb-2 ${
                            paymentMethod === 'mobile_money' ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <p className={`font-medium ${
                            paymentMethod === 'mobile_money' ? 'text-primary' : 'text-foreground'
                          }`}>
                            Mobile Money
                          </p>
                          <p className="text-sm text-muted-foreground">MTN, Airtel</p>
                        </div>
                      </label>

                      <label className="relative cursor-pointer">
                        <RadioGroupItem value="bank_transfer" className="sr-only" />
                        <div className={`border-2 rounded-lg p-4 text-center transition-colors ${
                          paymentMethod === 'bank_transfer' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}>
                          <Building2 className={`w-8 h-8 mx-auto mb-2 ${
                            paymentMethod === 'bank_transfer' ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <p className={`font-medium ${
                            paymentMethod === 'bank_transfer' ? 'text-primary' : 'text-foreground'
                          }`}>
                            Bank Transfer
                          </p>
                          <p className="text-sm text-muted-foreground">Direct transfer</p>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Payment Method Forms */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        placeholder="John Doe"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'mobile_money' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="provider">Mobile Money Provider</Label>
                      <Select
                        value={mobileDetails.provider}
                        onValueChange={(value) => setMobileDetails(prev => ({ ...prev, provider: value as 'mtn' | 'airtel' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                          <SelectItem value="airtel">Airtel Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="mobileNumber">Mobile Money Number</Label>
                      <Input
                        id="mobileNumber"
                        placeholder="07XX XXX XXX"
                        value={mobileDetails.number}
                        onChange={(e) => setMobileDetails(prev => ({ ...prev, number: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium mb-2">Bank Account Details</p>
                      <div className="space-y-2 text-sm">
                        <p>Bank: Link Bus Bank</p>
                        <p>Account Name: Link Bus Services Ltd</p>
                        <p>Account Number: 1234567890</p>
                        <p>Branch: Main Branch</p>
                        <p>Reference: TRIP-{trip.id}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-between items-center text-lg font-medium">
                    <span>Total Amount</span>
                    <span>UGX {totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createBookingMutation.isPending || processPaymentMutation.isPending}
                >
                  {createBookingMutation.isPending || processPaymentMutation.isPending
                    ? "Processing..."
                    : `Pay UGX ${totalAmount.toLocaleString()}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Trip Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Route</p>
                <p className="font-medium">{trip.route.origin} → {trip.route.destination}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(trip.departureDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{trip.departureTime}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bus Type</p>
                <p className="font-medium">{trip.bus.busType.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selected Seat</p>
                <p className="font-medium">#{seatSelection.selectedSeats.join(", #")}</p>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-medium">UGX {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

