import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';

interface Route {
  id: number;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
}

export default function RoutesPage() {
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await fetch('/api/routes');
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Available Routes</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {routes?.map((route) => (
          <Card key={route.id} className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
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
                <span className="font-medium">{Math.round(route.estimatedDuration / 60)} hours</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 