import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { formatCurrency } from '../../lib/utils';

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

interface Route {
  id: number;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  isActive: number;
}

interface Bus {
  id: number;
  busNumber: string;
  busTypeId: number;
  isActive: number;
  busType: {
    name: string;
    totalSeats: number;
  };
}

interface TripFormData {
  routeId: number;
  busId: number;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  status: string;
}

export function TripManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState<TripFormData>({
    routeId: 0,
    busId: 0,
    departureDate: '',
    departureTime: '',
    arrivalTime: '',
    price: '',
    status: 'scheduled',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch trips
  const { data: trips, isLoading: isLoadingTrips } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await fetch('/api/trips');
      if (!response.ok) throw new Error('Failed to fetch trips');
      return response.json();
    },
  });

  // Fetch routes
  const { data: routes } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await fetch('/api/routes');
      if (!response.ok) throw new Error('Failed to fetch routes');
      return response.json();
    },
  });

  // Fetch buses
  const { data: buses } = useQuery<Bus[]>({
    queryKey: ['buses'],
    queryFn: async () => {
      const response = await fetch('/api/buses');
      if (!response.ok) throw new Error('Failed to fetch buses');
      return response.json();
    },
  });

  // Add trip mutation
  const addTripMutation = useMutation({
    mutationFn: async (data: TripFormData) => {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add trip');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Trip added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add trip',
        variant: 'destructive',
      });
    },
  });

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TripFormData> }) => {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update trip');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setEditingTrip(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Trip updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update trip',
        variant: 'destructive',
      });
    },
  });

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete trip');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({
        title: 'Success',
        description: 'Trip deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete trip',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      routeId: 0,
      busId: 0,
      departureDate: '',
      departureTime: '',
      arrivalTime: '',
      price: '',
      status: 'scheduled',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrip) {
      updateTripMutation.mutate({ id: editingTrip.id, data: formData });
    } else {
      addTripMutation.mutate(formData);
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      routeId: trip.routeId,
      busId: trip.busId,
      departureDate: trip.departureDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      price: trip.price,
      status: trip.status,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      deleteTripMutation.mutate(id);
    }
  };

  if (isLoadingTrips) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Trips & Fares</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTrip(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTrip ? 'Edit Trip' : 'Add New Trip'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="route">Route</Label>
                <Select
                  value={formData.routeId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, routeId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes?.map((route) => (
                      <SelectItem key={route.id} value={route.id.toString()}>
                        {route.origin} → {route.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bus">Bus</Label>
                <Select
                  value={formData.busId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, busId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses?.map((bus) => (
                      <SelectItem key={bus.id} value={bus.id.toString()}>
                        {bus.busNumber} ({bus.busType.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="departureDate">Departure Date</Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="departureTime">Departure Time</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="arrivalTime">Arrival Time</Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price (UGX)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min={0}
                  step={1000}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingTrip ? 'Update' : 'Add'} Trip
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trips?.map((trip) => (
            <div
              key={trip.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{trip.route.origin} → {trip.route.destination}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(trip.departureDate).toLocaleDateString()} | {trip.departureTime} - {trip.arrivalTime}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge>{trip.bus.busType.name}</Badge>
                  <Badge variant="outline">{trip.bus.busNumber}</Badge>
                  <Badge variant="secondary">UGX {formatCurrency(trip.price)}</Badge>
                </div>
                <p className="text-sm mt-2">Available Seats: {trip.availableSeats}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(trip)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(trip.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 