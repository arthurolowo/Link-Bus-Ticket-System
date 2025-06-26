import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';

interface Booking {
  id: number;
  bookingReference: string;
  tripId: number;
  seatNumber: number;
  paymentStatus: string;
  totalAmount: string;
  createdAt: string;
  trip: {
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    route: {
      origin: string;
      destination: string;
    };
    bus: {
      busNumber: string;
      busType: {
        name: string;
      };
    };
  };
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/bookings/user');
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError('Failed to load bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Login</h1>
          <p className="text-gray-600">You need to be logged in to view your bookings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage your bus ticket bookings</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">You don't have any bookings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Booking #{booking.bookingReference}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    booking.paymentStatus === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : booking.paymentStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Route</p>
                    <p className="font-medium">{booking.trip.route.origin} → {booking.trip.route.destination}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{new Date(booking.trip.departureDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">{booking.trip.departureTime} - {booking.trip.arrivalTime}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Bus</p>
                      <p className="font-medium">{booking.trip.bus.busType.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Seat</p>
                      <p className="font-medium">#{booking.seatNumber}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium">UGX {parseInt(booking.totalAmount).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 