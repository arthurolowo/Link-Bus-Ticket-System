import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { useToast } from "../hooks/use-toast";
import { getToken } from "../lib/authUtils";
import { formatCurrency } from "../lib/utils";
import jsPDF from 'jspdf';

interface PaymentFormProps {
  bookingId: number;
  amount: string;
  onPaymentComplete: () => void;
  onPaymentError: () => void;
  passengerDetails: {
    name: string;
    phone: string;
    email?: string;
  };
  selectedSeats: string[];
  tripDetails: {
    origin: string;
    destination: string;
    departureDate: string;
    departureTime: string;
  };
}

interface PaymentRequest {
  bookingId: number;
  amount: string;
  paymentMethod: 'mobile_money';
  provider: 'mtn' | 'airtel';
  phoneNumber: string;
  password: string;
}

export default function PaymentForm({ 
  bookingId, 
  amount, 
  onPaymentComplete, 
  onPaymentError,
  passengerDetails,
  selectedSeats,
  tripDetails
}: PaymentFormProps) {
  const [provider, setProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validatePaymentRequest = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!bookingId) {
      errors.push('Invalid booking reference');
    }
    if (!amount) {
      errors.push('Invalid payment amount');
    }
    if (!provider) {
      errors.push('Please select a payment provider');
    }
    if (!phoneNumber) {
      errors.push('Please enter your mobile money number');
    } else {
      const phoneRegex = /^256[7][0-9]{8}$/;
      if (!phoneRegex.test(phoneNumber)) {
        errors.push('Invalid phone number format. Use format: 256701234567');
      }
    }
    if (!password) {
      errors.push('Please enter your account password');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const generateReceipt = async (paymentData: any) => {
    try {
      const doc = new jsPDF();
      
      // Add company logo or header
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text('Link Bus Services', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text('E-Receipt', 105, 30, { align: 'center' });
      
      // Add decorative line
      doc.setDrawColor(0, 102, 204); // Blue color
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      // Add receipt details
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const startY = 45;
      const lineHeight = 7;
      let currentY = startY;
      
      // Receipt header info
      doc.setFont("helvetica", "bold");
      doc.text('Receipt Details:', 20, currentY);
      doc.setFont("helvetica", "normal");
      currentY += lineHeight;
      doc.text(`Reference: ${paymentData.bookingReference || 'N/A'}`, 30, currentY);
      currentY += lineHeight;
      doc.text(`Payment ID: ${paymentData.paymentId}`, 30, currentY);
      currentY += lineHeight;
      doc.text(`Date: ${new Date().toLocaleString('en-UG', { 
        timeZone: 'Africa/Kampala',
        dateStyle: 'full',
        timeStyle: 'short'
      })}`, 30, currentY);
      currentY += lineHeight * 1.5;
      
      // Trip details
      doc.setFont("helvetica", "bold");
      doc.text('Trip Details:', 20, currentY);
      doc.setFont("helvetica", "normal");
      currentY += lineHeight;
      doc.text(`Route: ${tripDetails.origin} → ${tripDetails.destination}`, 30, currentY);
      currentY += lineHeight;
      doc.text(`Date: ${new Date(tripDetails.departureDate).toLocaleDateString('en-UG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, 30, currentY);
      currentY += lineHeight;
      doc.text(`Departure Time: ${tripDetails.departureTime}`, 30, currentY);
      currentY += lineHeight;
      doc.text(`Seat(s): ${selectedSeats.join(', ')}`, 30, currentY);
      currentY += lineHeight * 1.5;
      
      // Passenger details
      doc.setFont("helvetica", "bold");
      doc.text('Passenger Details:', 20, currentY);
      doc.setFont("helvetica", "normal");
      currentY += lineHeight;
      doc.text(`Name: ${passengerDetails.name}`, 30, currentY);
      currentY += lineHeight;
      doc.text(`Phone: ${passengerDetails.phone}`, 30, currentY);
      if (passengerDetails.email) {
        currentY += lineHeight;
        doc.text(`Email: ${passengerDetails.email}`, 30, currentY);
      }
      currentY += lineHeight * 1.5;
      
      // Payment details
      doc.setFont("helvetica", "bold");
      doc.text('Payment Details:', 20, currentY);
      doc.setFont("helvetica", "normal");
      currentY += lineHeight;
      doc.text(`Amount: UGX ${formatCurrency(parseFloat(amount))}`, 30, currentY);
      currentY += lineHeight;
      doc.text(`Payment Method: ${provider.toUpperCase()} Mobile Money`, 30, currentY);
      currentY += lineHeight;
      doc.text(`Status: Completed`, 30, currentY);
      
      // Add footer
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128); // Gray color
      doc.text('This is an electronically generated receipt.', 105, 270, { align: 'center' });
      doc.setFont("helvetica", "bold");
      doc.text('Thank you for choosing Link Bus Services', 105, 277, { align: 'center' });
      
      // Add QR code or barcode for verification (optional)
      // You can add a QR code library if needed
      
      // Save the PDF with a meaningful name
      const fileName = `link-bus-receipt-${paymentData.bookingReference || paymentData.paymentId}.pdf`;
      doc.save(fileName);
      
      return true;
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "Receipt Generation Failed",
        description: "Failed to generate receipt. Please contact support.",
        variant: "destructive"
      });
      return false;
    }
  };

  const processPayment = async () => {
    try {
      // Validate all required fields
      const validation = validatePaymentRequest();
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: validation.errors.join('\n'),
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const paymentRequest: PaymentRequest = {
        bookingId,
        amount,
        paymentMethod: 'mobile_money',
        provider,
        phoneNumber,
        password
      };

      console.log('Initiating payment with data:', {
        ...paymentRequest,
        password: '[REDACTED]'
      });

      const response = await fetch('http://localhost:5000/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate payment');
      }

      const paymentData = await response.json();
      
      toast({
        title: "Payment Initiated",
        description: "Processing your payment. Please wait...",
      });

      // Poll for payment status
      const isSuccess = await pollPaymentStatus(paymentData.paymentId);
      
      if (isSuccess) {
        // Generate and download receipt
        await generateReceipt({
          paymentId: paymentData.paymentId,
          bookingReference: paymentData.bookingReference
        });
        
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully. The receipt has been downloaded.",
        });
        onPaymentComplete();
      } else {
        onPaymentError();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
      onPaymentError();
    } finally {
      setLoading(false);
      setPassword("");
    }
  };

  const pollPaymentStatus = async (pid: string) => {
    const token = getToken();
    if (!token) {
      onPaymentError();
      return false;
    }

    const maxAttempts = 10; // Reduced from 20 to make it faster
    let attempts = 0;

    const checkStatus = async (): Promise<boolean> => {
      try {
        const response = await fetch(`http://localhost:5000/api/payments/${pid}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to check payment status');
        }

        const data = await response.json();
        
        if (data.status === 'completed') {
          return true;
        } else if (data.status === 'failed') {
          toast({
            title: "Payment Failed",
            description: "The payment could not be processed. Please try again.",
            variant: "destructive"
          });
          return false;
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Reduced from 6000ms to 3000ms
          return checkStatus();
        } else {
          toast({
            title: "Payment Timeout",
            description: "The payment is taking longer than expected. Please check your booking status later.",
            variant: "destructive"
          });
          return false;
        }
      } catch (error) {
        console.error('Payment status check error:', error);
        toast({
          title: "Error",
          description: "Failed to check payment status",
          variant: "destructive"
        });
        return false;
      }
    };

    return checkStatus();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant={provider === 'mtn' ? 'default' : 'outline'}
                  onClick={() => setProvider('mtn')}
                >
                  MTN Mobile Money
                </Button>
                <Button
                  type="button"
                  variant={provider === 'airtel' ? 'default' : 'outline'}
                  onClick={() => setProvider('airtel')}
                >
                  Airtel Money
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Mobile Money Number</Label>
              <Input
                id="phone"
                placeholder="256701234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter your number in format: 256701234567
              </p>
            </div>

            <div>
              <Label htmlFor="password">Account Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter your account password to authorize the payment
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between mb-2">
                <span>Amount</span>
                <span>UGX {formatCurrency(parseFloat(amount))}</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={processPayment}
              disabled={loading || !phoneNumber || !password}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Pay UGX ${formatCurrency(parseFloat(amount))}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Route</p>
              <p className="font-semibold">
                {tripDetails.origin} → {tripDetails.destination}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="font-semibold">
                {new Date(tripDetails.departureDate).toLocaleDateString()} at {tripDetails.departureTime}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Selected Seats</p>
              <p className="font-semibold">{selectedSeats.join(', ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Passenger Details</p>
              <p className="font-semibold">{passengerDetails.name}</p>
              <p className="text-sm">{passengerDetails.phone}</p>
              {passengerDetails.email && (
                <p className="text-sm">{passengerDetails.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

