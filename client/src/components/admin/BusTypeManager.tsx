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
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

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
  const { data: busTypes, isLoading } = useQuery<BusType[]>({
    queryKey: ['busTypes'],
    queryFn: async () => {
      const response = await fetch('/api/bus-types');
      if (!response.ok) throw new Error('Failed to fetch bus types');
      return response.json();
    },
  });

  // Add bus type mutation
  const addBusTypeMutation = useMutation({
    mutationFn: async (data: BusTypeFormData) => {
      const response = await fetch('/api/bus-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`/api/bus-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`/api/bus-types/${id}`, {
        method: 'DELETE',
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
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bus Types</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingBusType(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Bus Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBusType ? 'Edit Bus Type' : 'Add New Bus Type'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  value={formData.amenities.join(', ')}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value.split(',').map(s => s.trim()) })}
                />
              </div>
              <div>
                <Label htmlFor="totalSeats">Total Seats</Label>
                <Input
                  id="totalSeats"
                  type="number"
                  value={formData.totalSeats}
                  onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) })}
                  required
                  min={1}
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
        <div className="space-y-4">
          {busTypes?.map((busType) => (
            <div
              key={busType.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{busType.name}</h3>
                <p className="text-sm text-muted-foreground">{busType.description}</p>
                <div className="flex gap-2 mt-2">
                  {busType.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary">{amenity}</Badge>
                  ))}
                </div>
                <p className="text-sm mt-2">Total Seats: {busType.totalSeats}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(busType)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(busType.id)}
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