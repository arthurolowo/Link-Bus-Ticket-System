import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useToast } from "../hooks/use-toast";
import { getToken } from '../lib/authUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";

interface PaymentFormProps {
  bookingId: number;
  amount: string;
  onPaymentComplete: () => void;
  onPaymentError: () => void;
}

export default function PaymentForm({ bookingId, amount, onPaymentComplete, onPaymentError }: PaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 4-digit PIN",
        variant: "destructive",
      });
      return;
    }

    setShowPinDialog(false);
    await processPayment();
  };

  const initiatePayment = async () => {
    if (!phoneNumber) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter your mobile money number",
        variant: "destructive",
      });
      return;
    }

    // Show PIN dialog instead of proceeding directly
    setShowPinDialog(true);
  };

  const processPayment = async () => {
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
          provider,
          phoneNumber,
          pin // Include PIN in the request
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment initiation failed');
      }

      const data = await response.json();
      setPaymentId(data.paymentId);
      
      toast({
        title: "Payment Processing",
        description: `Your payment is being processed...`,
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
      setPin(""); // Clear PIN after use
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
    <>
      <div className="max-w-md mx-auto space-y-6 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Mobile Money Payment</h2>
          <p className="text-gray-600">Amount to pay: UGX {Number(amount).toLocaleString()}</p>
      </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Select Provider</Label>
            <RadioGroup
              value={provider}
              onValueChange={(value) => setProvider(value as 'mtn' | 'airtel')}
              className="grid grid-cols-2 gap-4"
            >
                    <div>
                <RadioGroupItem
                  value="mtn"
                  id="mtn"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="mtn"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="text-xl font-bold">MTN</span>
                  <span className="text-sm text-muted-foreground">Mobile Money</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="airtel"
                  id="airtel"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="airtel"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="text-xl font-bold">Airtel</span>
                  <span className="text-sm text-muted-foreground">Money</span>
                </Label>
              </div>
            </RadioGroup>
              </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Mobile Money Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
                </div>

          <Button
            className="w-full"
            onClick={initiatePayment}
            disabled={loading || !phoneNumber}
          >
            {loading ? "Processing..." : `Pay with ${provider.toUpperCase()}`}
          </Button>
        </div>
      </div>

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Mobile Money PIN</DialogTitle>
            <DialogDescription>
              Please enter your {provider.toUpperCase()} Mobile Money PIN to authorize the payment of UGX {Number(amount).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={setPin}
              render={({ slots }) => (
                <InputOTPGroup className="gap-2">
                  {slots.map((slot, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      {...slot}
                      className="w-12 h-12 text-2xl"
                    />
                  ))}
                </InputOTPGroup>
              )}
            />
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" onClick={() => setShowPinDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePinSubmit} disabled={pin.length !== 4}>
                Confirm Payment
              </Button>
      </div>
    </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

