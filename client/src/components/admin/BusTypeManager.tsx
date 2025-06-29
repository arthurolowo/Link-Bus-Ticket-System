import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2, BusFront, Sofa, Wifi, Coffee, Power } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getToken } from '../../lib/authUtils';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription } from '../ui/alert';

const API_BASE_URL = 'http://localhost:5000';

interface BusType {
  id: number;
  name: string;
  description: string;
  amenities: string[];
  totalSeats: number;
  seatLayout?: {
    rows: number;
    columns: number;
    seats: {
      number: string;
      type: 'regular' | 'premium' | 'disabled';
      position: { row: number; column: number };
    }[];
  };
}

interface BusTypeFormData {
  name: string;
  description: string;
  amenities: string[];
  totalSeats: number;
}

// Map of amenity names to icons
const amenityIcons: Record<string, React.ReactNode> = {
  'WiFi': <Wifi className="w-4 h-4" />,
  'Power Outlets': <Power className="w-4 h-4" />,
  'Premium Seats': <Sofa className="w-4 h-4" />,
  'Refreshments': <Coffee className="w-4 h-4" />,
};

export function BusTypeManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBusType, setEditingBusType] = useState<BusType | null>(null);
  const [formData, setFormData] = useState<BusTypeFormData>({
    name: '',
    description: '',
    amenities: [],
    totalSeats: 0,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bus types
  const { data: busTypes, isLoading, error } = useQuery<BusType[]>({
    queryKey: ['busTypes'],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${API_BASE_URL}/api/buses/types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch bus types');
      }
      return response.json();
    },
  });

  // Add bus type mutation
  const addBusTypeMutation = useMutation({
    mutationFn: async (data: BusTypeFormData) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/buses/types`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add bus type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busTypes'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Bus type added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add bus type',
        variant: 'destructive',
      });
    },
  });

  // Update bus type mutation
  const updateBusTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BusTypeFormData> }) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/buses/types/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update bus type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busTypes'] });
      setEditingBusType(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Bus type updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update bus type',
        variant: 'destructive',
      });
    },
  });

  // Delete bus type mutation
  const deleteBusTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/buses/types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete bus type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busTypes'] });
      toast({
        title: 'Success',
        description: 'Bus type deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete bus type',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amenities: [],
      totalSeats: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBusType) {
      updateBusTypeMutation.mutate({ id: editingBusType.id, data: formData });
    } else {
      addBusTypeMutation.mutate(formData);
    }
  };

  const handleEdit = (busType: BusType) => {
    setEditingBusType(busType);
    setFormData({
      name: busType.name,
      description: busType.description,
      amenities: busType.amenities,
      totalSeats: busType.totalSeats,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this bus type?')) {
      deleteBusTypeMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading bus types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load bus types'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BusFront className="w-5 h-5" />
            Bus Types
          </CardTitle>
          <CardDescription>Configure and manage different types of buses in your fleet</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingBusType(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Bus Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBusType ? 'Edit Bus Type' : 'Add New Bus Type'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., VIP Executive"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="totalSeats">Total Seats</Label>
                  <Input
                    id="totalSeats"
                    type="number"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) })}
                    placeholder="e.g., 48"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the features and comfort level of this bus type"
                  className="h-24"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Textarea
                  id="amenities"
                  value={formData.amenities.join(', ')}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="WiFi, Power Outlets, Premium Seats, etc."
                  className="h-24"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingBusType ? 'Update' : 'Add'} Bus Type
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {busTypes?.map((busType) => (
              <Card key={busType.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-primary/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{busType.name}</CardTitle>
                    <Badge variant="outline">{busType.totalSeats} seats</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">{busType.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {busType.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {amenityIcons[amenity] || null}
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                  {busType.seatLayout && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Seat Layout</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {busType.seatLayout.rows} rows
                        </Badge>
                        <Badge variant="outline">
                          {busType.seatLayout.columns} columns
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-primary/5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(busType)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(busType.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 