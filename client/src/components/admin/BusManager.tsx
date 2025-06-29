import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2, Bus, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getToken } from '../../lib/authUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';

const API_BASE_URL = 'http://localhost:5000';

interface Bus {
  id: number;
  busNumber: string;
  busTypeId: number;
  isActive: boolean;
  busType: {
    id: number;
    name: string;
    description: string;
    amenities: string[];
    totalSeats: number;
  };
}

interface BusFormData {
  busNumber: string;
  busTypeId: number;
  isActive: boolean;
}

export function BusManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState<BusFormData>({
    busNumber: '',
    busTypeId: 0,
    isActive: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch buses
  const { data: buses, isLoading: isLoadingBuses, error: busesError } = useQuery<Bus[]>({
    queryKey: ['buses'],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${API_BASE_URL}/api/buses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch buses');
      }
      return response.json();
    },
  });

  // Fetch bus types for the select dropdown
  const { data: busTypes, isLoading: isLoadingBusTypes, error: busTypesError } = useQuery({
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

  // Add bus mutation
  const addBusMutation = useMutation({
    mutationFn: async (data: BusFormData) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/buses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add bus');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Bus added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add bus',
        variant: 'destructive',
      });
    },
  });

  // Update bus mutation
  const updateBusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BusFormData> }) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/buses/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update bus');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setEditingBus(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Bus updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update bus',
        variant: 'destructive',
      });
    },
  });

  // Delete bus mutation
  const deleteBusMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/buses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete bus');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      toast({
        title: 'Success',
        description: 'Bus deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete bus',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      busNumber: '',
      busTypeId: 0,
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBus) {
      updateBusMutation.mutate({ id: editingBus.id, data: formData });
    } else {
      addBusMutation.mutate(formData);
    }
  };

  const handleEdit = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      busNumber: bus.busNumber,
      busTypeId: bus.busTypeId,
      isActive: bus.isActive,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      deleteBusMutation.mutate(id);
    }
  };

  if (isLoadingBuses || isLoadingBusTypes) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading buses...</p>
        </div>
      </div>
    );
  }

  if (busesError || busTypesError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {busesError instanceof Error ? busesError.message : 'Failed to load buses'}
          {busTypesError instanceof Error ? busTypesError.message : ''}
        </AlertDescription>
      </Alert>
    );
  }

  const activeBuses = buses?.filter(bus => bus.isActive) || [];
  const inactiveBuses = buses?.filter(bus => !bus.isActive) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5" />
            Fleet Management
          </CardTitle>
          <CardDescription>Manage your bus fleet and their operational status</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingBus(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Bus
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBus ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="busNumber">Bus Number</Label>
                <Input
                  id="busNumber"
                  value={formData.busNumber}
                  onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                  placeholder="Enter bus registration number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="busType">Bus Type</Label>
                <Select
                  value={formData.busTypeId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, busTypeId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bus type" />
                  </SelectTrigger>
                  <SelectContent>
                    {busTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name} ({type.totalSeats} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingBus ? 'Update' : 'Add'} Bus
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active" className="flex items-center gap-2">
              Active Buses
              <Badge variant="secondary" className="ml-2">{activeBuses.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              Inactive Buses
              <Badge variant="secondary" className="ml-2">{inactiveBuses.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid gap-4">
                {activeBuses.map((bus) => (
                  <Card key={bus.id} className="p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          {bus.busNumber}
                          <Badge variant="default" className="ml-2">Active</Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground">Type: {bus.busType.name}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {bus.busType.totalSeats} seats
                          </Badge>
                          {bus.busType.amenities?.slice(0, 3).map((amenity, index) => (
                            <Badge key={index} variant="secondary">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(bus)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(bus.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="inactive">
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid gap-4">
                {inactiveBuses.map((bus) => (
                  <Card key={bus.id} className="p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          {bus.busNumber}
                          <Badge variant="secondary" className="ml-2">Inactive</Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground">Type: {bus.busType.name}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {bus.busType.totalSeats} seats
                          </Badge>
                          {bus.busType.amenities?.slice(0, 3).map((amenity, index) => (
                            <Badge key={index} variant="secondary">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(bus)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(bus.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 