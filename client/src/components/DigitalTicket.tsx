import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Download, 
  Share2, 
  QrCode, 
  Calendar, 
  Clock, 
  MapPin,
  Bus,
  User,
  Phone,
  Mail,
  AlertTriangle
} from "lucide-react";
import type { Booking, TripWithDetails } from "@/types";
import { formatCurrency } from '@/lib/utils';

interface DigitalTicketProps {
  booking: Booking;
  trip: TripWithDetails;
  onNewBooking: () => void;
}

export default function DigitalTicket({ booking, trip, onNewBooking }: DigitalTicketProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    // Simulate PDF generation
    setTimeout(() => {
      setIsDownloading(false);
      // In a real implementation, this would trigger PDF download
      const link = document.createElement('a');
      link.href = '#'; // Would be actual PDF URL
      link.download = `ticket-${booking.bookingReference}.pdf`;
      // link.click();
    }, 2000);
  };

  const handleShare = async () => {
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
        `Bus Ticket ${booking.bookingReference}\n${trip.route.origin} → ${trip.route.destination}\n${new Date(trip.departureDate).toLocaleDateString()} at ${trip.departureTime}`
      );
    }
  };

  // Generate QR code data (in a real app, this would be a proper QR code)
  const qrCodeData = `LB:${booking.bookingReference}:${booking.id}:${trip.id}`;

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
            {/* Passenger Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Passenger Name</div>
                <div className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {booking.passengerName}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Phone Number</div>
                <div className="font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {booking.passengerPhone}
                </div>
              </div>
            </div>

            {/* Journey Details */}
            <div className="border-t border-b border-border py-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xl font-bold">{trip.route.origin.toUpperCase()}</div>
                  <div className="text-sm text-muted-foreground">Departure</div>
                  <div className="text-lg font-semibold text-primary mt-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {trip.departureTime}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(trip.departureDate).toLocaleDateString('en-GB', {
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
                        {trip.route.estimatedDuration ? 
                          `${Math.floor(trip.route.estimatedDuration / 60)}h ${trip.route.estimatedDuration % 60}m` : 
                          'Direct'
                        }
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold">{trip.route.destination.toUpperCase()}</div>
                  <div className="text-sm text-muted-foreground">Arrival</div>
                  <div className="text-lg font-semibold text-primary mt-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {trip.arrivalTime}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(trip.departureDate).toLocaleDateString('en-GB', {
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
                <div className="font-semibold">{trip.bus.busType.name}</div>
                <div className="text-xs text-muted-foreground">Bus {trip.bus.busNumber}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Seat Number{Array.isArray(booking.seatNumbers) && booking.seatNumbers.length > 1 ? 's' : ''}</div>
                <div className="text-xl font-bold text-primary">
                  {Array.isArray(booking.seatNumbers) 
                    ? booking.seatNumbers.join(', ') 
                    : booking.seatNumbers}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Total Paid</div>
                <div className="font-semibold">UGX {formatCurrency(booking.totalAmount)}</div>
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
                className="flex-1 btn-primary"
              >
                {isDownloading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating PDF...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </div>
                )}
              </Button>
              <Button 
                onClick={handleShare}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Ticket
              </Button>
            </div>

            {/* New Booking Button */}
            <div className="mt-6 pt-6 border-t border-border text-center">
              <Button 
                onClick={onNewBooking}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Book Another Journey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
