import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "../hooks/use-toast";
import { getToken } from '../lib/authUtils';

interface PaymentFormProps {
  bookingId: number;
  amount: string;
  onPaymentComplete: () => void;
  onPaymentError: () => void;
}

export default function PaymentForm({ bookingId, amount, onPaymentComplete, onPaymentError }: PaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const { toast } = useToast();

  const initiatePayment = async () => {
    if (!phoneNumber) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter your mobile money number",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          bookingId,
          amount,
          paymentMethod: 'mobile_money',
          phoneNumber
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment initiation failed');
      }

      const data = await response.json();
      setPaymentId(data.paymentId);
      
      toast({
        title: "Payment Initiated",
        description: "Please check your phone for the payment prompt.",
      });

      // Start polling payment status
      pollPaymentStatus(data.paymentId);
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
    }
  };

  const pollPaymentStatus = async (pid: string) => {
    const token = getToken();
    if (!token) {
      onPaymentError();
      return;
    }

    const maxAttempts = 20; // Poll for up to 2 minutes (6 seconds * 20)
    let attempts = 0;

    const checkStatus = async () => {
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
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully.",
          });
          onPaymentComplete();
          return;
        } else if (data.status === 'failed') {
          toast({
            title: "Payment Failed",
            description: "The payment could not be processed. Please try again.",
            variant: "destructive"
          });
          onPaymentError();
          return;
        }

        // Continue polling if payment is still pending
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 6000); // Check every 6 seconds
        } else {
          toast({
            title: "Payment Timeout",
            description: "The payment is taking longer than expected. Please check your booking status later.",
            variant: "destructive"
          });
          onPaymentError();
        }
      } catch (error) {
        console.error('Payment status check error:', error);
        toast({
          title: "Error",
          description: "Failed to check payment status",
          variant: "destructive"
        });
        onPaymentError();
      }
    };

    checkStatus();
  };

  return (
    <div className="max-w-md mx-auto space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Mobile Money Payment</h2>
        <p className="text-gray-600">Amount to pay: UGX {Number(amount).toLocaleString()}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Mobile Money Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="Enter your phone number (e.g., 256771234567)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading || !!paymentId}
          />
          <p className="text-sm text-gray-500">
            Enter your phone number in international format (e.g., 256771234567)
          </p>
        </div>

        {!paymentId && (
          <Button
            className="w-full"
            onClick={initiatePayment}
            disabled={loading || !phoneNumber}
          >
            {loading ? "Processing..." : "Pay Now"}
          </Button>
        )}

        {paymentId && (
          <div className="text-center space-y-4">
            <div className="animate-pulse">
              <p className="text-lg font-semibold">Waiting for payment confirmation...</p>
              <p className="text-sm text-gray-600">Please complete the payment on your phone</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Cancel Payment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

