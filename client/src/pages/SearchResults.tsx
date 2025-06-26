import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BusResults } from '../components/BusResults';

interface SearchState {
  from: string;
  to: string;
  date: string;
  passengers: string;
}

interface Trip {
  id: number;
  routeId: number;
  busId: number;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  availableSeats: number;
  status: string;
  route: {
    origin: string;
    destination: string;
    distance: number;
    estimatedDuration: number;
  };
  bus: {
    busNumber: string;
    busType: {
      name: string;
      description: string;
      amenities: string[];
    };
  };
}

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = location.state as SearchState;

  useEffect(() => {
    if (!searchParams) {
      navigate('/');
      return;
    }

    const fetchTrips = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          origin: searchParams.from,
          destination: searchParams.to,
          date: new Date(searchParams.date).toISOString().split('T')[0],
        });

        const response = await fetch(`/api/trips/search?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trips');
        }

        const data = await response.json();
        setTrips(data);
      } catch (error) {
        console.error('Error fetching trips:', error);
        setError('Failed to load available trips. Please try again.');
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [searchParams, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        <p className="text-gray-600">
          Showing buses from {searchParams?.from} to {searchParams?.to} on{' '}
          {new Date(searchParams?.date).toLocaleDateString()}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <BusResults buses={trips} loading={loading} />
    </div>
  );
} 