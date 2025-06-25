import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "../hooks/use-toast";
import { ArrowLeft, CreditCard, Smartphone, Building2, Lock, Shield } from "lucide-react";
import DigitalTicket from "./DigitalTicket";
import { SeatSelection, PaymentData } from "../types";
import { apiRequest } from "../lib/queryClient";
import type { TripWithDetails, Booking } from "../types";
import { formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  trip: TripWithDetails;
  seatSelection: SeatSelection;
  totalAmount: number;
  onBack: () => void;
}

export default function PaymentForm({ trip, seatSelection, totalAmount, onBack }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentData['method']>('card');
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
  const [booking, setBooking] = useState<Booking | null>(null);
  const [showTicket, setShowTicket] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const bookingData = {
        tripId: seatSelection.tripId,
        passengerName: seatSelection.passengerDetails.name,
        passengerPhone: seatSelection.passengerDetails.phone,
        passengerEmail: seatSelection.passengerDetails.email || undefined,
        seatNumbers: seatSelection.selectedSeats,
        totalAmount: totalAmount.toString(),
        paymentMethod,
      };

      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (newBooking) => {
      setBooking(newBooking);
      // Process payment
      processPayment(newBooking.id);
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
      const response = await apiRequest("POST", "/api/payments/process", {
        bookingId,
        paymentMethod,
      });
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Payment Successful",
          description: "Your ticket has been confirmed!",
        });
        setShowTicket(true);
        queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      } else {
        toast({
          title: "Payment Failed",
          description: result.message || "Payment processing failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: unknown) => {
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Payment processing error",
        variant: "destructive",
      });
    },
  });

  const processPayment = (bookingId: number) => {
    processPaymentMutation.mutate(bookingId);
  };

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

  if (showTicket && booking) {
    return (
      <DigitalTicket
        booking={booking}
        trip={trip}
        onNewBooking={() => {
          setShowTicket(false);
          setBooking(null);
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
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentData['method'])}>
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
                      <div className="relative">
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                          className="pl-10"
                        />
                        <CreditCard className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      </div>
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
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input
                        id="cardName"
                        placeholder="Full name as on card"
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
                      <Select value={mobileDetails.provider} onValueChange={(value) => 
                        setMobileDetails(prev => ({ ...prev, provider: value as 'mtn' | 'airtel' }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                          <SelectItem value="airtel">Airtel Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input
                        id="mobileNumber"
                        placeholder="+256 7XX XXX XXX"
                        value={mobileDetails.number}
                        onChange={(e) => setMobileDetails(prev => ({ ...prev, number: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Bank Transfer Instructions</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Transfer the total amount to the following account and use your booking reference as the description:
                    </p>
                    <div className="space-y-1 text-sm">
                      <p><strong>Bank:</strong> Stanbic Bank Uganda</p>
                      <p><strong>Account Name:</strong> Link Bus Company Ltd</p>
                      <p><strong>Account Number:</strong> 9030012345678</p>
                      <p><strong>Swift Code:</strong> SBICUGKX</p>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Secure Payment</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Your payment information is encrypted and secure. We do not store your payment details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={createBookingMutation.isPending || processPaymentMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                >
                  {createBookingMutation.isPending || processPaymentMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Pay Securely - UGX {formatCurrency(totalAmount)}
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trip Details */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">{trip.bus.busType.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {trip.route.origin} → {trip.route.destination}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(trip.departureDate).toLocaleDateString()} • {trip.departureTime}
                </p>
              </div>

              {/* Passenger & Seats */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Passenger:</span>
                  <span className="font-medium">{seatSelection.passengerDetails.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Seats:</span>
                  <span className="font-medium">{seatSelection.selectedSeats.join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phone:</span>
                  <span className="font-medium">{seatSelection.passengerDetails.phone}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span>Ticket Price ({seatSelection.selectedSeats.length} seats)</span>
                  <span>UGX {formatCurrency(seatSelection.selectedSeats.length * parseFloat(trip.price))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service Fee</span>
                  <span>UGX {formatCurrency(2000)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span className="text-primary">UGX {formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Payment Method Display */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Payment Method:</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {paymentMethod.replace('_', ' ')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

