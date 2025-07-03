import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  CheckCircle, 
  Download, 
  Share2, 
  QrCode, 
  Clock, 
  Bus,
  AlertTriangle
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

interface DigitalTicketProps {
  bookingId: number;
  onNewBooking: () => void;
}

interface BookingDetails {
  id: number;
  bookingReference: string;
  seatNumber: number;
  paymentStatus: string;
  totalAmount: string;
  qrCode: string;
  trip: {
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    route: {
      origin: string;
      destination: string;
      estimatedDuration: number | null;
    };
    bus: {
      busNumber: string;
      busType: {
        name: string;
      };
    };
  };
}

export default function DigitalTicket({ bookingId, onNewBooking }: DigitalTicketProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch booking details');
        }
        const data = await response.json();
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, toast]);

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    // Simulate PDF generation
    setTimeout(() => {
      setIsDownloading(false);
      // In a real implementation, this would trigger PDF download
      const link = document.createElement('a');
      link.href = '#'; // Would be actual PDF URL
      link.download = `ticket-${booking?.bookingReference}.pdf`;
      // link.click();
    }, 2000);
  };

  const handleShare = async () => {
    if (!booking) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Link Bus Ticket',
          text: `My bus ticket - ${booking.bookingReference}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `Bus Ticket ${booking.bookingReference}\n${booking.trip.route.origin} → ${booking.trip.route.destination}\n${new Date(booking.trip.departureDate).toLocaleDateString()} at ${booking.trip.departureTime}`
      );
      toast({
        title: "Copied to clipboard",
        description: "Ticket details have been copied to your clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
        <p className="text-gray-600 mb-4">We couldn't find the ticket details.</p>
        <Button onClick={onNewBooking}>Book Another Trip</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-muted-foreground">
            Your ticket has been sent to your email and is ready for download.
          </p>
        </div>

        {/* Digital Ticket */}
        <Card className="shadow-2xl overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-primary text-primary-foreground p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bus className="w-6 h-6" />
                  <span className="text-xl font-bold">Link Bus</span>
                </div>
                <div className="text-sm opacity-90">
                  Booking Reference: {booking.bookingReference}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">E-TICKET</div>
                <div className="text-sm opacity-90">Valid for travel</div>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Journey Details */}
            <div className="border-t border-b border-border py-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xl font-bold">{booking.trip.route.origin.toUpperCase()}</div>
                  <div className="text-sm text-muted-foreground">Departure</div>
                  <div className="text-lg font-semibold text-primary mt-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {booking.trip.departureTime}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(booking.trip.departureDate).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                
                <div className="flex-1 mx-8">
                  <div className="flex items-center justify-center">
                    <div className="flex-1 h-px bg-border"></div>
                    <div className="mx-4 text-muted-foreground">
                      <Bus className="w-6 h-6 text-primary" />
                      <div className="text-xs mt-1">
                        {booking.trip.route.estimatedDuration ? 
                          `${Math.floor(booking.trip.route.estimatedDuration / 60)}h ${booking.trip.route.estimatedDuration % 60}m` : 
                          'Direct'
                        }
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold">{booking.trip.route.destination.toUpperCase()}</div>
                  <div className="text-sm text-muted-foreground">Arrival</div>
                  <div className="text-lg font-semibold text-primary mt-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {booking.trip.arrivalTime}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(booking.trip.departureDate).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bus and Seat Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Bus Service</div>
                <div className="font-semibold">{booking.trip.bus.busType.name}</div>
                <div className="text-xs text-muted-foreground">Bus {booking.trip.bus.busNumber}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Seat Number</div>
                <div className="text-xl font-bold text-primary">
                  #{booking.seatNumber}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Total Paid</div>
                <div className="font-semibold">UGX {parseInt(booking.totalAmount).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Incl. fees</div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="flex justify-center mb-6">
              <Badge className={
                booking.paymentStatus === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : booking.paymentStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }>
                Payment {booking.paymentStatus}
              </Badge>
            </div>

            {/* QR Code */}
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-white border-2 border-border rounded-lg">
                <div className="w-32 h-32 bg-muted border-2 border-dashed border-muted-foreground rounded flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <div className="text-xs text-muted-foreground font-mono">
                      {booking.bookingReference}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Show this QR code to the driver when boarding
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-amber-800 mb-1">Important Information</div>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Please arrive at the station 15 minutes before departure</li>
                    <li>• Keep your ticket and ID ready for verification</li>
                    <li>• Cancellation allowed up to 2 hours before departure</li>
                    <li>• Contact +256 700 123 456 for any assistance</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </Button>
              <Button 
                onClick={handleShare}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Ticket
              </Button>
              <Button 
                onClick={onNewBooking}
                variant="outline"
                className="flex-1"
              >
                Book Another Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

