import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { API_BASE_URL } from '../config/api';

interface Route {
  id: number;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  isActive: number;
}

export default function RoutesPage() {
  const { data: routes, isLoading, error } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/routes`);
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Available Routes</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="mb-4">
                <Skeleton className="h-6 w-3/4" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Available Routes</h1>
        <div className="p-4 text-red-600 bg-red-50 rounded-lg">
          Error loading routes. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Available Routes</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {routes?.filter(route => route.isActive).map((route) => (
          <Card key={route.id} className="p-6 hover:shadow-lg transition-all duration-300">
            <div className="mb-4">
              <h3 className="text-lg font-semibold capitalize">
                {route.origin} → {route.destination}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Distance</span>
                <span className="font-medium">{route.distance} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Duration</span>
                <span className="font-medium">{Math.round(route.estimatedDuration)} hours</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 